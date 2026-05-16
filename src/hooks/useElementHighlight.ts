import { useEffect, MutableRefObject } from 'react';
import * as THREE from 'three';
import { Molecule } from '../types/protein.types';
import { getCPKColor } from '../utils/cpkColors';
import { SceneObjects } from '../utils/moleculeSceneBuilder';

export function useElementHighlight(
  sceneRef: MutableRefObject<SceneObjects | null>,
  molecule: Molecule | null,
  selectedElement: string | null,
) {
  // Highlight all atoms of the same element when selectedElement changes
  useEffect(() => {
    if (!sceneRef.current || !molecule) return;
    const { atomMeshes, atomInstancedMesh, isLargeMolecule } = sceneRef.current;
    const highlightColor = new THREE.Color(0xffff00);
    const color = new THREE.Color();

    if (isLargeMolecule && atomInstancedMesh) {
      molecule.atoms.forEach((atom, i) => {
        if (selectedElement && atom.element === selectedElement) {
          atomInstancedMesh.setColorAt(i, highlightColor);
        } else {
          atomInstancedMesh.setColorAt(i, color.set(getCPKColor(atom.element)));
        }
      });
      atomInstancedMesh.instanceColor!.needsUpdate = true;
    } else {
      atomMeshes.forEach((mesh) => {
        const element = mesh.userData.element as string;
        const mat = mesh.material as THREE.MeshLambertMaterial;
        if (selectedElement && element === selectedElement) {
          mat.color.set(highlightColor);
        } else {
          mat.color.set(getCPKColor(element));
        }
      });
    }
  }, [selectedElement, molecule]);
}
