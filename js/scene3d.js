// ==========================================
// SCENE3D.JS (Entorno Galáctico Three.js)
// ==========================================

let scene, camera, renderer, controls, meshEsfera;
let animFrameId = null;
const clock = new THREE.Clock();
let objetosInteractivos = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let galaxiaFondo;

function init3D() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // 1. Detener animación previa e hilar limpieza WebGL si re-inicializa
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
    camera.position.set(0, 2, 8.5);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // --- ILUMINACIÓN ---
    const luzAmbiental = new THREE.AmbientLight(0x93c5fd, 1.2);
    scene.add(luzAmbiental);

    const luzDir = new THREE.DirectionalLight(0xffffff, 1.8);
    luzDir.position.set(8, 5, 5);
    scene.add(luzDir);

    // --- UNIVERSO Y GALAXIA ---
    galaxiaFondo = crearUniversoGalactico(scene);

    // --- TIERRA CENTRAL ---
    const texturaTierra = new THREE.TextureLoader().load(
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
        undefined,
        undefined,
        () => console.warn("No se pudo cargar la textura de la Tierra, usando fallback visual.")
    );

    meshEsfera = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 32, 32),
        new THREE.MeshStandardMaterial({ 
            map: texturaTierra, 
            roughness: 0.6, 
            metalness: 0.2,
            color: 0x2563eb
        })
    );
    scene.add(meshEsfera);

    // --- PLANETAS INTERACTIVOS ---
    crearPlanetaLiso(0.4, 3.5, 0.3, 0, 0xef4444, 'modal-videos');
    crearPlanetaLiso(0.45, 4.8, 0.2, (Math.PI * 2) / 3, 0x007bff, 'modal-comentarios');
    crearPlanetaLiso(0.35, 4.0, 0.25, (Math.PI * 4) / 3, 0xeab308, 'modal-chat');

    // --- DETECCIÓN DE CLIC 3D (Raycaster) ---
    let startX = 0, startY = 0;
    renderer.domElement.addEventListener('pointerdown', (e) => {
        startX = e.clientX;
        startY = e.clientY;
    });

    renderer.domElement.addEventListener('pointerup', (e) => {
        if (Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5) return;

        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(objetosInteractivos, true);

        if (intersects.length > 0) {
            let obj = intersects[0].object;
            while (obj && obj !== scene) {
                if (obj.userData && obj.userData.tipoModal) {
                    if (typeof window.abrirVentana === 'function') {
                        window.abrirVentana(obj.userData.tipoModal);
                    }
                    return;
                }
                obj = obj.parent;
            }
        }
    });

    window.addEventListener('resize', onWindowResize);
    animate();
}

// --- CREADOR DE GALAXIAS Y NUBE DE ESTRELLAS ---
function crearUniversoGalactico(escenaObjetivo) {
    // 1. CAMPO DE ESTRELLAS GENERAL
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

    // 2. BRAZOS DE LA GALAXIA (Espirales)
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
    const colorTemp = new THREE.Color(); // Objeto reutilizable para evitar memoria basura

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

        // Reutilización directa del objeto color
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

// --- CREADOR DE PLANETAS INTERACTIVOS ---
function crearPlanetaLiso(radio, distancia, velocidad, angulo, colorHex, modalTarget) {
    const grupoOrbita = new THREE.Group();
    const planetaGrupo = new THREE.Group();
    grupoOrbita.userData = { distancia, velocidad, angulo };

    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(radio, 32, 32),
        new THREE.MeshStandardMaterial({ color: colorHex, emissive: colorHex, emissiveIntensity: 0.5 })
    );
    mesh.userData = { tipoModal: modalTarget };
    planetaGrupo.add(mesh);

    const atm = new THREE.Mesh(
        new THREE.SphereGeometry(radio * 1.12, 32, 32),
        new THREE.MeshPhysicalMaterial({ color: colorHex, transparent: true, opacity: 0.3, transmission: 0.6 })
    );
    atm.userData = { tipoModal: modalTarget };
    planetaGrupo.add(atm);

    planetaGrupo.position.x = Math.cos(angulo) * distancia;
    planetaGrupo.position.z = Math.sin(angulo) * distancia;

    grupoOrbita.add(planetaGrupo);
    scene.add(grupoOrbita);
    objetosInteractivos.push(mesh, atm);
}

// --- RUTINA DE LIMPIEZA WEBGL ---
function limpiarEscenaExistente() {
    if (!scene) return;
    
    objetosInteractivos = [];
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

// --- AJUSTE DE VENTANA ---
function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- BUCLE DE ANIMACIÓN ---
function animate() {
    animFrameId = requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (controls) controls.update();
    if (meshEsfera) meshEsfera.rotation.y += 0.05 * delta;
    if (galaxiaFondo) galaxiaFondo.rotation.y += 0.0003;

    if (scene) {
        scene.children.forEach(hijo => {
            if (hijo.userData && hijo.userData.distancia !== undefined) {
                hijo.userData.angulo += hijo.userData.velocidad * delta;
                const pGrupo = hijo.children[0];
                if (pGrupo) {
                    pGrupo.position.x = Math.cos(hijo.userData.angulo) * hijo.userData.distancia;
                    pGrupo.position.z = Math.sin(hijo.userData.angulo) * hijo.userData.distancia;
                    pGrupo.rotation.y += 0.4 * delta;
                }
            }
        });
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// Exportar función global y ejecutar al cargar el DOM
window.init3D = init3D;
document.addEventListener('DOMContentLoaded', init3D);
