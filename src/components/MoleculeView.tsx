/**
 * MoleculeView - Core 3D molecular visualization component
 * Renders ball-and-stick model with CPK coloring using three.js + expo-gl
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { GLView } from 'expo-gl';
import * as THREE from 'three';
import { Renderer } from 'expo-three';
import { Molecule, Atom, Bond, VisualizationMode } from '../types/protein.types';
import { SceneObjects, createMoleculeScene } from '../utils/moleculeSceneBuilder';
import OrbitControlView from './OrbitControlView';
import AtomLabelsOverlay from './AtomLabelsOverlay';
import { useElementHighlight } from '../hooks/useElementHighlight';
import { useRaycast } from '../hooks/useRaycast';

interface MoleculeViewProps {
  molecule: Molecule | null;
  visualizationMode?: VisualizationMode;
  showAtomLabels?: boolean;
  selectedElement?: string | null;
  onAtomSelect?: (atom: Atom) => void;
  onAtomDeselect?: () => void;
  onBondSelect?: (bond: Bond, length: number) => void;
  backgroundColor?: string;
}

export interface MoleculeViewHandle {
  takeSnapshotAsync: (options?: { format?: string; quality?: number }) => Promise<unknown>;
  captureFramesForGif: (
    frameCount: number,
    intervalMs: number,
    onProgress?: (captured: number, total: number) => void
  ) => Promise<{ frames: Uint8Array[]; width: number; height: number }>;
}

const MoleculeView = React.forwardRef<MoleculeViewHandle, MoleculeViewProps>(
  ({
    molecule,
    visualizationMode = 'ball-stick',
    showAtomLabels = false,
    selectedElement = null,
    onAtomSelect,
    onAtomDeselect,
    onBondSelect,
    backgroundColor = '#000000',
  }, ref) => {
    const glViewRef = useRef<GLView>(null);
    const glContextRef = useRef<WebGLRenderingContext | null>(null);
    const sceneRef = useRef<SceneObjects | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const [, setIsReady] = useState(false);

    const showAtomLabelsRef = useRef(showAtomLabels);
    const labelAnimatedPositions = useRef<Map<string, { x: Animated.Value; y: Animated.Value }>>(new Map());
    const viewSizeRef = useRef({ width: 375, height: 667 });
    const [showLabelsOverlay, setShowLabelsOverlay] = useState(false);
    const loopGenerationRef = useRef(0);
    const lerpingRef = useRef<{
      targetStart: THREE.Vector3;
      targetEnd: THREE.Vector3;
      posStart: THREE.Vector3;
      posEnd: THREE.Vector3;
      progress: number;
    } | null>(null);

    const handleLayout = useCallback((e: any) => {
      const { width, height } = e.nativeEvent.layout;
      viewSizeRef.current = { width, height };
    }, []);

    useEffect(() => {
      showAtomLabelsRef.current = showAtomLabels;
      labelAnimatedPositions.current.clear();

      if (showAtomLabels && molecule) {
        molecule.atoms.forEach(atom => {
          labelAnimatedPositions.current.set(atom.id, {
            x: new Animated.Value(-1000),
            y: new Animated.Value(-1000),
          });
        });
      }

      setShowLabelsOverlay(showAtomLabels && !!molecule);
    }, [showAtomLabels, molecule]);

    // Update scene background when backgroundColor changes
    useEffect(() => {
      if (sceneRef.current) {
        const color = new THREE.Color(backgroundColor);
        sceneRef.current.scene.background = color;
      }
    }, [backgroundColor]);

    const handleGLContextCreate = useCallback(
      async (gl: WebGLRenderingContext) => {
        glContextRef.current = gl;

        if (!molecule || !molecule.atoms || molecule.atoms.length === 0) {
          console.warn('MoleculeView: GL Context created, but no molecule data yet.');
          return;
        }

        try {
          // Get dimensions
          const { width, height } = gl.drawingBufferWidth && gl.drawingBufferHeight
            ? { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight }
            : { width: 375, height: 667 };

          // Create scene with current visualization mode and background color
          const sceneObjects = createMoleculeScene(gl, molecule.atoms, molecule.bonds, width, height, visualizationMode, undefined, backgroundColor);
          sceneRef.current = sceneObjects;

          // Connect controls to the view
          if (orbitControlViewRef.current) {
            orbitControlViewRef.current.setControls(sceneObjects.controls);
          }

          // Animation loop
          (sceneObjects as any).isRenderLoopActive = true;

          loopGenerationRef.current++;
          const myGeneration = loopGenerationRef.current;
          const labelVec = new THREE.Vector3();
          let lastFrameTime = Date.now();
          const animate = () => {
            if (myGeneration !== loopGenerationRef.current) return;
            animationFrameRef.current = requestAnimationFrame(animate);

            const now = Date.now();
            const frameDelta = now - lastFrameTime;
            lastFrameTime = now;
            const underPressure = frameDelta > 20; // frame took >20ms → below 50 FPS

            try {
              if (lerpingRef.current) {
                const lerp = lerpingRef.current;
                lerp.progress = Math.min(lerp.progress + 0.06, 1);
                const t = 1 - Math.pow(1 - lerp.progress, 3);
                sceneObjects.camera.position.lerpVectors(lerp.posStart, lerp.posEnd, t);
                sceneObjects.controls.target.lerpVectors(lerp.targetStart, lerp.targetEnd, t);
                if (lerp.progress >= 1) lerpingRef.current = null;
              }
              sceneObjects.controls.update();
              sceneObjects.directionalLight.position.copy(sceneObjects.camera.position);
              sceneObjects.renderer.render(sceneObjects.scene, sceneObjects.camera);
              if (sceneRef.current?.pendingCapture) {
                sceneRef.current.pendingCapture();
                sceneRef.current.pendingCapture = null;
              }
              (gl as any).endFrameEXP?.();

              if (showAtomLabelsRef.current && molecule && !underPressure) {
                const cam = sceneObjects.camera;
                const { width: vw, height: vh } = viewSizeRef.current;
                molecule.atoms.forEach(atom => {
                  const lv = labelAnimatedPositions.current.get(atom.id);
                  if (!lv) return;
                  labelVec.set(atom.x, atom.y, atom.z);
                  labelVec.project(cam);
                  if (labelVec.z < 1.0) {
                    lv.x.setValue((labelVec.x + 1) / 2 * vw - 8);
                    lv.y.setValue((1 - labelVec.y) / 2 * vh - 8);
                  } else {
                    lv.x.setValue(-1000);
                    lv.y.setValue(-1000);
                  }
                });
              }
            } catch (e: any) {
              console.warn('Initial render loop error (recovering next frame):', e.message);
            }
          };

          animate();
          setIsReady(true);
        } catch (error) {
          console.error('Error creating molecule scene:', error);
        }
      },
      [molecule, visualizationMode, backgroundColor]
    );

    // Recreate scene when visualization mode changes or molecule data loads
    useEffect(() => {
      const gl = glContextRef.current;
      if (!gl || !molecule || molecule.atoms.length === 0) {
        return;
      }

      try {
        // Stop old animation loop
        if (sceneRef.current) {
          (sceneRef.current as any).isRenderLoopActive = false;
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        // Keep renderer if it exists
        let existingRenderer: Renderer | undefined = undefined;

        // Dispose old scene if it exists
        if (sceneRef.current) {
          const { scene, atomMeshes, bondMeshes, renderer } = sceneRef.current;
          existingRenderer = renderer;

          atomMeshes.forEach((mesh) => {
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m) => m.dispose());
              } else {
                mesh.material.dispose();
              }
            }
            scene.remove(mesh);
          });
          bondMeshes.forEach((mesh) => {
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m) => m.dispose());
              } else {
                mesh.material.dispose();
              }
            }
            scene.remove(mesh);
          });
          scene.clear();
        }

        // Get dimensions
        const { width, height } = gl.drawingBufferWidth && gl.drawingBufferHeight
          ? { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight }
          : { width: 375, height: 667 };

        // Create new scene with updated visualization mode, reusing renderer
        const newSceneObjects = createMoleculeScene(gl, molecule.atoms, molecule.bonds, width, height, visualizationMode, existingRenderer, backgroundColor);
        sceneRef.current = newSceneObjects;

        // Connect controls to the view
        if (orbitControlViewRef.current) {
          orbitControlViewRef.current.setControls(newSceneObjects.controls);
        }

        // Restart animation loop
        (newSceneObjects as any).isRenderLoopActive = true;
        loopGenerationRef.current++;
        const myGeneration2 = loopGenerationRef.current;
        const labelVec2 = new THREE.Vector3();
        let lastFrameTime2 = Date.now();
        const animate = () => {
          if (myGeneration2 !== loopGenerationRef.current) return;
          animationFrameRef.current = requestAnimationFrame(animate);
          const now2 = Date.now();
          const frameDelta2 = now2 - lastFrameTime2;
          lastFrameTime2 = now2;
          const underPressure2 = frameDelta2 > 20;
          try {
            if (lerpingRef.current) {
              const lerp = lerpingRef.current;
              lerp.progress = Math.min(lerp.progress + 0.06, 1);
              const t = 1 - Math.pow(1 - lerp.progress, 3);
              newSceneObjects.camera.position.lerpVectors(lerp.posStart, lerp.posEnd, t);
              newSceneObjects.controls.target.lerpVectors(lerp.targetStart, lerp.targetEnd, t);
              if (lerp.progress >= 1) lerpingRef.current = null;
            }
            newSceneObjects.controls.update();
            newSceneObjects.directionalLight.position.copy(newSceneObjects.camera.position);
            newSceneObjects.renderer.render(newSceneObjects.scene, newSceneObjects.camera);
            if (sceneRef.current?.pendingCapture) {
              sceneRef.current.pendingCapture();
              sceneRef.current.pendingCapture = null;
            }
            (gl as any).endFrameEXP?.();

            if (showAtomLabelsRef.current && molecule && !underPressure2) {
              const cam = newSceneObjects.camera;
              const { width: vw, height: vh } = viewSizeRef.current;
              molecule.atoms.forEach(atom => {
                const lv = labelAnimatedPositions.current.get(atom.id);
                if (!lv) return;
                labelVec2.set(atom.x, atom.y, atom.z);
                labelVec2.project(cam);
                if (labelVec2.z < 1.0) {
                  lv.x.setValue((labelVec2.x + 1) / 2 * vw - 8);
                  lv.y.setValue((1 - labelVec2.y) / 2 * vh - 8);
                } else {
                  lv.x.setValue(-1000);
                  lv.y.setValue(-1000);
                }
              });
            }
          } catch (e: any) {
            console.warn('Render loop error (recovering next frame):', e.message);
          }
        };

        animate();
        setIsReady(true);
      } catch (error) {
        console.error('Error recreating scene for visualization mode change:', error);
      }
    }, [visualizationMode, molecule, backgroundColor]);

    // Element highlight effect
    useElementHighlight(sceneRef, molecule, selectedElement);

    const orbitControlViewRef = useRef<any>(null);

    const { handleTap, handleDoubleTap } = useRaycast(
      sceneRef, lerpingRef, onAtomSelect, onAtomDeselect, onBondSelect
    );

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        if (sceneRef.current) {
          (sceneRef.current as any).isRenderLoopActive = false;
          const { scene, atomMeshes, bondMeshes } = sceneRef.current;

          atomMeshes.forEach((mesh) => {
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m) => m.dispose());
              } else {
                mesh.material.dispose();
              }
            }
          });

          bondMeshes.forEach((mesh) => {
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m) => m.dispose());
              } else {
                mesh.material.dispose();
              }
            }
          });

          scene.clear();
        }

        sceneRef.current = null;
      };
    }, []);

    // Expose handle to parent
    React.useImperativeHandle(ref, () => ({
      takeSnapshotAsync: (options?: any) =>
        (glViewRef.current as any)?.takeSnapshotAsync?.(options),

      captureFramesForGif: async (frameCount, intervalMs, onProgress) => {
        const scene = sceneRef.current;
        const gl = glContextRef.current;
        if (!scene || !gl) throw new Error('Scene not ready');

        const prevAutoRotate = scene.controls.autoRotate;
        const prevSpeed = scene.controls.autoRotateSpeed;
        scene.controls.autoRotate = true;
        scene.controls.autoRotateSpeed = 0.33;

        const bufW = (gl as any).drawingBufferWidth as number;
        const bufH = (gl as any).drawingBufferHeight as number;
        const targetW = 240;
        const targetH = Math.max(1, Math.round(bufH * targetW / bufW));

        const indexMap = new Uint32Array(targetW * targetH);
        for (let y = 0; y < targetH; y++) {
          for (let x = 0; x < targetW; x++) {
            const srcX = Math.min(bufW - 1, Math.round(x * bufW / targetW));
            const srcY = Math.min(bufH - 1, Math.round((targetH - 1 - y) * bufH / targetH));
            indexMap[y * targetW + x] = (srcY * bufW + srcX) * 4;
          }
        }

        const captureNextFrame = (): Promise<Uint8Array> =>
          new Promise((resolve, reject) => {
            const tid = setTimeout(() => reject(new Error('Frame capture timeout')), 5000);
            scene.pendingCapture = () => {
              clearTimeout(tid);
              try {
                const pixels = new Uint8Array(bufW * bufH * 4);
                (gl as any).readPixels(0, 0, bufW, bufH, 0x1908 /* RGBA */, 0x1401 /* UNSIGNED_BYTE */, pixels);
                const frame = new Uint8Array(targetW * targetH * 4);
                const pixelCount = targetW * targetH;
                for (let i = 0; i < pixelCount; i++) {
                  const s = indexMap[i];
                  const d = i * 4;
                  frame[d] = pixels[s];
                  frame[d + 1] = pixels[s + 1];
                  frame[d + 2] = pixels[s + 2];
                  frame[d + 3] = 255;
                }
                resolve(frame);
              } catch (e) {
                reject(e);
              }
            };
          });

        const frames: Uint8Array[] = [];
        try {
          for (let i = 0; i < frameCount; i++) {
            await new Promise<void>(resolve => setTimeout(resolve, intervalMs));
            const frame = await captureNextFrame();
            frames.push(frame);
            onProgress?.(i + 1, frameCount);
          }
        } finally {
          scene.controls.autoRotate = prevAutoRotate;
          scene.controls.autoRotateSpeed = prevSpeed;
          scene.pendingCapture = null;
        }

        return { frames, width: targetW, height: targetH };
      },
    }), []);

    return (
      <View style={[styles.container, { backgroundColor }]} onLayout={handleLayout}>
        <OrbitControlView ref={orbitControlViewRef} onSingleTap={handleTap} onDoubleTap={handleDoubleTap}>
          <GLView
            ref={glViewRef}
            onContextCreate={handleGLContextCreate}
            style={[styles.glView, { backgroundColor }]}
          />
        </OrbitControlView>
        <AtomLabelsOverlay
          molecule={molecule}
          labelAnimatedPositions={labelAnimatedPositions}
          show={showLabelsOverlay}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  glView: {
    flex: 1,
  },
});

MoleculeView.displayName = 'MoleculeView';

export default MoleculeView;