// ==========================================
// UI.JS - Control Directo de Banners, Cámara y Chat
// ==========================================

const palabrasOfensivas = ["groseria1", "groseria2", "spam", "basura", "insulto"];

export function filtrarTexto(texto) {
    if (!texto) return "";
    let textoFiltrado = texto;
    palabrasOfensivas.forEach(palabra => {
        const regex = new RegExp(`\\b${palabra}\\b`, 'gi');
        textoFiltrado = textoFiltrado.replace(regex, "****");
    });
    return textoFiltrado;
}

export async function iniciarCamara() {
    const video = document.getElementById('webcam');
    const textoInstruccion = document.getElementById('biometria-instruccion');
    if (!video) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280 }, 
                height: { ideal: 720 },
                facingMode: "user" 
            } 
        });
        video.srcObject = stream;
        if (textoInstruccion) textoInstruccion.textContent = "Escáner activo. Rostro detectado.";
    } catch (error) {
        console.error("Error al acceder a la cámara:", error);
        if (textoInstruccion) textoInstruccion.textContent = "Modo manual activo (Sin cámara).";
    }
}

// Abrir banner forzando la clase .activo
export function abrirBanner(idBanner) {
    cerrarBanners();
    const bannerObjetivo = document.getElementById(idBanner);
    if (bannerObjetivo) {
        bannerObjetivo.classList.add('activo');
    } else {
        console.error(`No se encontró ningún elemento con id="${idBanner}" en el HTML.`);
    }
}

export function cerrarBanners() {
    document.querySelectorAll('.glass-banner').forEach(banner => {
        banner.classList.remove('activo');
    });
}

// Captura de clics global (Delegación de eventos con protección XSS)
document.addEventListener('click', (e) => {
    // Botones de abrir o cerrar Banners
    const btnBanner = e.target.closest('button, .action-btn');
    if (btnBanner) {
        if (btnBanner.id === 'btn-publicar') abrirBanner('banner-publicar');
        if (btnBanner.id === 'btn-feed') abrirBanner('banner-feed');
        if (btnBanner.id === 'btn-chat') abrirBanner('banner-chat');
        if (btnBanner.classList.contains('btn-close')) cerrarBanners();
    }

    // Botón de Enviar Chat (Utiliza closest para detectar clics en hijos como iconos)
    const btnChat = e.target.closest('#banner-chat .btn-action-primary');
    if (btnChat) {
        const inputChat = document.getElementById('chat-input');
        const cajaMensajes = document.getElementById('chat-messages');
        if (inputChat && cajaMensajes && inputChat.value.trim() !== '') {
            const mensajeLimpio = filtrarTexto(inputChat.value.trim());
            
            // Construcción segura del nodo para prevenir XSS
            const nuevoMensaje = document.createElement('div');
            nuevoMensaje.className = 'msg user';

            const etiquetaUsuario = document.createElement('strong');
            etiquetaUsuario.textContent = '[Usuario]: ';

            const textoContenido = document.createTextNode(mensajeLimpio);

            nuevoMensaje.appendChild(etiquetaUsuario);
            nuevoMensaje.appendChild(textoContenido);

            cajaMensajes.appendChild(nuevoMensaje);
            cajaMensajes.scrollTop = cajaMensajes.scrollHeight;
            inputChat.value = '';
        }
    }
});

// Soporte para enviar mensaje al presionar "Enter"
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target && e.target.id === 'chat-input') {
        const btnChat = document.querySelector('#banner-chat .btn-action-primary');
        if (btnChat) btnChat.click();
    }
});

// Exposición global
window.cerrarBanners = cerrarBanners;
window.abrirBanner = abrirBanner;

document.addEventListener('DOMContentLoaded', () => {
    iniciarCamara();
});
