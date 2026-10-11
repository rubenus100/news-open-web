// ==========================================================================
// SCENE3D.JS (Tierra Central + Entorno Galáctico + OrbitControls)
// Requiere importmap en el HTML (ver más abajo).
// ==========================================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, meshEsfera, galaxiaFondo, controls, atmosfera;
let animFrameId = null;
let clock = null;
let inicializado = false;

/**
 * Inicializa el escenario 3D completo.
 * Seguro ante llamadas múltiples (se auto-limpia).
 */
export function init3D() {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    if (inicializado) {
        console.warn('ℹ️ init3D ya estaba inicializado. Reconstruyendo escena.');
    }

    // 1. Detener animación previa
    if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
    }

    // 2. Limpiar recursos previos
    limpiarEscenaExistente();
    container.innerHTML = '';

    // 3. Reloj nuevo por cada init
    clock = new THREE.Clock();

    // --- ESCENA ---
    scene = new THREE.Scene();
    const colorEspacio = 0x080d14;
    scene.background = new THREE.Color(colorEspacio);
    scene.fog = new THREE.FogExp2(colorEspacio, 0.001);

    // --- CÁMARA ---
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 8.5);

    // --- RENDERER ---
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // FIX: encoding correcto para que los colores se vean vivos
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    container.appendChild(renderer.domElement);

    // --- CONTROLES DE ÓRBITA ---
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 0.8;
    controls.minDistance = 3.0;
    controls.maxDistance = 20.0;
    controls.enablePan = false; // evita que el usuario saque la Tierra de pantalla

    // --- ILUMINACIÓN ---
    scene.add(new THREE.AmbientLight(0x93c5fd, 1.2));

    const luzDir = new THREE.DirectionalLight(0xffffff, 1.8);
    luzDir.position.set(8, 5, 5);
    scene.add(luzDir);

    const luzCianSombra = new THREE.DirectionalLight(0x00f0ff, 0.8);
    luzCianSombra.position.set(-8, -5, -5);
    scene.add(luzCianSombra);

    // --- UNIVERSO Y GALAXIA DE FONDO ---
    galaxiaFondo = crearUniversoGalactico(scene);

    // --- TIERRA CENTRAL ---
    // FIX: usar jsdelivr con versión fija (evita problemas de CORS y de "master")
    const urlTextura =
        'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_atmos_2048.jpg';

    const texturaTierra = new THREE.TextureLoader().load(
        urlTextura,
        (tex) => {
            tex.encoding = THREE.sRGBEncoding;      // FIX: encoding sRGB
            tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        },
        undefined,
        () => {
            console.warn('⚠️ No se pudo cargar la textura de la Tierra. Usando color sólido.');
        }
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

    // Inclinación axial real (~23.4°)
    meshEsfera.rotation.z = 23.4 * (Math.PI / 180);
    scene.add(meshEsfera);

    // --- ATMÓSFERA HOLOGRÁFICA CIAN ---
    atmosfera = new THREE.Mesh(
        new THREE.SphereGeometry(1.86, 64, 64),
        new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            transparent: true,
            opacity: 0.18,
            side: THREE.BackSide
        })
    );
    scene.add(atmosfera);

    // --- EVENTOS ---
    window.removeEventListener('resize', onWindowResize);
    window.addEventListener('resize', onWindowResize);

    inicializado = true;
    animate();
}

/**
 * Genera campo de estrellas + brazos espirales.
 * @param {THREE.Scene} escenaObjetivo
 * @returns {THREE.Points}
 */
function crearUniversoGalactico(escenaObjetivo) {
    // --- 1. Campo de estrellas de fondo ---
    const cantidadEstrellas = 4000;
    const geoEstrellas = new THREE.BufferGeometry();
    const posEstrellas = new Float32Array(cantidadEstrellas * 3);
    const coloresEstrellas = new Float32Array(cantidadEstrellas * 3);

    for (let i = 0; i < cantidadEstrellas * 3; i += 3) {
        posEstrellas[i]     = (Math.random() - 0.5) * 800;
        posEstrellas[i + 1] = (Math.random() - 0.5) * 800;
        posEstrellas[i + 2] = (Math.random() - 0.5) * 800;

        coloresEstrellas[i]     = 0.8 + Math.random() * 0.2;
        coloresEstrellas[i + 1] = 0.8 + Math.random() * 0.2;
        coloresEstrellas[i + 2] = 1.0;
    }

    geoEstrellas.setAttribute('position', new THREE.BufferAttribute(posEstrellas, 3));
    geoEstrellas.setAttribute('color', new THREE.BufferAttribute(coloresEstrellas, 3));

    const campoEstrellas = new THREE.Points(
        geoEstrellas,
        new THREE.PointsMaterial({
            size: 1.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.85
        })
    );
    escenaObjetivo.add(campoEstrellas);

    // --- 2. Brazos espirales ---
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
        const anguloBrazo =
            ((i % parametrosGalaxia.brazos) / parametrosGalaxia.brazos) * Math.PI * 2;
        const anguloSpin = r * parametrosGalaxia.giro * 0.01;

        const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 15;
        const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 15;
        const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 15;

        const idx = i * 3;
        posGalaxia[idx]     = Math.cos(anguloBrazo + anguloSpin) * r + randomX;
        posGalaxia[idx + 1] = randomY;
        posGalaxia[idx + 2] = Math.sin(anguloBrazo + anguloSpin) * r + randomZ;

        colorTemp.copy(cInterior).lerp(cExterior, r / parametrosGalaxia.radio);

        colGalaxia[idx]     = colorTemp.r;
        colGalaxia[idx + 1] = colorTemp.g;
        colGalaxia[idx + 2] = colorTemp.b;
    }

    geoGalaxia.setAttribute('position', new THREE.BufferAttribute(posGalaxia, 3));
    geoGalaxia.setAttribute('color', new THREE.BufferAttribute(colGalaxia, 3));

    const galaxia = new THREE.Points(
        geoGalaxia,
        new THREE.PointsMaterial({
            size: parametrosGalaxia.tamano,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
    );
    galaxia.position.set(0, -30, -100);
    galaxia.rotation.x = Math.PI * 0.15;
    escenaObjetivo.add(galaxia);

    return galaxia;
}

/**
 * Libera toda la memoria GPU: geometrías, materiales, texturas, controles,
 * renderer y canvas.
 */
function limpiarEscenaExistente() {
    if (scene) {
        scene.traverse((child) => {
            if (child.geometry) child.geometry.dispose();

            if (child.material) {
                const mats = Array.isArray(child.material)
                    ? child.material
                    : [child.material];
                mats.forEach((mat) => {
                    // Liberar todas las texturas del material
                    for (const key of Object.keys(mat)) {
                        const val = mat[key];
                        if (val && val.isTexture) val.dispose();
                    }
                    mat.dispose();
                });
            }
        });
        scene.clear();
        scene = null;
    }

    if (controls) {
        controls.dispose();
        controls = null;
    }

    // FIX: liberar el contexto WebGL real y quitar el canvas del DOM
    if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss?.();
        if (renderer.domElement?.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        renderer = null;
    }

    meshEsfera = null;
    galaxiaFondo = null;
    atmosfera = null;
    camera = null;
}

/**
 * Ajusta cámara y renderer al nuevo tamaño de la ventana.
 */
function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

/**
 * Bucle de renderizado continuo.
 */
function animate() {
    animFrameId = requestAnimationFrame(animate);

    const delta = clock ? clock.getDelta() : 0.016;

    // Rotación Tierra sobre eje Y
    if (meshEsfera) {
        meshEsfera.rotation.y += 0.08 * delta;
    }

    // Rotación galaxia (multiplicado por delta para ser independiente del FPS)
    if (galaxiaFondo) {
        galaxiaFondo.rotation.y += 0.05 * delta;
    }

    if (controls) controls.update();

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// --------------------------------------------------------------------------
// AUTO-INICIALIZACIÓN ROBUSTA
// Con type="module", DOMContentLoaded puede haberse disparado ya.
// --------------------------------------------------------------------------
window.init3D = init3D;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init3D, { once: true });
} else {
    // El DOM ya está listo (caso típico con type="module")
    init3D();
}

// Limpieza al cerrar
window.addEventListener('beforeunload', () => {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    limpiarEscenaExistente();
});
