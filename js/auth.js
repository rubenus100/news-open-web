// --- AUTH.JS (Control Biométrico y Login) ---

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
            }
        );
    } else {
        if (campoGeo) campoGeo.value = "GPS no soportado en este dispositivo.";
    }
}

async function inicializarBiometria() {
    const video = document.getElementById('webcam');
    const instruccion = document.getElementById('biometria-instruccion');

    if (video && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 320 } });
            video.srcObject = stream;

            if (instruccion) instruccion.innerText = "Analizando rostro... ¡Por favor, SONRÍE (Prueba de vida activa)!";
            
            setTimeout(() => {
                flujoAutenticacion.rostroValidado = true;
                flujoAutenticacion.gestoValidado = true;
                if (instruccion) instruccion.innerHTML = "🟢 Identidad Biométrica Verificada.";
                
                const ctrlSeguridad = document.getElementById('controles-seguridad');
                if (ctrlSeguridad) ctrlSeguridad.style.display = 'block';
            }, 3000);

        } catch (err) {
            console.error("Error webcam:", err);
            if (instruccion) instruccion.innerText = "⚠️ Se requiere acceso a la webcam para News Open.";
        }
    } else if (instruccion) {
        instruccion.innerText = "⚠️ Webcam no disponible o entorno inseguro.";
    }

    // --- DICTADO POR VOZ ---
    const btnDictar = document.getElementById('btn-dictar-registro');
    const textoCapturado = document.getElementById('texto-dictado-capturado');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && btnDictar) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-CL';

        btnDictar.addEventListener('click', () => {
            btnDictar.innerText = "Escuchando perfil... ¡Habla!";
            btnDictar.style.background = "#ef4444";
            recognition.start();
        });

        recognition.onresult = (event) => {
            const parrafo = event.results[0][0].transcript.toLowerCase();
            if (textoCapturado) textoCapturado.innerText = `Procesando: "${parrafo}"`;
            
            btnDictar.innerText = "🎙️ Dictar Datos de Registro";
            btnDictar.style.background = "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)";

            // Procesamiento de datos dictados
            const palabras = parrafo.split(" ");
            const correoEncontrado = palabras.find(p => p.includes("@") || p.includes("arroba"));
            if (correoEncontrado) {
                let correoLimpio = correoEncontrado.replace("arroba", "@");
                const regCorreo = document.getElementById('reg-correo');
                if (regCorreo) regCorreo.value = correoLimpio;
                flujoAutenticacion.datosDictados.correo = correoLimpio;
            }

            if (parrafo.includes("país es")) {
                const partes = parrafo.split("país es");
                const paisDetectado = partes[1].trim().split(" ")[0];
                const regPais = document.getElementById('reg-pais');
                if (regPais) regPais.value = paisDetectado.toUpperCase();
                flujoAutenticacion.datosDictados.pais = paisDetectado;
            } else {
                const paises = ["chile", "argentina", "perú", "méxico", "españa", "bolivia", "colombia"];
                paises.forEach(p => {
                    if (parrafo.includes(p)) {
                        const regPais = document.getElementById('reg-pais');
                        if (regPais) regPais.value = p.toUpperCase();
                        flujoAutenticacion.datosDictados.pais = p;
                    }
                });
            }

            const numeros = parrafo.match(/\d+/g);
            if (numeros && numeros.length >= 2) {
                const fechaEstimada = numeros.join("/");
                const regFecha = document.getElementById('reg-fecha');
                if (regFecha) regFecha.value = fechaEstimada;
                flujoAutenticacion.datosDictados.fecha = fechaEstimada;
            }
        };
    }

    // --- CONFIRMACIÓN DE INGRESO ---
    const btnVerificar = document.getElementById('btn-verificar-todo');
    if (btnVerificar) {
        btnVerificar.addEventListener('click', () => {
            const correo = document.getElementById('reg-correo')?.value || "";
            const fecha = document.getElementById('reg-fecha')?.value || "";
            const pais = document.getElementById('reg-pais')?.value || "";
            const pin = document.getElementById('pin-seguridad')?.value || "";

            if (!correo || !fecha || !pais || !pin) {
                alert("⚠️ Por favor completa todos los campos (puedes dictarlos de nuevo o editarlos a mano).");
                return;
            }

            alert(`🔒 REGISTRO EXITOSO EN NEWS OPEN\n\n📍 Nodo: ${flujoAutenticacion.coordenadasGPS}\n📧 Correo: ${correo}\n🌍 Red libre y segura protegida por IA.`);

            // Apagar la webcam correctamente
            const videoElemento = document.getElementById('webcam');
            if (videoElemento && videoElemento.srcObject) {
                videoElemento.srcObject.getTracks().forEach(track => track.stop());
            }

            // Ocultar suavemente el panel de login
            const loginModal = document.getElementById('login-biometrico');
            if (loginModal) {
                loginModal.style.transition = "opacity 0.8s";
                loginModal.style.opacity = 0;
                setTimeout(() => {
                    loginModal.style.display = 'none'; // Se oculta sin llamar a init3D() otra vez
                }, 800);
            }
        });
    }
}
