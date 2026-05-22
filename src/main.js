import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { CONFIG } from './config.js';
import { createEnvironment } from './Environment.js';
import { ShipController } from './ShipController.js';
import { PortManager } from './PortManager.js';

let visitedList = JSON.parse(localStorage.getItem('visitedPortals')) || [];
const visitedPortalsSet = new Set(visitedList);

// --- 1. Basic Setup ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.003);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
let currentZoom = CONFIG.camera.initialZoom;
let targetZoom = CONFIG.camera.initialZoom;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- 2. Post-Processing ---
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 1.0;
bloomPass.strength = 1.2;
composer.addPass(bloomPass);

// --- 3. Modules & Config ---
createEnvironment(scene, CONFIG);
const shipController = new ShipController(CONFIG, scene);
const portManager = new PortManager(scene, shipController, CONFIG, renderer, visitedPortalsSet);

// --- 4. BAR Asset Loading & Shader ---
const textureLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();
const ASSET_DIR = './assets/unit1/';

const colorMap = textureLoader.load(`${ASSET_DIR}arm_color.png`);
const normalMap = textureLoader.load(`${ASSET_DIR}arm_normal.png`);
const teamMap = textureLoader.load(`${ASSET_DIR}arm_team.png`);
const otherMap = textureLoader.load(`${ASSET_DIR}arm_other.png`);

[colorMap, normalMap, teamMap, otherMap].forEach(tex => tex.flipY = false);
colorMap.colorSpace = THREE.SRGBColorSpace;

const playerTeamColor = new THREE.Color('#39ff14');
const barMaterial = new THREE.MeshStandardMaterial({
    map: colorMap,
    normalMap: normalMap,
    normalScale: new THREE.Vector2(1, 2.2),
    metalness: 1.0,
    roughness: 1.0,
});

barMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.pbrMap = { value: otherMap };
    shader.uniforms.teamMap = { value: teamMap };
    shader.uniforms.teamColor = { value: playerTeamColor };
    shader.uniforms.emissiveIntensityMultiplier = { value: 6.0 };

    shader.fragmentShader = `
        uniform sampler2D pbrMap;
        uniform sampler2D teamMap;
        uniform vec3 teamColor;
        uniform float emissiveIntensityMultiplier;
    ` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `float roughnessFactor = roughness;
         vec4 texelOther = texture2D( pbrMap, vMapUv );
         roughnessFactor *= texelOther.b;
         roughnessFactor = clamp(roughnessFactor, 0.05, 1.0);`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
        '#include <metalnessmap_fragment>',
        `float metalnessFactor = metalness;
         metalnessFactor *= texelOther.g;`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         float teamMask = texture2D( teamMap, vMapUv ).r;
         float blendFactor = step(0.35, teamMask);
         vec3 accentColor = mix(diffuseColor.rgb, teamColor, 0.75);
         diffuseColor.rgb = mix(diffuseColor.rgb, accentColor, blendFactor);`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         float emissionAmount = texelOther.r;
         if (emissionAmount > 0.01) {
             vec4 baseGlowColor = texture2D( map, vMapUv );
             totalEmissiveRadiance += pow(baseGlowColor.rgb, vec3(2.2)) * emissionAmount * emissiveIntensityMultiplier;
         }`
    );
};

gltfLoader.load(`${ASSET_DIR}armpeep.glb`, (gltf) => {
    const ship = gltf.scene;
    ship.traverse((child) => {
        if (child.isMesh) child.material = barMaterial;
    });

    ship.scale.set(CONFIG.ship.scale, CONFIG.ship.scale, CONFIG.ship.scale);
    scene.add(ship);
    shipController.setShip(ship);
});

// --- 5. Inputs (Scroll Zoom) ---
window.addEventListener('wheel', (e) => {
    targetZoom += e.deltaY * CONFIG.camera.zoomSpeed;
    targetZoom = THREE.MathUtils.clamp(targetZoom, CONFIG.camera.minZoom, CONFIG.camera.maxZoom);
});

window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'r') {
        visitedPortalsSet.clear();
        localStorage.removeItem('visitedPortals');
        portManager.clearVisited();
    }
});

// --- 6. Render Loop ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    const wrapDelta = shipController.update(delta);
    portManager.update();

    if (wrapDelta) {
        camera.position.add(wrapDelta);
    }

    if (shipController.ship) {
        currentZoom = THREE.MathUtils.lerp(currentZoom, targetZoom, 0.1);

        const zOffset = currentZoom * 0.5;

        camera.position.x = THREE.MathUtils.lerp(camera.position.x, shipController.ship.position.x, 0.05);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, shipController.ship.position.y + currentZoom, 0.05);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, shipController.ship.position.z + zOffset, 0.05);

        camera.lookAt(camera.position.x, shipController.ship.position.y, camera.position.z - zOffset);
    }

    composer.render();
}

animate();

document.getElementById('close-terminal').addEventListener('click', () => {
    document.getElementById('mainframe-ui').classList.add('hidden');
    shipController.resume();
    setTimeout(() => {
        portManager.isTransitioning = false;
    }, 500);
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});
