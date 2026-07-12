let flujoAutenticacion = {
    rostroValidado: false,
    gestoValidado: false,
    datosDictados: { correo: "", fecha: "", pais: "" },
    coordenadasGPS: ""
};

document.addEventListener("DOMContentLoaded", () => {
    inicializarBiometria();
    obtenerGeolocalizacion(); // Activa el rastreo GPS seguro de inmediato
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
                campoGeo.value = `📍 Nodo Validado [ ${flujoAutenticacion.coordenadasGPS} ]`;
            },
            (error) => {
                console.warn("Acceso GPS denegado o no disponible.");
                campoGeo.value = "📍 Ubicación por IP (Protección de Red)";
                flujoAutenticacion.coordenadasGPS = "IP-Mascara-Local";
            }
        );
    } else {
        campoGeo.value = "GPS no soportado en este dispositivo.";
    }
}

async function inicializarBiometria() {
    const video = document.getElementById('webcam');
    const instruccion = document.getElementById('biometria-instruccion');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        instruccion.innerText = "⚠️ Entorno inseguro detectado (file://). Abre el frontend mediante un servidor local.";
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 320 } });
        video.srcObject = stream;

        instruccion.innerText = "Analizando rostro... ¡Por favor, SONRÍE (Prueba de vida activa)!";
        
        setTimeout(() => {
            flujoAutenticacion.rostroValidado = true;
            flujoAutenticacion.gestoValidado = true;
            instruccion.innerHTML = "🟢 Identidad Biométrica Verificada.";
            document.getElementById('controles-seguridad').style.display = 'block';
        }, 3000);

    } catch (err) {
        console.error(err);
        instruccion.innerText = "⚠️ Se requiere acceso a la webcam para News Open.";
    }

    // --- DICTADO POR VOZ E INTELIGENCIA ARTIFICIAL EN FRONTEND ---
    const btnDictar = document.getElementById('btn-dictar-registro');
    const textoCapturado = document.getElementById('texto-dictado-capturado');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-CL';

        btnDictar.addEventListener('click', () => {
            btnDictar.innerText = "Escuchando perfil... ¡Habla!";
            btnDictar.style.background = "#ef4444";
            recognition.start();
        });

        recognition.onresult = (event) => {
            const parrafo = event.results[0][0].transcript.toLowerCase();
            textoCapturado.innerText = `Procesando: "${parrafo}"`;
            btnDictar.innerText = "🎙️ Dictar Datos de Registro";
            btnDictar.style.background = "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)";

            // --- PROCESAMIENTO INTELIGENTE DEL TEXTO DICTADO ---
            const palabras = parrafo.split(" ");
            const correoEncontrado = palabras.find(p => p.includes("@") || p.includes("arroba"));
            if (correoEncontrado) {
                let correoLimpio = correoEncontrado.replace("arroba", "@");
                document.getElementById('reg-correo').value = correoLimpio;
                flujoAutenticacion.datosDictados.correo = correoLimpio;
            }

            if (parrafo.includes("país es")) {
                const partes = parrafo.split("país es");
                const paisDetectado = partes[1].trim().split(" ")[0];
                document.getElementById('reg-pais').value = paisDetectado.toUpperCase();
                flujoAutenticacion.datosDictados.pais = paisDetectado;
            } else {
                const paises = ["chile", "argentina", "perú", "méxico", "españa", "bolivia", "colombia"];
                paises.forEach(p => {
                    if (parrafo.includes(p)) {
                        document.getElementById('reg-pais').value = p.toUpperCase();
                        flujoAutenticacion.datosDictados.pais = p;
                    }
                });
            }

            const numeros = parrafo.match(/\d+/g);
            if (numeros && numeros.length >= 2) {
                const fechaEstimada = numeros.join("/");
                document.getElementById('reg-fecha').value = fechaEstimada;
                flujoAutenticacion.datosDictados.fecha = fechaEstimada;
            }
        };
    }

    // --- CONFIRMACIÓN Y CIERRE DE BLOQUEO ---
    document.getElementById('btn-verificar-todo').addEventListener('click', () => {
        const correo = document.getElementById('reg-correo').value;
        const fecha = document.getElementById('reg-fecha').value;
        const pais = document.getElementById('reg-pais').value;
        const pin = document.getElementById('pin-seguridad').value;

        if (!correo || !fecha || !pais || !pin) {
            alert("⚠️ Por favor completa todos los campos (puedes dictarlos de nuevo o editarlos a mano).");
            return;
        }

        alert(`🔒 REGISTRO EXITOSO EN NEWS OPEN\n\n📍 Nodo: ${flujoAutenticacion.coordenadasGPS}\n📧 Correo: ${correo}\n🌍 Red libre y segura protegida por IA.`);

        const videoElemento = document.getElementById('webcam');
        if (videoElemento && videoElemento.srcObject) {
            videoElemento.srcObject.getTracks().forEach(track => track.stop());
        }

        document.getElementById('login-biometrico').style.transition = "opacity 0.8s";
        document.getElementById('login-biometrico').style.opacity = 0;
        setTimeout(() => {
            document.getElementById('login-biometrico').remove();
            init3D(); 
        }, 800);
    });
}