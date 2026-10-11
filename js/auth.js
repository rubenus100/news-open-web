/**
 * js/auth.js
 * Sistema de Control Biométrico, Reconocimiento de Voz y Registro de Nodos.
 * Alineado con api.js (espera { usuario, token, correo, pais, ubicacion }).
 */

// --------------------------------------------------------------------------
// 1. ESTADO GLOBAL DEL FLUJO
// --------------------------------------------------------------------------
export const flujoAutenticacion = {
    rostroValidado: false,
    gestoValidado: false,
    datosDictados: { correo: '', fecha: '', pais: '' },
    coordenadasGPS: '',
    // Nueva bandera para no re-inicializar listeners
    inicializado: false
};

// --------------------------------------------------------------------------
// 2. GEOLOCALIZACIÓN
// --------------------------------------------------------------------------
/**
 * Obtiene coordenadas GPS de forma asíncrona.
 * @returns {Promise<string>} Coordenadas o etiqueta de respaldo.
 */
export function obtenerGeolocalizacion() {
    return new Promise((resolve) => {
        const campoGeo = document.getElementById('reg-geo');

        // Contexto seguro obligatorio para geolocation
        const esContextoSeguro =
            window.isSecureContext ||
            location.hostname === 'localhost' ||
            location.hostname === '127.0.0.1';

        if (!navigator.geolocation || !esContextoSeguro) {
            const msg = esContextoSeguro
                ? 'GPS no soportado en este dispositivo.'
                : 'GPS requiere HTTPS. Usando ubicación por IP.';
            if (campoGeo) campoGeo.value = msg;
            flujoAutenticacion.coordenadasGPS = 'IP-Mascara-Local';
            return resolve(flujoAutenticacion.coordenadasGPS);
        }

        navigator.geolocation.getCurrentPosition(
            (posicion) => {
                const { latitude, longitude } = posicion.coords;
                const lat = latitude.toFixed(4);
                const lon = longitude.toFixed(4);
                flujoAutenticacion.coordenadasGPS = `Lat: ${lat}, Lon: ${lon}`;
                if (campoGeo) campoGeo.value = `📍 Nodo Validado [ ${flujoAutenticacion.coordenadasGPS} ]`;
                resolve(flujoAutenticacion.coordenadasGPS);
            },
            (error) => {
                console.warn('Acceso GPS denegado o no disponible:', error.message);
                if (campoGeo) campoGeo.value = '📍 Ubicación por IP (Protección de Red)';
                flujoAutenticacion.coordenadasGPS = 'IP-Mascara-Local';
                resolve(flujoAutenticacion.coordenadasGPS);
            },
            { timeout: 8000, enableHighAccuracy: false, maximumAge: 60000 }
        );
    });
}

// --------------------------------------------------------------------------
// 3. DICTADO POR VOZ
// --------------------------------------------------------------------------
/**
 * Valida un correo electrónico con expresión regular simple.
 * @param {string} correo
 * @returns {boolean}
 */
function esCorreoValido(correo) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

/**
 * Procesa el texto dictado y autocompleta los campos del formulario.
 * @param {string} texto
 */
function procesarDictado(texto) {
    const t = (texto || '').toLowerCase();

    // --- 1. Correo electrónico ---
    // Estrategia: tomar lo que sigue a "correo" y reemplazar palabras clave
    const idxCorreo = t.indexOf('correo');
    if (idxCorreo !== -1) {
        let fragmento = t.slice(idxCorreo)
            .replace(/\b(correo|es|el|mi|electr[oó]nico)\b/g, ' ')
            .replace(/\barroba\b/g, '@')
            .replace(/\bpunto\b/g, '.')
            .replace(/\bguion\s*bajo\b|\bguion bajo\b/g, '_')
            .replace(/\s+/g, '');

        // Quitar cualquier cosa que no sea válida en un correo
        fragmento = fragmento.replace(/[^a-z0-9@._-]/g, '');

        if (esCorreoValido(fragmento)) {
            const regCorreo = document.getElementById('reg-correo');
            if (regCorreo) regCorreo.value = fragmento;
            flujoAutenticacion.datosDictados.correo = fragmento;
        }
    }

    // --- 2. País ---
    const paises = [
        'chile', 'argentina', 'peru', 'perú', 'mexico', 'méxico',
        'espana', 'españa', 'bolivia', 'colombia', 'venezuela',
        'uruguay', 'paraguay', 'ecuador'
    ];
    const paisEncontrado = paises.find(p => t.includes(p));
    if (paisEncontrado) {
        const normalizado = paisEncontrado
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toUpperCase();
        const regPais = document.getElementById('reg-pais');
        if (regPais) regPais.value = normalizado;
        flujoAutenticacion.datosDictados.pais = normalizado;
    }

    // --- 3. Fecha ---
    // Estrategia: buscar una secuencia específica "día mes año" en cualquier orden
    // Solo tomamos los últimos 3 números consecutivos encontrados tras "fecha" o "nac"
    const idxFecha = Math.max(t.indexOf('fecha'), t.indexOf('nac'));
    if (idxFecha !== -1) {
        const fragmentoFecha = t.slice(idxFecha);
        const nums = fragmentoFecha.match(/\d{1,4}/g) || [];
        if (nums.length >= 3) {
            const fechaEstimada = nums.slice(0, 3).join('/');
            const regFecha = document.getElementById('reg-fecha');
            if (regFecha) regFecha.value = fechaEstimada;
            flujoAutenticacion.datosDictados.fecha = fechaEstimada;
        }
    }
}

/**
 * Configura la Web Speech API para dictado.
 */
function configurarReconocimientoVoz() {
    const btnDictar = document.getElementById('btn-dictar-registro');
    const textoCapturado = document.getElementById('texto-dictado-capturado');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition || !btnDictar) return;
    if (btnDictar.dataset.bound === '1') return;   // evita doble binding
    btnDictar.dataset.bound = '1';

    const recognition = new SpeechRecognition();

    // Idioma según selector de la UI (fallback es-CL)
    const sel = document.getElementById('selector-idioma');
    const langMap = { es: 'es-CL', en: 'en-US', pt: 'pt-BR' };
    recognition.lang = langMap[sel?.value] || 'es-CL';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const estadoInicial = () => {
        btnDictar.innerText = '🎙️ Dictar Datos de Registro';
        btnDictar.style.background = 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)';
    };

    btnDictar.addEventListener('click', () => {
        if (btnDictar.dataset.escuchando === '1') return;
        try {
            btnDictar.dataset.escuchando = '1';
            btnDictar.innerText = 'Escuchando perfil... ¡Habla!';
            btnDictar.style.background = '#ef4444';
            recognition.start();
        } catch (e) {
            console.warn('Reconocimiento de voz bloqueado o activo:', e);
            btnDictar.dataset.escuchando = '0';
            estadoInicial();
        }
    });

    recognition.onresult = (event) => {
        btnDictar.dataset.escuchando = '0';
        const parrafo = event.results[0][0].transcript.toLowerCase();
        if (textoCapturado) textoCapturado.innerText = `Procesando: "${parrafo}"`;
        estadoInicial();
        procesarDictado(parrafo);
    };

    recognition.onerror = (e) => {
        btnDictar.dataset.escuchando = '0';
        const mensajes = {
            'not-allowed':    '🚫 Permiso de micrófono denegado.',
            'no-speech':      '🔇 No se detectó voz. Intenta de nuevo.',
            'audio-capture':  '🎤 No se encontró micrófono.',
            'network':        '📡 Error de red en el reconocimiento.',
            'aborted':        '⏹️ Dictado cancelado.'
        };
        const msg = mensajes[e.error] || `Error: ${e.error}`;
        console.error('Speech Recognition:', e.error);
        if (textoCapturado) textoCapturado.innerText = msg;
        estadoInicial();
    };

    recognition.onend = () => {
        btnDictar.dataset.escuchando = '0';
    };
}

// --------------------------------------------------------------------------
// 4. WEBCAM Y BIOMETRÍA
// --------------------------------------------------------------------------
/**
 * Detiene la captura de video de la webcam.
 */
export function detenerWebcam() {
    const videoElemento = document.getElementById('webcam');
    if (videoElemento?.srcObject) {
        videoElemento.srcObject.getTracks().forEach(track => track.stop());
        videoElemento.srcObject = null;
    }
}

/**
 * Inicializa cámara + prueba de vida.
 * ⚠️ ADVERTENCIA: la "validación" actual es SIMULADA (setTimeout).
 * No hace análisis real de rostro. Sustituir en producción.
 */
async function inicializarBiometria() {
    const video = document.getElementById('webcam');
    const instruccion = document.getElementById('biometria-instruccion');
    const ctrlSeguridad = document.getElementById('controles-seguridad');

    const mostrarControles = () => {
        if (ctrlSeguridad) ctrlSeguridad.style.display = 'block';
    };

    if (video && navigator.mediaDevices?.getUserMedia) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 320 }, height: { ideal: 320 }, facingMode: 'user' }
            });
            video.srcObject = stream;

            if (instruccion) instruccion.innerText = 'Analizando rostro... ¡Por favor, SONRÍE!';

            // TODO: Reemplazar por análisis real (face-api.js, MediaPipe, etc.)
            setTimeout(() => {
                flujoAutenticacion.rostroValidado = true;
                flujoAutenticacion.gestoValidado = true;
                if (instruccion) instruccion.innerHTML = '🟢 Identidad Biométrica Verificada.';
                mostrarControles();
            }, 3000);
        } catch (err) {
            console.error('Error al acceder a la webcam:', err);
            if (instruccion) {
                instruccion.innerText = err.name === 'NotAllowedError'
                    ? '⚠️ Permiso de cámara denegado. Modo manual activado.'
                    : '⚠️ No se pudo acceder a la cámara. Modo manual activado.';
            }
            mostrarControles();
        }
    } else {
        if (instruccion) instruccion.innerText = '⚠️ Entorno sin soporte multimedia. Ingreso manual activado.';
        mostrarControles();
    }

    configurarReconocimientoVoz();
    configurarBotonRegistro();
}

// --------------------------------------------------------------------------
// 5. REGISTRO FINAL
// --------------------------------------------------------------------------
function configurarBotonRegistro() {
    const btnVerificar = document.getElementById('btn-verificar-todo');
    if (!btnVerificar) return;
    if (btnVerificar.dataset.bound === '1') return;   // evita doble binding
    btnVerificar.dataset.bound = '1';

    btnVerificar.addEventListener('click', () => {
        const correo = document.getElementById('reg-correo')?.value.trim() || '';
        const fecha  = document.getElementById('reg-fecha')?.value.trim()  || '';
        const pais   = document.getElementById('reg-pais')?.value.trim()   || '';
        const pin    = document.getElementById('pin-seguridad')?.value.trim() || '';

        if (!correo || !fecha || !pais || !pin) {
            alert('⚠️ Por favor completa todos los campos requeridos.');
            return;
        }
        if (!esCorreoValido(correo)) {
            alert('⚠️ El correo electrónico no tiene un formato válido.');
            return;
        }
        if (pin.length < 4) {
            alert('⚠️ El PIN debe tener al menos 4 caracteres.');
            return;
        }

        // FIX CRÍTICO: guardar TODOS los campos que api.js espera.
        //   - usuario → api.js lo lee como autor de publicaciones/chat
        //   - token   → api.js lo usa para Authorization
        //   - correo, pais, ubicacion, fecha → perfil de usuario
        const usuarioActivo = {
            usuario: '@' + correo.split('@')[0],   // ej: "@juan"
            correo,
            fecha,
            pais,
            ubicacion: flujoAutenticacion.coordenadasGPS || 'IP-Mascara-Local',
            token: btoa(`${correo}:${Date.now()}`), // token simulado base64
            autenticado: true,
            timestamp: new Date().toISOString()
        };
        sessionStorage.setItem('news_open_user', JSON.stringify(usuarioActivo));

        alert(
            '🔒 REGISTRO EXITOSO EN NEWS OPEN\n\n' +
            `👤 Usuario: ${usuarioActivo.usuario}\n` +
            `📍 Nodo: ${usuarioActivo.ubicacion}\n` +
            `📧 Correo: ${correo}\n` +
            `🌍 Red libre y segura protegida por IA.`
        );

        detenerWebcam();

        const loginModal = document.getElementById('login-biometrico');
        if (loginModal) {
            loginModal.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            loginModal.style.opacity = '0';
            loginModal.style.transform = 'translate(-50%, -55%)';
            setTimeout(() => { loginModal.style.display = 'none'; }, 800);
        }
    });
}

// --------------------------------------------------------------------------
// 6. INICIALIZACIÓN Y LIMPIEZA
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    if (flujoAutenticacion.inicializado) return;
    flujoAutenticacion.inicializado = true;

    // Lanzamos geolocalización sin bloquear la UI
    obtenerGeolocalizacion().catch(() => { /* ya manejado internamente */ });
    inicializarBiometria();
});

window.addEventListener('beforeunload', detenerWebcam);
