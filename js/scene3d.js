// Variables globales de la escena 3D
let scene, camera, renderer, controls, contenedorPrincipal, meshEsfera;

// Variables reutilizables para optimizar memoria (Evita Garbage Collection spikes en clics)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function init3D() {
    const container = document.getElementById('canvas-container');

    // 1. Crear Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020205); // Un espacio un poco más oscuro

    // 2. Crear Cámara (Centrada)
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 4.5); 

    // 3. Crear Renderizador
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
    container.appendChild(renderer.domElement);

    // 4. Configurar controles de arrastre con el mouse (OrbitControls)
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Hace que el giro sea suave y con inercia
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 2.5;
    controls.maxDistance = 8.0;
    controls.enablePan = false; // Bloquea el desplazamiento lateral para mantener el planeta centrado

    // 5. Luces globales
    const luzAmbiental = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(luzAmbiental);

    const luzDirecional = new THREE.DirectionalLight(0xffffff, 1.5);
    luzDirecional.position.set(5, 3, 5);
    scene.add(luzDirecional);

    // 6. Contenedor de la Tierra (Centrado en pantalla)
    contenedorPrincipal = new THREE.Group();
    contenedorPrincipal.position.set(0, 0, 0); 
    scene.add(contenedorPrincipal);

    // --- EFECTO GOOGLE EARTH SEMI-TRANSPARENTE ---
    const texturaTierra = new THREE.TextureLoader().load(
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg'
    );

    const geoEsfera = new THREE.SphereGeometry(1.5, 32, 32);
    const matEsfera = new THREE.MeshStandardMaterial({ 
        map: texturaTierra,
        roughness: 0.6,
        metalness: 0.2,
        transparent: true, 
        opacity: 0.8, // Un poco más opaco para que se vean bien los puntos en la superficie
        side: THREE.DoubleSide
    });
    meshEsfera = new THREE.Mesh(geoEsfera, matEsfera);
    contenedorPrincipal.add(meshEsfera);

    // --- INSERTAR LOS NODOS DE TRANSMISIÓN DENTRO DE LA TIERRA ---
    crearNodosDeTransmision();

    // 7. CONTROLES DE INTERACCIÓN POR CLIC (Raycaster)
    window.addEventListener('click', (event) => {
        // Ignorar clics en el HUD o modales
        if (event.target.closest('#ui-container') || event.target.closest('.hologram-modal')) return;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        // Detectar si tocamos alguno de los nodos interactivos de la superficie
        const targets = [];
        contenedorPrincipal.children.forEach(child => {
            if (child !== meshEsfera && !(child instanceof THREE.Sprite)) {
                targets.push(child);
            }
        });

        const intersects = raycaster.intersectObjects(targets, true);

        if (intersects.length > 0) {
            let objetoPadre = intersects[0].object;
            
            // Buscar si tiene asignada una modal en userData
            if (objetoPadre && objetoPadre.userData && objetoPadre.userData.tipoModal) {
                abrirVentana(objetoPadre.userData.tipoModal);
                return;
            }
        }
    });

    // Bloqueo de eventos de mapa en elementos UI
    const bloquearEventosHaciaElMapa = (elementoId) => {
        const elemento = document.getElementById(elementoId);
        if (elemento) {
            ['wheel', 'mousedown', 'pointerdown', 'click', 'dblclick', 'touchstart', 'touchmove'].forEach(evt => {
                elemento.addEventListener(evt, (e) => e.stopPropagation(), { passive: true });
            });
        }
    };
    bloquearEventosHaciaElMapa('ui-container');
    bloquearEventosHaciaElMapa('modal-videos');
    bloquearEventosHaciaElMapa('modal-comentarios');
    bloquearEventosHaciaElMapa('modal-chat');

    window.addEventListener('resize', onWindowResize, false);
    animate();
}

// --- FUNCIÓN GENERADORA DE ETIQUETAS TEXTO HOLOGRÁFICO NEÓN ---
function crearEtiquetaHolografica(texto, colorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0, 0, 0, 0)'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = colorHex;
    ctx.shadowBlur = 12;

    ctx.fillStyle = colorHex;
    ctx.fillText(texto.toUpperCase(), canvas.width / 2, canvas.height / 2);

    const textura = new THREE.CanvasTexture(canvas);
    const materialSprite = new THREE.SpriteMaterial({ 
        map: textura, 
        transparent: true,
        depthTest: false 
    });
    
    const sprite = new THREE.Sprite(materialSprite);
    sprite.scale.set(1.0, 0.25, 1); 
    return sprite;
}

// --- CREAR NODOS EN LA SUPERFICIE DE LA TIERRA ---
function crearNodosDeTransmision() {
    // Definimos las coordenadas geográficas aproximadas sobre la superficie del planeta (radio 1.5)
    // 1. NODO VIDEO (Rojo)
    crearPuntoSuperficie(1.1, 0.8, 0.6, 0xef4444, 'TRANSMITIR VIDEO', 'modal-videos');

    // 2. NODO PUBLICACIONES (Azul)
    crearPuntoSuperficie(-0.9, -0.6, 0.9, 0x007bff, 'PUBLICACIONES', 'modal-comentarios');

    // 3. NODO CHAT (Amarillo)
    crearPuntoSuperficie(0.3, -1.1, -0.8, 0xeab308, 'CHAT EN VIVO', 'modal-chat');
}

// Función auxiliar para posicionar un nodo en la superficie del planeta
function crearPuntoSuperficie(x, y, z, colorHex, etiquetaTexto, modalTarget) {
    const puntoGrupo = new THREE.Group();
    
    // Normalizar la posición para que quede exactamente en la superficie del planeta (radio 1.5)
    const posicionOriginal = new THREE.Vector3(x, y, z);
    posicionOriginal.normalize().multiplyScalar(1.52); // Ligeramente por encima de la superficie (1.52)
    puntoGrupo.position.copy(posicionOriginal);

    // 1. La esfera interactiva (Punto Neón)
    const geoPunto = new THREE.SphereGeometry(0.08, 16, 16);
    const matPunto = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 1.5,
        metalness: 0.9,
        roughness: 0.1
    });
    const meshPunto = new THREE.Mesh(geoPunto, matPunto);
    meshPunto.userData = { tipoModal: modalTarget }; // Pasamos la propiedad de la ventana aquí
    puntoGrupo.add(meshPunto);

    // 2. Anillo de pulso (Efecto de onda expansiva en el mapa)
    const geoAnillo = new THREE.RingGeometry(0.1, 0.15, 32);
    const matAnillo = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
    });
    const meshAnillo = new THREE.Mesh(geoAnillo, matAnillo);
    // Orientar el anillo para que mire hacia afuera de la esfera terrestre
    meshAnillo.lookAt(new THREE.Vector3(0,0,0));
    puntoGrupo.add(meshAnillo);

    // 3. Etiqueta Holográfica encima del nodo
    const etiqueta = crearEtiquetaHolografica(etiquetaTexto, '#' + colorHex.toString(16).padStart(6, '0'));
    etiqueta.position.y = 0.25; // Posicionada justo arriba del nodo
    puntoGrupo.add(etiqueta);

    // Añadir al contenedor del planeta (así gira junto con él cuando el usuario lo mueva)
    contenedorPrincipal.add(puntoGrupo);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const tiempo = Date.now() * 0.001;

    // Actualizar controles físicos de órbita (Arrastre táctil/mouse)
    if (controls) {
        controls.update();
    }

    // Animaciones de los Nodos (Efectos de pulso de luz y respiración)
    if (contenedorPrincipal) {
        contenedorPrincipal.children.forEach(hijo => {
            if (hijo !== meshEsfera) {
                // Hacer que los anillos pulsen en escala
                const anillo = hijo.children[1];
                if (anillo) {
                    const escalaPulso = 1.0 + Math.sin(tiempo * 5) * 0.3;
                    anillo.scale.set(escalaPulso, escalaPulso, 1);
                    anillo.material.opacity = 0.8 - (Math.sin(tiempo * 5) * 0.3);
                }
                
                // Efecto de respiración suave de las etiquetas holográficas
                const etiqueta = hijo.children[2];
                if (etiqueta) {
                    etiqueta.position.y = 0.25 + Math.sin(tiempo * 2) * 0.02;
                }
            }
        });
    }

    renderer.render(scene, camera);
}
