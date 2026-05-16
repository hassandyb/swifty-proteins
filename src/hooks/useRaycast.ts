import { useCallback, MutableRefObject } from 'react';
import { PixelRatio } from 'react-native';
import * as THREE from 'three';
import { Atom, Bond } from '../types/protein.types';
import { SceneObjects } from '../utils/moleculeSceneBuilder';

export function useRaycast(
  sceneRef: MutableRefObject<SceneObjects | null>,
  lerpingRef: MutableRefObject<{
    targetStart: THREE.Vector3;
    targetEnd: THREE.Vector3;
    posStart: THREE.Vector3;
    posEnd: THREE.Vector3;
    progress: number;
  } | null>,
  onAtomSelect?: (atom: Atom) => void,
  onAtomDeselect?: () => void,
  onBondSelect?: (bond: Bond, length: number) => void,
) {
  const handleTap = useCallback((x: number, y: number) => {
    if (!sceneRef.current) return;
    const { camera, raycaster, renderer, atomMeshes, bondMeshes, bondInstancedMesh, bondInstanceData, isLargeMolecule } = sceneRef.current;

    const width = renderer.getContext().drawingBufferWidth;
    const height = renderer.getContext().drawingBufferHeight;
    const scale = PixelRatio.get();
    const ndcX = (x * scale / width) * 2 - 1;
    const ndcY = -(y * scale / height) * 2 + 1;

    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

    // 1. Atoms (phantom meshes handle both small and instanced large molecules)
    const atomIntersects = raycaster.intersectObjects(Array.from(atomMeshes.values()), false);
    if (atomIntersects.length > 0 && atomIntersects[0].object.userData?.atom) {
      onAtomSelect?.(atomIntersects[0].object.userData.atom);
      return;
    }

    // 2. Bonds
    if (isLargeMolecule && bondInstancedMesh && bondInstanceData) {
      const bondIntersects = raycaster.intersectObject(bondInstancedMesh, false);
      if (bondIntersects.length > 0) {
        const id = bondIntersects[0].instanceId;
        if (id !== undefined && bondInstanceData[id]) {
          const { bond, length } = bondInstanceData[id];
          onBondSelect?.(bond, length);
          return;
        }
      }
    } else if (bondMeshes.length > 0) {
      const bondIntersects = raycaster.intersectObjects(bondMeshes, false);
      if (bondIntersects.length > 0 && bondIntersects[0].object.userData?.bond) {
        const { bond, length } = bondIntersects[0].object.userData;
        onBondSelect?.(bond, length);
        return;
      }
    }

    // 3. Nothing hit — clear selection
    onAtomDeselect?.();
  }, [onAtomSelect, onAtomDeselect, onBondSelect]);

  const handleDoubleTap = useCallback((x: number, y: number) => {
    if (!sceneRef.current) return;
    const { camera, raycaster, renderer, atomMeshes, controls } = sceneRef.current;

    const width = renderer.getContext().drawingBufferWidth;
    const height = renderer.getContext().drawingBufferHeight;
    const scale = PixelRatio.get();
    const ndcX = (x * scale / width) * 2 - 1;
    const ndcY = -(y * scale / height) * 2 + 1;

    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
    const atomIntersects = raycaster.intersectObjects(Array.from(atomMeshes.values()), false);
    if (atomIntersects.length === 0 || !atomIntersects[0].object.userData?.atom) return;

    const atom = atomIntersects[0].object.userData.atom as Atom;
    const newTarget = new THREE.Vector3(atom.x, atom.y, atom.z);
    const delta = new THREE.Vector3().subVectors(newTarget, controls.target);

    lerpingRef.current = {
      targetStart: controls.target.clone(),
      targetEnd: newTarget,
      posStart: camera.position.clone(),
      posEnd: camera.position.clone().add(delta),
      progress: 0,
    };
  }, []);

  return { handleTap, handleDoubleTap };
}
