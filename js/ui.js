/**
 * js/ui.js
 * Control de Interfaz de Usuario, Paneles HUD, Eventos y Chat Sanitizado.
 * Autocontenido: solo depende de api.js (PostsAPI, ChatAPI, MediaAPI).
 */

import { PostsAPI, ChatAPI, MediaAPI } from './api.js';

// --------------------------------------------------------------------------
// 1. FILTRO DE PALABRAS
// --------------------------------------------------------------------------
const palabrasOfensivas = ['groseria1', 'groseria2', 'spam', 'basura', 'insulto'];

function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function filtrarTexto(texto) {
    if (!texto) return '';
    let filtrado = texto;
    palabrasOfensivas.forEach((palabra) => {
        const re = new RegExp(
            `(?<![\\p{L}\\p{N}])${escapeRegExp(palabra)}(?![\\p{L}\\p{N}])`,
            'giu'
        );
        filtrado = filtrado.replace(re, '****');
    });
    return filtrado;
}

// --------------------------------------------------------------------------
// 2. UTILIDADES LOCALES
// --------------------------------------------------------------------------
function getUsuarioActual() {
    try {
        const s = JSON.parse(sessionStorage.getItem('news_open_user') || '{}');
        return s.usuario || '@nodo_anonimo';
    } catch {
        return '@nodo_anonimo';
    }
}

function horaActual() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// --------------------------------------------------------------------------
// 3. PANELES HUD
// --------------------------------------------------------------------------
export function cerrarTodosLosPaneles() {
    ['modal-videos', 'modal-comentarios', 'modal-chat'].forEach((id) => {
        const p = document.getElementById(id);
        if (p) p.classList.add('hidden');
    });
}

export function alternarPanel(idPanel) {
    const panel = document.getElementById(idPanel);
    if (!panel) {
        console.warn(`[ui] No existe el panel: ${idPanel}`);
        return;
    }
    const estabaOculto = panel.classList.contains('hidden');
    cerrarTodosLosPaneles();
    if (estabaOculto) panel.classList.remove('hidden');
}

// --------------------------------------------------------------------------
// 4. RENDERIZADO SEGURO
// --------------------------------------------------------------------------
function crearTarjetaPost(post) {
    const card = document.createElement('article');
    card.className = 'feed-card';

    const header = document.createElement('header');
    const strong = document.createElement('strong');
    strong.textContent = `@${(post.usuario || '').replace(/^@/, '')}`;
    const time = document.createElement('time');
    time.textContent = post.fecha || 'Ahora';
    header.appendChild(strong);
    header.appendChild(time);

    const p = document.createElement('p');
    p.textContent = post.mensaje;

    card.appendChild(header);
    card.appendChild(p);
    return card;
}

function crearBurbujaChat(msg) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-message bubble';

    const strong = document.createElement('strong');
    strong.textContent = `@${(msg.usuario || '').replace(/^@/, '')}: `;
    bubble.appendChild(strong);

    const texto = document.createTextNode(msg.mensaje);
    bubble.appendChild(texto);

    if (msg.timestamp) {
        const t = document.createElement('span');
        t.style.opacity = '0.5';
        t.style.marginLeft = '6px';
        t.style.fontSize = '0.75rem';
        t.textContent = `(${msg.timestamp})`;
        bubble.appendChild(t);
    }
    return bubble;
}

function pintarPost(contenedor, post, alInicio = false) {
    if (!contenedor) return;
    const card = crearTarjetaPost(post);
    if (alInicio && contenedor.firstChild) {
        contenedor.insertBefore(card, contenedor.firstChild);
    } else {
        contenedor.appendChild(card);
    }
    contenedor.scrollTop = alInicio ? 0 : contenedor.scrollHeight;
}

function pintarChat(contenedor, msg) {
    if (!contenedor) return;
    contenedor.appendChild(crearBurbujaChat(msg));
    contenedor.scrollTop = contenedor.scrollHeight;
}

// --------------------------------------------------------------------------
// 5. CARGA INICIAL
// --------------------------------------------------------------------------
async function cargarFeedInicial() {
    const contFeed = document.getElementById('chat-messages-container');
    if (!contFeed) return;
    contFeed.innerHTML = '';
    try {
        const posts = await PostsAPI.obtenerPublicaciones();
        posts.forEach((p) => pintarPost(contFeed, p));
    } catch (e) {
        console.warn('No se pudo cargar el feed:', e);
    }
}

async function cargarChatInicial() {
    const contChat = document.getElementById('chat-usuarios-container');
    if (!contChat) return;
    contChat.innerHTML = '';
    try {
        const mensajes = await ChatAPI.obtenerMensajesChat();
        mensajes.forEach((m) => pintarChat(contChat, m));
    } catch (e) {
        console.warn('No se pudo cargar el chat:', e);
    }
}

// --------------------------------------------------------------------------
// 6. ACCIONES
// --------------------------------------------------------------------------
async function enviarMensajeChat() {
    const input = document.getElementById('chat-live-input');
    const contenedor = document.getElementById('chat-usuarios-container');
    if (!input || !contenedor) return;

    const texto = input.value.trim();
    if (!texto) return;

    const textoFiltrado = filtrarTexto(texto);
    input.value = '';
    input.disabled = true;

    try {
        const enviado = await ChatAPI.enviarMensajeChat(textoFiltrado);
        enviado.usuario = enviado.usuario || getUsuarioActual().replace(/^@/, '');
        pintarChat(contenedor, {
            usuario: enviado.usuario,
            mensaje: enviado.mensaje,
            timestamp: enviado.timestamp || horaActual()
        });
    } catch (e) {
        console.error('Error al enviar mensaje:', e);
        alert('No se pudo transmitir el mensaje. Intenta de nuevo.');
    } finally {
        input.disabled = false;
        input.focus();
    }
}

async function enviarPublicacion() {
    const input = document.getElementById('comentario-input');
    const contenedor = document.getElementById('chat-messages-container');
    if (!input || !contenedor) return;

    const texto = input.value.trim();
    if (!texto) return;

    const textoFiltrado = filtrarTexto(texto);
    input.value = '';
    input.disabled = true;

    try {
        const post = await PostsAPI.crearPublicacion(textoFiltrado);
        post.usuario = post.usuario || getUsuarioActual().replace(/^@/, '');
        pintarPost(contenedor, post, true);
    } catch (e) {
        console.error('Error al publicar:', e);
        alert('No se pudo enviar la publicación.');
    } finally {
        input.disabled = false;
        input.focus();
    }
}

async function subirVideo() {
    const titulo = document.getElementById('input-titulo-video')?.value.trim() || '';
    const descripcion = document.getElementById('video-desc')?.value.trim() || '';
    const archivo = document.getElementById('input-file-video')?.files?.[0] || null;
    const btn = document.getElementById('btn-sincronizar-video');

    if (!titulo || !archivo) {
        alert('⚠️ Debes indicar un título y seleccionar un archivo de video.');
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Transmitiendo...';
    }
    try {
        const res = await MediaAPI.subirVideo({ titulo, descripcion, archivo });
        if (res._revoke) setTimeout(res._revoke, 60000);
        alert(res.message || '✅ Video transmitido a la malla.');
    } catch (e) {
        console.error('Error al subir video:', e);
        alert('❌ No se pudo transmitir el video.');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Transmitir a la Malla';
        }
    }
}

// --------------------------------------------------------------------------
// 7. EVENTOS GLOBALES
// --------------------------------------------------------------------------
document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-enviar-chat'))        return enviarMensajeChat();
    if (e.target.closest('#btn-enviar-comentario'))  return enviarPublicacion();
    if (e.target.closest('#btn-sincronizar-video'))  return subirVideo();

    if (e.target.closest('#btn-close-videos'))       return document.getElementById('modal-videos')?.classList.add('hidden');
    if (e.target.closest('#btn-close-comentarios'))  return document.getElementById('modal-comentarios')?.classList.add('hidden');
    if (e.target.closest('#btn-close-chat'))         return document.getElementById('modal-chat')?.classList.add('hidden');
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        const t = e.target;
        if (t?.id === 'chat-live-input') {
            e.preventDefault();
            enviarMensajeChat();
        }
    }
    if (e.key === 'Escape') cerrarTodosLosPaneles();
});

window.cerrarTodosLosPaneles = cerrarTodosLosPaneles;
window.alternarPanel = alternarPanel;

// --------------------------------------------------------------------------
// 8. INICIALIZACIÓN
// --------------------------------------------------------------------------
let uiInicializado = false;

export function initUI() {
    if (uiInicializado) {
        console.warn('[ui] initUI ya estaba inicializado.');
        return;
    }
    uiInicializado = true;

    console.log('[ui] Inicializando paneles...');

    // 1. Cargar datos
    cargarFeedInicial();
    cargarChatInicial();

    // 2. Wiring de los botones del sidebar
    const mapeoPaneles = [
        { btnId: 'btn-open-videos',      modalId: 'modal-videos' },
        { btnId: 'btn-open-comentarios', modalId: 'modal-comentarios' },
        { btnId: 'btn-open-chat',        modalId: 'modal-chat' }
    ];

    mapeoPaneles.forEach(({ btnId, modalId }) => {
        const btn = document.getElementById(btnId);
        const panel = document.getElementById(modalId);
        if (!btn) {
            console.warn(`[ui] No existe el botón #${btnId}`);
            return;
        }
        if (!panel) {
            console.warn(`[ui] No existe el panel #${modalId}`);
            return;
        }
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`[ui] Click en ${btnId} → abrir ${modalId}`);
            alternarPanel(modalId);
        });
    });

    console.log('🖥️ Módulo UI inicializado correctamente.');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI, { once: true });
} else {
    initUI();
}
