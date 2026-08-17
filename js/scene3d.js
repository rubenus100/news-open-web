import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

// Variables globales del escenario
let scene, camera, renderer, earth, stars;

/**
 * Inicializa la escena 3D
 */
export function initScene3D() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // 1. Crear Escena
    scene = new THREE.Scene();

    // 2. Configurar Cámara
    camera = new THREE.PerspectiveCamera(
        45, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
    );
    camera.position.set(0, 0, 15);

    // 3. Configurar Renderizador
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    // 4. Iluminación Espacial
    const ambientLight = new THREE.AmbientLight(0x111122, 1.2); // Luz tenue ambiental del espacio
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5); // Luz solar directa
    sunLight.position.set(20, 10, 15);
    scene.add(sunLight);

    // 5. Crear la Tierra y las Estrellas
    createEarth();
    createStarfield();

    // 6. Eventos y Animación
    window.addEventListener('resize', onWindowResize);
    animate();
}

/**
 * Crea la esfera de la Tierra con materiales y texturas procedurales
 */
function createEarth() {
    const geometry = new THREE.SphereGeometry(4, 64, 64);

    // Textura procedural básica (océano azul profundo con continentes verdosos)
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const context = canvas.getContext('2d');

    // Fondo oceánico
    context.fillStyle = '#061630';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Generar masas continentales procedimentales simuladas
    context.fillStyle = '#1b4d3e';
    for (let i = 0; i < 180; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 90 + 20;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);

    // Material reactivo a la luz solar
    const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.7,
        metalness: 0.1
    });

    earth = new THREE.Mesh(geometry, material);
    
    // Inclinación axial real de la Tierra (~23.4 grados)
    earth.rotation.z = 23.4 * (Math.PI / 180);
    
    scene.add(earth);
}

/**
 * Crea el campo de estrellas en 3D para el universo de fondo
 */
function createStarfield() {
    const count = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 300;     // X
        positions[i + 1] = (Math.random() - 0.5) * 300; // Y
        positions[i + 2] = (Math.random() - 0.5) * 300; // Z
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.6,
        transparent: true,
        opacity: 0.8
    });

    stars = new THREE.Points(geometry, material);
    scene.add(stars);
}

/**
 * Bucle de renderizado continuo
 */
function animate() {
    requestAnimationFrame(animate);

    // Rotación suave de la Tierra
    if (earth) {
        earth.rotation.y += 0.0008; 
    }

    // Rotación ultra lenta del fondo de estrellas para dar profundidad
    if (stars) {
        stars.rotation.y -= 0.0001;
    }

    renderer.render(scene, camera);
}

/**
 * Ajusta la cámara y el canvas cuando cambia el tamaño de la ventana
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Auto-inicializar al cargar la página
document.addEventListener('DOMContentLoaded', initScene3D);
