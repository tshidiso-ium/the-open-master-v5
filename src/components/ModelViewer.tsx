import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

function disposeMaterial(material: THREE.Material) {
  Object.values(material).forEach((value) => {
    if (value instanceof THREE.Texture) {
      value.dispose();
    }
  });
  material.dispose();
}

function disposeObject(object: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();

  object.traverse((child) => {
    const disposableChild = child as THREE.Object3D & {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    };

    if (disposableChild.geometry) {
      geometries.add(disposableChild.geometry);
    }

    if (Array.isArray(disposableChild.material)) {
      disposableChild.material.forEach((material) => materials.add(material));
    } else if (disposableChild.material) {
      materials.add(disposableChild.material);
    }
  });

  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach(disposeMaterial);
}

export function ModelViewer() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(3.5, 2.5, 5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.append(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const directionalLight = new THREE.DirectionalLight("#ffffff", 1.1);
    directionalLight.position.set(4, 6, 5);
    const ambientLight = new THREE.AmbientLight("#ffffff", 0.55);
    const axes = new THREE.AxesHelper(2);
    const grid = new THREE.GridHelper(8, 8, "#808080", "#555555");
    const gridMaterial = grid.material as THREE.Material;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.35;

    scene.add(directionalLight, ambientLight, axes, grid);
    const staticObjects = [axes, grid];
    let loadedModel: THREE.Object3D | null = null;
    let disposed = false;

    const resizeViewer = () => {
      if (disposed) {
        return;
      }

      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const objLoader = new OBJLoader();
    const mtlLoader = new MTLLoader();
    mtlLoader.load("/assets/Gear/Gear1.mtl", (materials) => {
      if (disposed) {
        return;
      }

      materials.preload();
      objLoader.setMaterials(materials);
      objLoader.load("/assets/Gear/Gear1.obj", (mesh) => {
        if (disposed) {
          disposeObject(mesh);
          return;
        }

        mesh.scale.setScalar(0.45);
        mesh.rotation.x = -Math.PI / 2;
        loadedModel = mesh;
        scene.add(mesh);
      });
    });

    let frameId = 0;
    const renderScene = () => {
      if (disposed) {
        return;
      }

      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(renderScene);
    };

    resizeViewer();
    renderScene();
    const resizeObserver = new ResizeObserver(resizeViewer);
    resizeObserver.observe(container);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();

      if (loadedModel) {
        scene.remove(loadedModel);
        disposeObject(loadedModel);
      }

      staticObjects.forEach((object) => {
        scene.remove(object);
        disposeObject(object);
      });

      renderer.renderLists.dispose();
      renderer.forceContextLoss();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={containerRef} className="viewer" />;
}
