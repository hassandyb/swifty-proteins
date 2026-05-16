import * as THREE from 'three';
import { Renderer } from 'expo-three';
import { Atom, Bond, VisualizationMode } from '../types/protein.types';
import { getCPKColor } from './cpkColors';
import { OrbitControls } from './OrbitControls';

export interface SceneObjects {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: Renderer;
  controls: OrbitControls;
  raycaster: THREE.Raycaster;
  atomMeshes: Map<string, THREE.Mesh>;
  bondMeshes: THREE.Mesh[];
  directionalLight: THREE.DirectionalLight;
  ambientLight: THREE.Light;
  gl: WebGLRenderingContext;
  atomInstancedMesh?: THREE.InstancedMesh;
  isLargeMolecule?: boolean;
  bondInstancedMesh?: THREE.InstancedMesh;
  bondInstanceData?: Array<{ bond: Bond; length: number }>;
  pendingCapture?: (() => void) | null;
}

export function calculateBoundingBox(atoms: Atom[]) {
  if (!atoms || atoms.length === 0) {
    return { center: new THREE.Vector3(), radius: 5 };
  }

  const positions = atoms.map((a) => new THREE.Vector3(a.x, a.y, a.z));
  const bbox = new THREE.Box3().setFromPoints(positions);
  const size = bbox.getSize(new THREE.Vector3());
  const center = bbox.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const radius = maxDim / 2;

  return { center, radius };
}

export function createAtomGeometry(mode: VisualizationMode = 'ball-stick', atomCount: number = 0): THREE.SphereGeometry {
  // Atoms always use high segment counts so they look smooth at any zoom level
  void atomCount;
  switch (mode) {
    case 'space-filling': return new THREE.SphereGeometry(1.2, 32, 16);
    case 'stick':         return new THREE.SphereGeometry(0.3, 32, 16);
    case 'wireframe':     return new THREE.SphereGeometry(0.4, 32, 16);
    default:              return new THREE.SphereGeometry(0.6, 32, 16);
  }
}

export function createBondGeometry(mode: VisualizationMode = 'ball-stick', atomCount: number = 0): THREE.CylinderGeometry {
  // LOD: fewer cylinder segments for larger molecules
  const segs = atomCount > 60 ? 4 : 8;
  switch (mode) {
    case 'space-filling': return new THREE.CylinderGeometry(0.1,  0.1,  1, segs);
    case 'stick':         return new THREE.CylinderGeometry(0.3,  0.3,  1, segs);
    case 'wireframe':     return new THREE.CylinderGeometry(0.16, 0.16, 1, segs);
    default:              return new THREE.CylinderGeometry(0.2,  0.2,  1, segs);
  }
}

export function createMoleculeScene(
  gl: WebGLRenderingContext,
  atoms: Atom[],
  bonds: Bond[],
  w: number,
  h: number,
  visualizationMode: VisualizationMode = 'ball-stick',
  existingRenderer?: Renderer,
  backgroundColor: string = '#000000'
): SceneObjects {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(backgroundColor);

  // Camera setup
  const aspect = w / h;
  const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);

  // Renderer setup - reuse existing if provided
  const renderer = existingRenderer || new Renderer({ gl });
  renderer.setSize(w, h);
  if (!existingRenderer) {
    renderer.setPixelRatio(1);
  }

  // Lighting
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  // Raycaster for picking
  const raycaster = new THREE.Raycaster();

  // OrbitControls
  const controls = new OrbitControls(camera);
  controls.setScreenSize(w, h);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = true;
  controls.enablePan = true;
  controls.enableRotate = true;
  controls.autoRotate = false; // Disable auto-rotate, let gestures control it
  controls.autoRotateSpeed = 2;

  // Position camera to frame molecule
  const { center, radius } = calculateBoundingBox(atoms);
  const distance = radius * 2.2; // Closer camera for bigger appearance
  camera.position.set(
    center.x + distance,
    center.y + distance * 0.7,
    center.z + distance
  );
  camera.lookAt(center);
  controls.target.copy(center);
  controls.saveState();

  // Create atom meshes with visualization mode-dependent geometry
  const atomGeometry = createAtomGeometry(visualizationMode, atoms.length);
  const atomMeshes = new Map<string, THREE.Mesh>();

  // For large molecules, we want to use instanced meshes.
  // Assuming > 60 atoms as "large".
  const isLargeMolecule = atoms.length > 60;
  let atomInstancedMesh: THREE.InstancedMesh | undefined;

  if (isLargeMolecule && visualizationMode !== 'wireframe') {
    // 1. InstancedMesh for atoms
    const atomMaterial = new THREE.MeshLambertMaterial();
    const instancedMesh = new THREE.InstancedMesh(atomGeometry, atomMaterial, atoms.length);
    atomInstancedMesh = instancedMesh;

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    atoms.forEach((atom, i) => {
      dummy.position.set(atom.x, atom.y, atom.z);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
      instancedMesh.setColorAt(i, color.set(getCPKColor(atom.element)));

      // We still keep dummy single meshes for raycasting / userData
      // but we don't add them to the scene visually.
      const phantomMesh = new THREE.Mesh(atomGeometry, new THREE.MeshBasicMaterial());
      phantomMesh.position.set(atom.x, atom.y, atom.z);
      phantomMesh.userData.atomId = atom.id;
      phantomMesh.userData.element = atom.element;
      phantomMesh.userData.atom = atom;
      // Force matrix update so raycaster can intersect them when passed directly
      phantomMesh.updateMatrixWorld(true);
      atomMeshes.set(atom.id, phantomMesh);
    });

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
    scene.add(instancedMesh);

  } else {
    // Small molecules or wireframe mode (normal mapping)
    atoms.forEach((atom) => {
      if (visualizationMode === 'wireframe') return;

      const color = getCPKColor(atom.element);
      const material = new THREE.MeshLambertMaterial({
        color: new THREE.Color(color),
      });

      const mesh = new THREE.Mesh(atomGeometry, material);
      mesh.position.set(atom.x, atom.y, atom.z);
      mesh.userData.atomId = atom.id;
      mesh.userData.element = atom.element;
      mesh.userData.atom = atom;

      scene.add(mesh);
      atomMeshes.set(atom.id, mesh);
    });
  }

  // Create bond meshes with visualization mode-dependent geometry
  const bondGeometry = createBondGeometry(visualizationMode, atoms.length);
  const bondMaterial = new THREE.MeshLambertMaterial({
    color: 0x888888,
  });

  const bondMeshes: THREE.Mesh[] = [];
  let bondInstancedMesh: THREE.InstancedMesh | undefined;
  let bondInstanceData: Array<{ bond: Bond; length: number }> | undefined;

  // Skip bonds entirely in space-filling mode
  if (visualizationMode !== 'space-filling') {
    if (isLargeMolecule) {
      // InstancedMesh for bonds
      let validBondsCount = 0;
      const validBondsData: { midpoint: THREE.Vector3, quaternion: THREE.Quaternion, length: number, bond: Bond }[] = [];

      bonds.forEach((bond) => {
        const atom1 = atoms.find((a) => a.id === bond.atomId1);
        const atom2 = atoms.find((a) => a.id === bond.atomId2);

        if (!atom1 || !atom2) return;

        const pos1 = new THREE.Vector3(atom1.x, atom1.y, atom1.z);
        const pos2 = new THREE.Vector3(atom2.x, atom2.y, atom2.z);
        const bondLength = pos1.distanceTo(pos2);

        if (bondLength > 0) {
          const midpoint = new THREE.Vector3().addVectors(pos1, pos2).multiplyScalar(0.5);
          const direction = new THREE.Vector3().subVectors(pos2, pos1).normalize();
          const quaternion = new THREE.Quaternion();

          if (direction.lengthSq() > 0.0001 && !isNaN(direction.x) && !isNaN(direction.y) && !isNaN(direction.z)) {
            const up = new THREE.Vector3(0, 1, 0);
            if (Math.abs(direction.dot(up)) > 0.99) up.set(1, 0, 0);
            const axis = new THREE.Vector3().crossVectors(up, direction).normalize();
            const angle = Math.acos(up.dot(direction));
            if (!isNaN(angle) && axis.lengthSq() > 0.0001) {
              quaternion.setFromAxisAngle(axis, angle);
            }
          }

          validBondsData.push({ midpoint, quaternion, length: bondLength, bond });
          validBondsCount++;
        }
      });

      if (validBondsCount > 0) {
        const instancedMesh = new THREE.InstancedMesh(bondGeometry, bondMaterial, validBondsCount);
        bondInstancedMesh = instancedMesh;
        bondInstanceData = validBondsData.map(d => ({ bond: d.bond, length: d.length }));
        const dummy = new THREE.Object3D();

        validBondsData.forEach((data, i) => {
          dummy.position.copy(data.midpoint);
          dummy.quaternion.copy(data.quaternion);
          dummy.scale.set(1, 1, data.length);
          dummy.updateMatrix();
          instancedMesh.setMatrixAt(i, dummy.matrix);
        });

        instancedMesh.instanceMatrix.needsUpdate = true;
        scene.add(instancedMesh);
      }
    } else {
      // Small molecule normal rendering
      bonds.forEach((bond) => {
        const atom1 = atoms.find((a) => a.id === bond.atomId1);
        const atom2 = atoms.find((a) => a.id === bond.atomId2);

        if (!atom1 || !atom2) return;

        const pos1 = new THREE.Vector3(atom1.x, atom1.y, atom1.z);
        const pos2 = new THREE.Vector3(atom2.x, atom2.y, atom2.z);
        const bondLength = pos1.distanceTo(pos2);

        if (bondLength > 0) {
          const mesh = new THREE.Mesh(bondGeometry, bondMaterial.clone());

          // Position at midpoint
          const midpoint = new THREE.Vector3().addVectors(pos1, pos2).multiplyScalar(0.5);
          mesh.position.copy(midpoint);

          // Align cylinder to connect atoms
          const direction = new THREE.Vector3().subVectors(pos2, pos1).normalize();
          // Prevent normalizing a zero-length vector or plotting NaN matrices
          if (direction.lengthSq() > 0.0001 && !isNaN(direction.x) && !isNaN(direction.y) && !isNaN(direction.z)) {
            const up = new THREE.Vector3(0, 1, 0);
            if (Math.abs(direction.dot(up)) > 0.99) {
              up.set(1, 0, 0);
            }
            const axis = new THREE.Vector3().crossVectors(up, direction).normalize();
            const angle = Math.acos(up.dot(direction));

            // Extra safety check for zero-length axis or invalid angle
            if (!isNaN(angle) && axis.lengthSq() > 0.0001) {
              const quaternion = new THREE.Quaternion().setFromAxisAngle(axis, angle);
              mesh.quaternion.copy(quaternion);
            }
          }

          // Scale to bond distance
          mesh.scale.z = bondLength;

          mesh.userData.bond = bond;
          mesh.userData.atom1Id = bond.atomId1;
          mesh.userData.atom2Id = bond.atomId2;
          mesh.userData.length = bondLength;

          scene.add(mesh);
          bondMeshes.push(mesh);
        }
      });
    }
  }

  return {
    scene,
    camera,
    renderer,
    controls,
    raycaster,
    atomMeshes,
    bondMeshes,
    directionalLight,
    ambientLight,
    gl,
    atomInstancedMesh,
    isLargeMolecule,
    bondInstancedMesh,
    bondInstanceData,
  };
}
