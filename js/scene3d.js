// Variables globales de la escena 3D
let scene, camera, renderer, contenedorPrincipal, meshEsfera, panelDerecho3D;
let velocidadRotacion = 0.002; // Giro lento de la Tierra
let estaGirando = true;

function init3D() {
    const container = document.getElementById('canvas-container');

    // 1. Crear Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05050a);

    // 2. Crear Cámara
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(-0.5, 0, 5); 

    // 3. Crear Renderizador
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // 4. Luces globales
    const luzAmbiental = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(luzAmbiental);

    const luzDirecional = new THREE.DirectionalLight(0x06b6d4, 1.2);
    luzDirecional.position.set(5, 3, 5);
    scene.add(luzDirecional);

    // 5. Contenedor de la Tierra (Izquierda)
    contenedorPrincipal = new THREE.Group();
    contenedorPrincipal.position.x = -1.5; 
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
        opacity: 0.65, // <-- Deja ver el interior de la Tierra
        side: THREE.DoubleSide
    });
    meshEsfera = new THREE.Mesh(geoEsfera, matEsfera);
    contenedorPrincipal.add(meshEsfera);

    // --- NUEVO: INSERTAR LOS CONTACTOS ADENTRO DEL PLANETA ---
    crearContactosInternos();

    // 6. Panel Derecho 3D (Botones Interactivos Flotantes)
    panelDerecho3D = new THREE.Group();
    panelDerecho3D.position.set(1.8, 0, 0); 
    scene.add(panelDerecho3D);
    crearFeedNoticias3D();

    // 7. CONTROLES DE INTERACCIÓN POR CLIC (Raycaster)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // --- MANEJADOR DE CLIC SIMPLE (DETECTA INTERACCIÓN CON LOS CUADROS Y RE-ACTIVA EL GIRO) ---
    window.addEventListener('click', (event) => {
        // Ignorar si el usuario interactúa con la interfaz web externa
        if (event.target.closest('#ui-container') || event.target.closest('.hologram-modal')) return;

        // Calcular posición del cursor en coordenadas normalizadas
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        // 1. Verificar si hizo clic en los cuadros interactivos del panel derecho
        // Buscamos colisiones recursivas dentro de los grupos de panelDerecho3D
        const intersectsPaneles = raycaster.intersectObjects(panelDerecho3D.children, true);

        if (intersectsPaneles.length > 0) {
            // Encontrar el grupo padre de la tarjeta que contiene los datos
            let objetoPadre = intersectsPaneles[0].object;
            while (objetoPadre && objetoPadre.parent !== panelDerecho3D) {
                objetoPadre = objetoPadre.parent;
            }

            if (objetoPadre && objetoPadre.userData && objetoPadre.userData.tipoModal) {
                // Lanzar la modal correspondiente
                abrirVentana(objetoPadre.userData.tipoModal);
                estaGirando = false; // Detener rotación mientras revisa la información
                return; // Detiene el flujo del clic simple
            }
        }

        // 2. Si el planeta estaba congelado y hacemos clic al aire vacío, se reanuda el giro
        if (!estaGirando) {
            estaGirando = true;
            // Ocultar cualquier ventana flotante activa al hacer clic en el vacío
            document.querySelectorAll('.hologram-modal').forEach(modal => modal.style.display = 'none');
        }
    });

    // --- DOBLE CLIC (Mantiene compatibilidad por si tocan el planeta) ---
    window.addEventListener('dblclick', (event) => {
        if (event.target.closest('#ui-container') || event.target.closest('.hologram-modal')) return;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(meshEsfera);

        if (intersects.length > 0) {
            estaGirando = false; 
            // Por defecto, abrir la sección de comentarios al hacer doble clic en el mundo
            abrirVentana('modal-comentarios');
        }
    });

    // --- AFINACIÓN COINCIDENTE: ESCUDO PARA LOS PANELES HTML ---
    const bloquearEventosHaciaElMapa = (elementoId) => {
        const elemento = document.getElementById(elementoId);
        if (elemento) {
            ['wheel', 'mousedown', 'pointerdown', 'click', 'dblclick'].forEach(evt => {
                elemento.addEventListener(evt, (e) => e.stopPropagation());
            });
        }
    };
    bloquearEventosHaciaElMapa('ui-container');
    bloquearEventosHaciaElMapa('modal-videos');
    bloquearEventosHaciaElMapa('modal-comentarios');
    bloquearEventosHaciaElMapa('modal-chat');

    // --- CONTROL DE ZOOM CON LA RUEDA DEL MOUSE ---
    window.addEventListener('wheel', (event) => {
        if (event.target.closest('#ui-container') || event.target.closest('.hologram-modal')) return;

        camera.position.z += event.deltaY * 0.005;

        // Límites de seguridad
        if (camera.position.z < 2.5) camera.position.z = 2.5;
        if (camera.position.z > 10.0) camera.position.z = 10.0;
    }, { passive: true });

    window.addEventListener('resize', onWindowResize, false);
    animate();
}

// --- FUNCIÓN PARA METER LOS CONTACTOS DENTRO ---
function crearContactosInternos() {
    const totalContactos = 8;
    const radioInterno = 0.9; 

    for (let i = 0; i < totalContactos; i++) {
        const geoNodo = new THREE.SphereGeometry(0.12, 16, 16);
        const matNodo = new THREE.MeshStandardMaterial({ 
            color: 0x06b6d4,
            emissive: 0x06b6d4,
            emissiveIntensity: 0.6,
            metalness: 0.9,
            roughness: 0.1
        });
        const meshNodo = new THREE.Mesh(geoNodo, matNodo);

        const phi = Math.acos(-1 + (2 * i) / totalContactos);
        const theta = Math.sqrt(totalContactos * Math.PI) * phi;

        meshNodo.position.x = radioInterno * Math.cos(theta) * Math.sin(phi);
        meshNodo.position.y = radioInterno * Math.sin(theta) * Math.sin(phi);
        meshNodo.position.z = radioInterno * Math.cos(phi);

        meshNodo.userData = { offsetFase: Math.random() * 10 };

        contenedorPrincipal.add(meshNodo);
    }
}

// --- CONFIGURACIÓN DE LOS TRES CUADROS INTERACTIVOS CON SUS MODALES ---
function crearFeedNoticias3D() {
    const publicaciones = [
        { tipo: 'video', color: 0xef4444, yOffset: 0.9, modalId: 'modal-videos' },       // Rojo
        { tipo: 'noticia', color: 0x007bff, yOffset: 0.1, modalId: 'modal-comentarios' },  // Azul
        { tipo: 'urgente', color: 0xeab308, yOffset: -0.7, modalId: 'modal-chat' }       // Amarillo
    ];

    publicaciones.forEach(pub => {
        const publicacionGrupo = new THREE.Group();
        publicacionGrupo.position.y = pub.yOffset;
        
        // Asignamos la ID de la ventana que le corresponde abrir en sus metadatos de usuario
        publicacionGrupo.userData = { tipoModal: pub.modalId };

        const geoFondo = new THREE.BoxGeometry(1.6, 0.6, 0.08);
        const matFondo = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4, metalness: 0.8 });
        const meshFondo = new THREE.Mesh(geoFondo, matFondo);
        publicacionGrupo.add(meshFondo);

        // La miniatura o gema indicativa con el color representativo (Rojo, Azul, Amarillo)
        const geoMiniatura = pub.tipo === 'video' ? new THREE.BoxGeometry(0.5, 0.4, 0.05) : new THREE.BoxGeometry(0.4, 0.4, 0.05);
        const matMiniatura = new THREE.MeshStandardMaterial({ 
            color: pub.color, 
            emissive: pub.color, 
            emissiveIntensity: 0.5 
        });
        const meshMiniatura = new THREE.Mesh(geoMiniatura, matMiniatura);
        meshMiniatura.position.set(-0.45, 0, 0.05);
        publicacionGrupo.add(meshMiniatura);

        const geoLineaTexto = new THREE.BoxGeometry(0.7, 0.04, 0.02);
        const matLineaTexto = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
        for (let i = 0; i < 3; i++) {
            const linea = new THREE.Mesh(geoLineaTexto, matLineaTexto);
            linea.position.set(0.25, 0.12 - (i * 0.12), 0.05);
            if (i === 2) linea.scale.x = 0.6; 
            publicacionGrupo.add(linea);
        }
        panelDerecho3D.add(publicacionGrupo);
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const tiempo = Date.now() * 0.001;

    // Animación de la Tierra
    if (estaGirando) {
        meshEsfera.rotation.y += velocidadRotacion;
        
        contenedorPrincipal.children.forEach(hijo => {
            if (hijo !== meshEsfera) {
                hijo.position.y += Math.sin(tiempo + hijo.userData.offsetFase) * 0.002;
                hijo.rotation.x += 0.01;
            }
        });
    }

    // Animación flotante para el panel derecho 3D
    panelDerecho3D.children.forEach((tarjeta, index) => {
        tarjeta.position.z = Math.sin(tiempo + index) * 0.05;
        tarjeta.rotation.y = Math.sin(tiempo * 0.5 + index) * 0.02;
    });

    renderer.render(scene, camera);
}
