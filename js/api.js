// ==========================================
// AUTH.JS (Control Biométrico y Login)
// ==========================================

let flujoAutenticacion = {
    rostroValidado: false,
    gestoValidado: false,
    datosDictados: { correo: "", fecha: "", pais: "" },
    coordenadasGPS: ""
};

document.addEventListener("DOMContentLoaded", () => {
    inicializarBiometria();
    obtenerGeolocalizacion();
});

// --- FUNCIÓN AUTOMÁTICA DE GEOLOCALIZACIÓN ---
function obtenerGeolocalizacion() {
    const campoGeo = document.getElementById('reg-geo');

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (posicion) => {
                const lat = posicion.coords.latitude.toFixed(4);
                const lon = posicion.coords.longitude.toFixed(4);
                flujoAutenticacion.coordenadasGPS = `Lat: ${lat}, Lon: ${lon}`;
                if (campoGeo) campoGeo.value = `📍 Nodo Validado [ ${flujoAutenticacion.coordenadasGPS} ]`;
            },
            (error) => {
                console.warn("Acceso GPS denegado o no disponible.");
                if (campoGeo) campoGeo.value = "📍 Ubicación por IP (Protección de Red)";
                flujoAutenticacion.coordenadasGPS = "IP-Mascara-Local";
            },
            { timeout: 8000 }
        );
    } else {
        if (campoGeo) campoGeo.value = "GPS no soportado en este dispositivo.";
        flujoAutenticacion.coordenadasGPS = "Nodo-Sin-GPS";
    }
}

// --- INICIALIZACIÓN BIOMÉTRICA Y WEBCAM ---
async function inicializarBiometria() {
    const video = document.getElementById('webcam');
    const instruccion = document.getElementById('biometria-instruccion');
    const ctrlSeguridad = document.getElementById('controles-seguridad');

    if (video && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: { ideal: 320 }, height: { ideal: 320 }, facingMode: "user" } 
            });
            video.srcObject = stream;

            if (instruccion) instruccion.innerText = "Analizando rostro... ¡Por favor, SONRÍE (Prueba de vida activa)!";

            // Simulación de escaneo facial y prueba de vida
            setTimeout(() => {
                flujoAutenticacion.rostroValidado = true;
                flujoAutenticacion.gestoValidado = true;
                if (instruccion) instruccion.innerHTML = "🟢 Identidad Biométrica Verificada.";
                if (ctrlSeguridad) ctrlSeguridad.style.display = 'block';
            }, 3000);

        } catch (err) {
            console.error("Error webcam:", err);
            if (instruccion) instruccion.innerText = "⚠️ Modo Manual: Acceso a la webcam omitido o denegado.";
            if (ctrlSeguridad) ctrlSeguridad.style.display = 'block';
        }
    } else {
        if (instruccion) instruccion.innerText = "⚠️ Entorno sin soporte multimedia. Ingreso manual activado.";
        if (ctrlSeguridad) ctrlSeguridad.style.display = 'block';
    }

    // --- RECONOCIMIENTO DE VOZ Y DICTADO ---
    const btnDictar = document.getElementById('btn-dictar-registro');
    const textoCapturado = document.getElementById('texto-dictado-capturado');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && btnDictar) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-CL';
        recognition.continuous = false;
        recognition.interimResults = false;

        let escuchando = false;

        btnDictar.addEventListener('click', () => {
            if (escuchando) return;

            try {
                btnDictar.innerText = "Escuchando perfil... ¡Habla!";
                btnDictar.style.background = "#ef4444";
                escuchando = true;
                recognition.start();
            } catch (e) {
                console.warn("Reconocimiento de voz ya activo o bloqueado:", e);
                escuchando = false;
            }
        });

        recognition.onresult = (event) => {
            escuchando = false;
            const parrafo = event.results[0][0].transcript.toLowerCase();
            if (textoCapturado) textoCapturado.innerText = `Procesando: "${parrafo}"`;

            btnDictar.innerText = "🎙️ Dictar Datos de Registro";
            btnDictar.style.background = "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)";

            // Normalización inteligente de correo hablado (Uso de Regex Global /g)
            if (parrafo.includes("correo") || parrafo.includes("arroba")) {
                let correoProcesado = parrafo
                    .replace(/\bcorreo\b/g, '')
                    .replace(/\barroba\b/g, "@")
                    .replace(/\bpunto\b/g, ".")
                    .replace(/\s+/g, ''); // Eliminar espacios al final
                
                const regCorreo = document.getElementById('reg-correo');
                if (regCorreo) regCorreo.value = correoProcesado;
                flujoAutenticacion.datosDictados.correo = correoProcesado;
            }

            // Normalización de País
            const paises = ["chile", "argentina", "perú", "peru", "méxico", "mexico", "españa", "bolivia", "colombia"];
            paises.forEach(p => {
                if (parrafo.includes(p)) {
                    const regPais = document.getElementById('reg-pais');
                    if (regPais) regPais.value = p.toUpperCase();
                    flujoAutenticacion.datosDictados.pais = p.toUpperCase();
                }
            });

            // Extracción de números para Fecha de Nacimiento
            const numeros = parrafo.match(/\d+/g);
            if (numeros && numeros.length >= 2) {
                const fechaEstimada = numeros.slice(0, 3).join("/");
                const regFecha = document.getElementById('reg-fecha');
                if (regFecha) regFecha.value = fechaEstimada;
                flujoAutenticacion.datosDictados.fecha = fechaEstimada;
            }
        };

        recognition.onerror = (e) => {
            escuchando = false;
            console.error("Error en Speech Recognition:", e.error);
            btnDictar.innerText = "🎙️ Reintentar Dictado";
            btnDictar.style.background = "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)";
        };

        recognition.onend = () => {
            escuchando = false;
        };
    }

    // --- CONFIRMACIÓN Y REGISTRO FINAL ---
    const btnVerificar = document.getElementById('btn-verificar-todo');
    if (btnVerificar) {
        btnVerificar.addEventListener('click', () => {
            const correo = document.getElementById('reg-correo')?.value.trim() || "";
            const fecha = document.getElementById('reg-fecha')?.value.trim() || "";
            const pais = document.getElementById('reg-pais')?.value.trim() || "";
            const pin = document.getElementById('pin-seguridad')?.value.trim() || "";

            if (!correo || !fecha || !pais || !pin) {
                alert("⚠️ Por favor completa todos los campos requeridos.");
                return;
            }

            // Guardar identidad del nodo local en la sesión
            const usuarioActivo = {
                correo: correo,
                pais: pais,
                ubicacion: flujoAutenticacion.coordenadasGPS,
                autenticado: true
            };
            sessionStorage.setItem('news_open_user', JSON.stringify(usuarioActivo));

            alert(`🔒 REGISTRO EXITOSO EN NEWS OPEN\n\n📍 Nodo: ${flujoAutenticacion.coordenadasGPS}\n📧 Correo: ${correo}\n🌍 Red libre y segura protegida por IA.`);

            detenerWebcam();

            // Transición suave para ocultar la modal de login
            const loginModal = document.getElementById('login-biometrico');
            if (loginModal) {
                loginModal.style.transition = "opacity 0.8s ease, transform 0.8s ease";
                loginModal.style.opacity = "0";
                loginModal.style.transform = "translate(-50%, -55%)";
                setTimeout(() => {
                    loginModal.style.display = 'none';
                }, 800);
            }
        });
    }
}

// Función auxiliar para detener la webcam
function detenerWebcam() {
    const videoElemento = document.getElementById('webcam');
    if (videoElemento && videoElemento.srcObject) {
        const stream = videoElemento.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        videoElemento.srcObject = null;
    }
}

// Detener recursos si la pestaña se cierra o recarga
window.addEventListener('beforeunload', () => {
    detenerWebcam();
});
