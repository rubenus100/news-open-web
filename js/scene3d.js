// ==========================================
// SCENE3D.JS (Tierra Central + Entorno Galáctico)
// ==========================================

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

let scene, camera, renderer, meshEsfera, galaxiaFondo;
let animFrameId = null;
const clock = new THREE.Clock();

/**
 * Inicializa el escenario 3D completo
 */
export function init3D() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // 1. Detener animación previa y limpiar recursos WebGL
    if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
    }
    limpiarEscenaExistente();
    container.innerHTML = '';

    // --- ESCENA Y CONFIGURACIÓN INICIAL ---
    scene = new THREE.Scene();
    const colorEspacio = 0x0a1128;
    scene.background = new THREE.Color(colorEspacio);
    scene.fog = new THREE.FogExp2(colorEspacio, 0.001);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 8.5);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // --- ILUMINACIÓN ---
    const luzAmbiental = new THREE.AmbientLight(0x93c5fd, 1.2);
    scene.add(luzAmbiental);

    const luzDir = new THREE.DirectionalLight(0xffffff, 1.8);
    luzDir.position.set(8, 5, 5);
    scene.add(luzDir);

    // --- UNIVERSO Y GALAXIA DE FONDO ---
    galaxiaFondo = crearUniversoGalactico(scene);

    // --- TIERRA CENTRAL ---
    const texturaTierra = new THREE.TextureLoader().load(
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
        undefined,
        undefined,
        () => console.warn("No se pudo cargar la textura de la Tierra, aplicando fallback de color.")
    );

    meshEsfera = new THREE.Mesh(
        new THREE.SphereGeometry(1.8, 64, 64),
        new THREE.MeshStandardMaterial({ 
            map: texturaTierra, 
            roughness: 0.6, 
            metalness: 0.1,
            color: 0xffffff
        })
    );
    
    // Inclinación axial de la Tierra (~23.4 grados)
    meshEsfera.rotation.z = 23.4 * (Math.PI / 180);
    scene.add(meshEsfera);

    // --- EVENTOS ---
    window.addEventListener('resize', onWindowResize);
    animate();
}

/**
 * Genera el fondo de estrellas y los brazos en espiral de la galaxia
 */
function crearUniversoGalactico(escenaObjetivo) {
    // 1. Campo de Estrellas General
    const cantidadEstrellas = 4000;
    const geoEstrellas = new THREE.BufferGeometry();
    const posEstrellas = new Float32Array(cantidadEstrellas * 3);
    const coloresEstrellas = new Float32Array(cantidadEstrellas * 3);

    for (let i = 0; i < cantidadEstrellas * 3; i += 3) {
        posEstrellas[i] = (Math.random() - 0.5) * 800;
        posEstrellas[i + 1] = (Math.random() - 0.5) * 800;
        posEstrellas[i + 2] = (Math.random() - 0.5) * 800;

        coloresEstrellas[i] = 0.8 + Math.random() * 0.2;
        coloresEstrellas[i + 1] = 0.8 + Math.random() * 0.2;
        coloresEstrellas[i + 2] = 1.0;
    }

    geoEstrellas.setAttribute('position', new THREE.BufferAttribute(posEstrellas, 3));
    geoEstrellas.setAttribute('color', new THREE.BufferAttribute(coloresEstrellas, 3));

    const matEstrellas = new THREE.PointsMaterial({
        size: 1.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.85
    });

    const campoEstrellas = new THREE.Points(geoEstrellas, matEstrellas);
    escenaObjetivo.add(campoEstrellas);

    // 2. Brazos Espirales de la Galaxia
    const parametrosGalaxia = {
        cantidad: 12000,
        tamano: 0.8,
        radio: 250,
        brazos: 4,
        giro: 1,
        colorInterior: '#60a5fa',
        colorExterior: '#c084fc'
    };

    const geoGalaxia = new THREE.BufferGeometry();
    const posGalaxia = new Float32Array(parametrosGalaxia.cantidad * 3);
    const colGalaxia = new Float32Array(parametrosGalaxia.cantidad * 3);

    const cInterior = new THREE.Color(parametrosGalaxia.colorInterior);
    const cExterior = new THREE.Color(parametrosGalaxia.colorExterior);
    const colorTemp = new THREE.Color();

    for (let i = 0; i < parametrosGalaxia.cantidad; i++) {
        const r = Math.random() * parametrosGalaxia.radio;
        const anguloBrazo = ((i % parametrosGalaxia.brazos) / parametrosGalaxia.brazos) * Math.PI * 2;
        const anguloSpin = r * parametrosGalaxia.giro * 0.01;

        const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 15;
        const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 15;
        const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 15;

        const idx = i * 3;
        posGalaxia[idx] = Math.cos(anguloBrazo + anguloSpin) * r + randomX;
        posGalaxia[idx + 1] = randomY;
        posGalaxia[idx + 2] = Math.sin(anguloBrazo + anguloSpin) * r + randomZ;

        colorTemp.copy(cInterior).lerp(cExterior, r / parametrosGalaxia.radio);

        colGalaxia[idx] = colorTemp.r;
        colGalaxia[idx + 1] = colorTemp.g;
        colGalaxia[idx + 2] = colorTemp.b;
    }

    geoGalaxia.setAttribute('position', new THREE.BufferAttribute(posGalaxia, 3));
    geoGalaxia.setAttribute('color', new THREE.BufferAttribute(colGalaxia, 3));

    const matGalaxia = new THREE.PointsMaterial({
        size: parametrosGalaxia.tamano,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
    });

    const galaxia = new THREE.Points(geoGalaxia, matGalaxia);
    galaxia.position.set(0, -30, -100);
    galaxia.rotation.x = Math.PI * 0.15;
    escenaObjetivo.add(galaxia);

    return galaxia;
}

/**
 * Rutina de liberación de memoria GPU
 */
function limpiarEscenaExistente() {
    if (!scene) return;
    
    scene.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach(mat => mat.dispose());
            } else {
                child.material.dispose();
            }
        }
    });
    if (renderer) renderer.dispose();
}

/**
 * Ajusta la proyección al cambiar la ventana
 */
function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Bucle de animación ininterrumpido
 */
function animate() {
    animFrameId = requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // Rotación suave de la Tierra
    if (meshEsfera) {
        meshEsfera.rotation.y += 0.08 * delta;
    }

    // Rotación de fondo de la galaxia
    if (galaxiaFondo) {
        galaxiaFondo.rotation.y += 0.0003;
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// Compatibilidad global y auto-ejecución
window.init3D = init3D;
document.addEventListener('DOMContentLoaded', init3D);
