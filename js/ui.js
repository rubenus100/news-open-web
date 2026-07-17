/**
 * News Open - Gestión de Ventanas y Modales de la UI
 */

// Hacer las funciones globales para que puedan ser llamadas desde el HTML (onclick) y desde scene3d.js
window.abrirVentana = function(idModal) {
    // Ocultar todas las ventanas primero para evitar que se encimen
    document.querySelectorAll('.hologram-modal').forEach(modal => {
        modal.style.display = 'none';
    });
    
    // Mostrar la seleccionada
    const ventana = document.getElementById(idModal);
    if (ventana) {
        ventana.style.display = 'block';
        
        // Si abrimos la sección de comentarios, refrescamos el feed
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

// Inicializar listeners una vez que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", () => {
    // Listener optimizado para el envío de comentarios (sin intervalos/loops repetitivos)
    const botonEnviar = document.getElementById('btn-enviar-comentario');
    if (botonEnviar) {
        botonEnviar.addEventListener('click', () => {
            const cajaTexto = document.getElementById('comentario-input');
            if (cajaTexto && typeof verificarComentarioConIA === 'function') {
                verificarComentarioConIA(cajaTexto.value);
            }
        });
    }
});