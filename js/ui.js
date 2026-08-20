/**
 * js/ui.js
 * Control de Interfaz de Usuario, Paneles HUD, Eventos y Chat Sanitizado.
 */

const palabrasOfensivas = ["groseria1", "groseria2", "spam", "basura", "insulto"];

/**
 * Filtra palabras no permitidas reemplazándolas por asteriscos.
 * @param {string} texto 
 * @returns {string}
 */
export function filtrarTexto(texto) {
    if (!texto) return "";
    let textoFiltrado = texto;
    palabrasOfensivas.forEach(palabra => {
        const regex = new RegExp(`\\b${palabra}\\b`, 'gi');
        textoFiltrado = textoFiltrado.replace(regex, "****");
    });
    return textoFiltrado;
}

/**
 * Inicializa la cámara web en el elemento especificado si existe.
 */
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

/**
 * Oculta todos los paneles laterales HUD.
 */
export function cerrarTodosLosPaneles() {
    const paneles = ['modal-videos', 'modal-comentarios', 'modal-chat'];
    paneles.forEach(id => {
        const panel = document.getElementById(id);
        if (panel) panel.classList.add('hidden');
    });
}

/**
 * Muestra u oculta un panel específico.
 * @param {string} idPanel 
 */
export function alternarPanel(idPanel) {
    const panel = document.getElementById(idPanel);
    if (!panel) return;

    const estaOculto = panel.classList.contains('hidden');
    cerrarTodosLosPaneles();
    
    if (estaOculto) {
        panel.classList.remove('hidden');
    }
}

/**
 * Extrae, sanitiza y agrega un nuevo mensaje al contenedor de chat.
 */
function enviarMensajeChat() {
    const inputChat = document.getElementById('chat-live-input') || document.getElementById('chat-input');
    const cajaMensajes = document.getElementById('chat-usuarios-container') || document.getElementById('chat-messages');
    
    if (!inputChat || !cajaMensajes || inputChat.value.trim() === '') return;

    const mensajeLimpio = filtrarTexto(inputChat.value.trim());
    
    // Construcción segura para prevenir vulnerabilidades XSS
    const nuevoMensaje = document.createElement('div');
    nuevoMensaje.className = 'chat-message bubble';

    const etiquetaUsuario = document.createElement('strong');
    etiquetaUsuario.textContent = '@tu_nodo: ';

    const textoContenido = document.createTextNode(mensajeLimpio);

    nuevoMensaje.appendChild(etiquetaUsuario);
    nuevoMensaje.appendChild(textoContenido);

    cajaMensajes.appendChild(nuevoMensaje);
    cajaMensajes.scrollTop = cajaMensajes.scrollHeight;
    inputChat.value = '';
}

/**
 * Asigna detención de propagación de eventos para proteger la escena Three.js
 */
function aislarEventosCanvas() {
    const contenedoresInterfaz = [
        document.getElementById('sidebar-menu'),
        document.getElementById('modal-videos'),
        document.getElementById('modal-comentarios'),
        document.getElementById('modal-chat'),
        document.querySelector('.lang-selector-container')
    ];

    contenedoresInterfaz.forEach(el => {
        if (!el) return;
        ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'wheel', 'touchstart', 'touchend'].forEach(evt => {
            el.addEventListener(evt, (e) => e.stopPropagation());
        });
    });
}

// Delegación global de eventos
document.addEventListener('click', (e) => {
    if (e.target.matches('#btn-enviar-chat, #btn-enviar-chat *')) {
        enviarMensajeChat();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target && (e.target.id === 'chat-live-input' || e.target.id === 'chat-input')) {
        e.preventDefault();
        enviarMensajeChat();
    }

    if (e.key === 'Escape') {
        cerrarTodosLosPaneles();
    }
});

// Exposición global para interoperabilidad
window.cerrarTodosLosPaneles = cerrarTodosLosPaneles;
window.alternarPanel = alternarPanel;

/**
 * Inicialización principal del módulo UI
 */
export function initUI() {
    iniciarCamara();
    aislarEventosCanvas();

    const mapeoPaneles = [
        { btnId: 'btn-open-videos', modalId: 'modal-videos', closeId: 'btn-close-videos' },
        { btnId: 'btn-open-comentarios', modalId: 'modal-comentarios', closeId: 'btn-close-comentarios' },
        { btnId: 'btn-open-chat', modalId: 'modal-chat', closeId: 'btn-close-chat' }
    ];

    mapeoPaneles.forEach(({ btnId, modalId, closeId }) => {
        const btn = document.getElementById(btnId);
        const modal = document.getElementById(modalId);
        const btnClose = document.getElementById(closeId);

        if (btn) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                alternarPanel(modalId);
            });
        }

        if (btnClose && modal) {
            btnClose.addEventListener('click', (e) => {
                e.stopPropagation();
                modal.classList.add('hidden');
            });
        }
    });

    console.log('🖥️ Módulo UI inicializado correctamente.');
}

// Auto-inicialización al cargar el DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
} else {
    initUI();
}
