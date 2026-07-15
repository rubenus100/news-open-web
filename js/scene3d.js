// Variables globales de la escena 3D
let scene, camera, renderer, contenedorPrincipal, meshEsfera, panelDerecho3D;
let velocidadRotacion = 0.002; // Giro lento de la Tierra
let estaGirando = true;

// Guardaremos los astros aquí para hacerlos rotar en el bucle animate()
let astroLuna, astroMarte, astroSaturno;

function init3D() {
    const container = document.getElementById('canvas-container');

    // 1. Crear Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020205); // Un espacio un poco más oscuro

    // 2. Crear Cámara
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(-0.5, 0, 5); 

    // 3. Crear Renderizador
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // 4. Luces globales
    const luzAmbiental = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(luzAmbiental);

    const luzDirecional = new THREE.DirectionalLight(0xffffff, 1.5);
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
        opacity: 0.65, 
        side: THREE.DoubleSide
    });
    meshEsfera = new THREE.Mesh(geoEsfera, matEsfera);
    contenedorPrincipal.add(meshEsfera);

    // --- INSERTAR LOS CONTACTOS ADENTRO DEL PLANETA ---
    crearContactosInternos();

    // 6. Panel Derecho 3D (Cuerpos Celestes Interactivos)
    panelDerecho3D = new THREE.Group();
    panelDerecho3D.position.set(1.8, 0, 0); 
    scene.add(panelDerecho3D);
    crearPlanetasInteractivos3D();

    // 7. CONTROLES DE INTERACCIÓN POR CLIC (Raycaster)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener('click', (event) => {
        if (event.target.closest('#ui-container') || event.target.closest('.hologram-modal')) return;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        // Detectar si tocamos alguno de los planetas interactivos (ignorando las etiquetas de texto al hacer clic)
        const targets = [];
        panelDerecho3D.children.forEach(astro => {
            astro.children.forEach(child => {
                if (!(child instanceof THREE.Sprite)) {
                    targets.push(child);
                }
            });
        });

        const intersectsPaneles = raycaster.intersectObjects(targets, true);

        if (intersectsPaneles.length > 0) {
            let objetoPadre = intersectsPaneles[0].object;
            // Subir en la jerarquía hasta encontrar el grupo principal del astro
            while (objetoPadre && objetoPadre.parent !== panelDerecho3D) {
                objetoPadre = objetoPadre.parent;
            }

            if (objetoPadre && objetoPadre.userData && objetoPadre.userData.tipoModal) {
                abrirVentana(objetoPadre.userData.tipoModal);
                estaGirando = false; 
                return;
            }
        }

        if (!estaGirando) {
            estaGirando = true;
            document.querySelectorAll('.hologram-modal').forEach(modal => modal.style.display = 'none');
        }
    });

    window.addEventListener('dblclick', (event) => {
        if (event.target.closest('#ui-container') || event.target.closest('.hologram-modal')) return;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(meshEsfera);

        if (intersects.length > 0) {
            estaGirando = false; 
            abrirVentana('modal-comentarios');
        }
    });

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

    window.addEventListener('wheel', (event) => {
        if (event.target.closest('#ui-container') || event.target.closest('.hologram-modal')) return;

        camera.position.z += event.deltaY * 0.005;

        if (camera.position.z < 2.5) camera.position.z = 2.5;
        if (camera.position.z > 10.0) camera.position.z = 10.0;
    }, { passive: true });

    window.addEventListener('resize', onWindowResize, false);
    animate();
}

// --- FUNCIÓN PARA LOS CONTACTOS INTERNOS DE LA TIERRA ---
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

// --- FUNCIÓN GENERADORA DE ETIQUETAS TEXTO HOLOGRÁFICO NEÓN ---
function crearEtiquetaHolografica(texto, colorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Estilo Cyberpunk: Limpio, monospace, centrado y con brillo
    ctx.fillStyle = 'rgba(0, 0, 0, 0)'; // Fondo transparente
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Efecto sutil de brillo de texto (Glow)
    ctx.shadowColor = colorHex;
    ctx.shadowBlur = 12;

    // Pintar el texto
    ctx.fillStyle = colorHex;
    ctx.fillText(texto.toUpperCase(), canvas.width / 2, canvas.height / 2);

    const textura = new THREE.CanvasTexture(canvas);
    const materialSprite = new THREE.SpriteMaterial({ 
        map: textura, 
        transparent: true,
        depthTest: false // Asegura que el texto no sea cortado por otros materiales
    });
    
    const sprite = new THREE.Sprite(materialSprite);
    // Escalar la etiqueta para que se vea perfectamente proporcional sobre el planeta
    sprite.scale.set(1.5, 0.375, 1); 
    return sprite;
}

// --- CREACIÓN DE LOS ASTROS INTERACTIVOS CON SUS ETIQUETAS ---
function crearPlanetasInteractivos3D() {
    const loader = new THREE.TextureLoader();

    // 1. LUNA (Rojo -> Videos)
    astroLuna = new THREE.Group();
    astroLuna.position.y = 1.0;
    astroLuna.userData = { tipoModal: 'modal-videos' };

    const texLuna = loader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg');
    const geoLuna = new THREE.SphereGeometry(0.32, 32, 32);
    const matLuna = new THREE.MeshStandardMaterial({ 
        map: texLuna, 
        roughness: 0.8,
        emissive: 0xef4444,
        emissiveIntensity: 0.15 
    });
    const meshLuna = new THREE.Mesh(geoLuna, matLuna);
    astroLuna.add(meshLuna);

    // Añadir la etiqueta sobre la Luna
    const etiquetaLuna = crearEtiquetaHolografica('TRANSMITIR VIDEO', '#ef4444');
    etiquetaLuna.position.y = 0.55; // Colocada encima del astro
    astroLuna.add(etiquetaLuna);

    panelDerecho3D.add(astroLuna);

    // 2. MARTE (Azul -> Comentarios/Feed)
    astroMarte = new THREE.Group();
    astroMarte.position.y = 0.0;
    astroMarte.userData = { tipoModal: 'modal-comentarios' };

    const geoMarte = new THREE.SphereGeometry(0.35, 32, 32);
    const matMarte = new THREE.MeshStandardMaterial({ 
        color: 0x3b82f6,
        roughness: 0.6,
        metalness: 0.1,
        emissive: 0x007bff,
        emissiveIntensity: 0.25
    });
    const meshMarte = new THREE.Mesh(geoMarte, matMarte);
    astroMarte.add(meshMarte);

    // Añadir la etiqueta sobre Marte
    const etiquetaMarte = crearEtiquetaHolografica('NOTICIAS Y COMENTARIOS', '#007bff');
    etiquetaMarte.position.y = 0.58; 
    astroMarte.add(etiquetaMarte);

    panelDerecho3D.add(astroMarte);

    // 3. SATURNO (Amarillo -> Chat en Vivo)
    astroSaturno = new THREE.Group();
    astroSaturno.position.y = -1.0;
    astroSaturno.userData = { tipoModal: 'modal-chat' };

    const geoSaturno = new THREE.SphereGeometry(0.28, 32, 32);
    const matSaturno = new THREE.MeshStandardMaterial({ 
        color: 0xf59e0b, 
        roughness: 0.5,
        emissive: 0xeab308,
        emissiveIntensity: 0.15
    });
    const meshSaturno = new THREE.Mesh(geoSaturno, matSaturno);
    astroSaturno.add(meshSaturno);

    const geoAnillo = new THREE.RingGeometry(0.38, 0.6, 64);
    geoAnillo.rotateX(Math.PI / 2.5); 
    const matAnillo = new THREE.MeshStandardMaterial({ 
        color: 0xeab308, 
        side: THREE.DoubleSide, 
        transparent: true, 
        opacity: 0.8 
    });
    const meshAnillo = new THREE.Mesh(geoAnillo, matAnillo);
    astroSaturno.add(meshAnillo);

    // Añadir la etiqueta sobre Saturno (un poco más arriba debido al anillo inclinado)
    const etiquetaSaturno = crearEtiquetaHolografica('CHAT EN VIVO', '#eab308');
    etiquetaSaturno.position.y = 0.65; 
    astroSaturno.add(etiquetaSaturno);
    
    panelDerecho3D.add(astroSaturno);
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

    // --- ANIMACIONES DE ROTACIÓN Y FLOTACIÓN ---
    if (astroLuna && astroMarte && astroSaturno) {
        // 1. Rotación de los cuerpos principales sobre su propio eje (ignorando los sprites para que el texto no gire como loco)
        astroLuna.children[0].rotation.y += 0.005;
        astroMarte.children[0].rotation.y += 0.008;
        astroSaturno.children[0].rotation.y += 0.01; 
        astroSaturno.children[1].rotation.z -= 0.002; // Rotar anillo

        // 2. Efecto de flotación orbital suave
        astroLuna.position.z = Math.sin(tiempo * 1.2) * 0.08;
        astroLuna.position.x = Math.cos(tiempo * 1.0) * 0.05;

        astroMarte.position.z = Math.cos(tiempo * 0.8) * 0.08;
        astroMarte.position.x = Math.sin(tiempo * 1.1) * 0.05;

        astroSaturno.position.z = Math.sin(tiempo * 1.5) * 0.06;
        astroSaturno.position.x = Math.cos(tiempo * 0.7) * 0.05;
    }

    renderer.render(scene, camera);
}
