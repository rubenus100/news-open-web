/**
 * News Open - Gestión de Ventanas y Modales de la UI
 */

// 1. FUNCIONES GLOBALES DE APERTURA Y CIERRE DE MODALES
window.abrirVentana = function(idModal) {
    // Ocultar todas las ventanas primero para evitar que se solapen
    document.querySelectorAll('.hologram-modal').forEach(modal => {
        modal.style.display = 'none';
    });
    
    // Mostrar la ventana solicitada
    const ventana = document.getElementById(idModal);
    if (ventana) {
        ventana.style.display = 'block';
        
        // Si abrimos la sección de publicaciones/comentarios, refrescamos el feed
        if (idModal === 'modal-comentarios' && typeof cargarFeedDesdeServidor === 'function') {
            cargarFeedDesdeServidor();
        }
    }
};

window.cerrarVentana = function(idModal) {
    const ventana = document.getElementById(idModal);
    if (ventana) {
        ventana.style.display = 'none';
    }
};

// 2. VINCULACIÓN DE EVENTOS DE BOTONES
function inicializarUI() {
    // Listener para envío de Comentarios / Publicaciones
    const botonEnviarComentario = document.getElementById('btn-enviar-comentario');
    if (botonEnviarComentario) {
        botonEnviarComentario.addEventListener('click', () => {
            const cajaTexto = document.getElementById('comentario-input');
            if (cajaTexto && cajaTexto.value.trim() !== '') {
                if (typeof verificarComentarioConIA === 'function') {
                    verificarComentarioConIA(cajaTexto.value);
                } else {
                    alert("Comentario enviado a la red.");
                }
            }
        });
    }

    // Listener para envío de Chat en vivo
    const botonEnviarChat = document.getElementById('btn-enviar-chat-usuario');
    if (botonEnviarChat) {
        botonEnviarChat.addEventListener('click', () => {
            const inputChat = document.getElementById('chat-usuario-input');
            const chatContainer = document.getElementById('chat-usuarios-container');
            
            if (inputChat && inputChat.value.trim() !== '') {
                if (chatContainer) {
                    const mensajeDiv = document.createElement('div');
                    mensajeDiv.className = 'chat-message-bubble bubble-cyan';
                    mensajeDiv.innerHTML = `<strong>@usuario:</strong> ${inputChat.value}`;
                    chatContainer.appendChild(mensajeDiv);
                    chatContainer.scrollTop = chatContainer.scrollHeight; // Auto-scroll al final
                }
                inputChat.value = ''; // Limpiar caja
            }
        });
    }
}

// Ejecutar inicialización inmediatamente si el DOM ya cargó, o esperar a que cargue
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarUI);
} else {
    inicializarUI();
}
