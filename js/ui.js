// --- UI.JS ---

// Definimos la función globalmente en window para que sea accesible desde HTML y scene3d.js
window.abrirVentana = function(idModal) {
    // 1. Ocultar todos los modales abiertos primero
    const todosLosModales = document.querySelectorAll('.hologram-modal');
    todosLosModales.forEach(m => m.classList.add('hidden'));

    // 2. Mostrar el modal correspondiente
    const modalTarget = document.getElementById(idModal);
    if (modalTarget) {
        modalTarget.classList.remove('hidden');
    }
};

window.cerrarVentana = function(idModal) {
    const modalTarget = document.getElementById(idModal);
    if (modalTarget) {
        modalTarget.classList.add('hidden');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Escuchar clics directos en los elementos del banner lateral por si no usan onclick=""
    const btnRojo = document.querySelector('.card-red, [data-target="modal-videos"]');
    const btnAzul = document.querySelector('.card-blue, [data-target="modal-comentarios"]');
    const btnAmarillo = document.querySelector('.card-yellow, [data-target="modal-chat"]');

    if (btnRojo) btnRojo.addEventListener('click', () => window.abrirVentana('modal-videos'));
    if (btnAzul) btnAzul.addEventListener('click', () => window.abrirVentana('modal-comentarios'));
    if (btnAmarillo) btnAmarillo.addEventListener('click', () => window.abrirVentana('modal-chat'));

    // Detener propagación de eventos sobre los modales para no mover la cámara 3D al interactuar
    document.querySelectorAll('.hologram-modal, #hud-right-banner').forEach(panel => {
        ['pointerdown', 'mousedown', 'click'].forEach(evtType => {
            panel.addEventListener(evtType, (e) => e.stopPropagation());
        });
    });
});
document.addEventListener('DOMContentLoaded', () => {
    // Función para mostrar un modal
    const abrirModal = (id) => {
        document.getElementById(id)?.classList.remove('hidden');
    };

    // Función para ocultar un modal
    const cerrarModal = (id) => {
        document.getElementById(id)?.classList.add('hidden');
    };

    // Listeners para abrir paneles desde la barra HUD
    document.getElementById('btn-open-videos')?.addEventListener('click', () => abrirModal('modal-videos'));
    document.getElementById('btn-open-comentarios')?.addEventListener('click', () => abrirModal('modal-comentarios'));
    document.getElementById('btn-open-chat')?.addEventListener('click', () => abrirModal('modal-chat'));

    // Listeners para cerrar paneles (Botones X)
    document.getElementById('btn-close-videos')?.addEventListener('click', () => cerrarModal('modal-videos'));
    document.getElementById('btn-close-comentarios')?.addEventListener('click', () => cerrarModal('modal-comentarios'));
    document.getElementById('btn-close-chat')?.addEventListener('click', () => cerrarModal('modal-chat'));

    // Evento para abrir el selector de archivo en el panel de video
    const dropZone = document.getElementById('drag-drop-zone');
    const fileInput = document.getElementById('input-file-video');

    dropZone?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            document.getElementById('label-file-video').textContent = `Archivo: ${e.target.files[0].name}`;
        }
    });
});
