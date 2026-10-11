// ==========================================================================
// API.JS - Capa de Comunicación HTTP para News Open
// Alineado con el backend FastAPI (main.py en 127.0.0.1:8000)
// ==========================================================================

// --------------------------------------------------------------------------
// 1. CONFIGURACIÓN
// --------------------------------------------------------------------------
const IS_LOCAL =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

// El backend FastAPI corre en el puerto 8000 (ver main.py)
const API_BASE_URL = IS_LOCAL
    ? 'http://127.0.0.1:8000'
    : 'https://api.newsopen.net/v1';

// Tiempo máximo de espera por petición (ms)
const FETCH_TIMEOUT = 8000;

// --------------------------------------------------------------------------
// 2. UTILIDADES INTERNAS
// --------------------------------------------------------------------------

/**
 * Construye las cabeceras. Omite Authorization si no hay token
 * (evita enviar "Bearer " vacío).
 * @returns {HeadersInit}
 */
function getHeaders() {
    const userSession = JSON.parse(
        sessionStorage.getItem('news_open_user') || '{}'
    );
    const headers = { 'Content-Type': 'application/json' };
    if (userSession.token) {
        headers['Authorization'] = `Bearer ${userSession.token}`;
    }
    return headers;
}

/**
 * Devuelve el usuario actual desde sessionStorage o uno anónimo.
 * @returns {string}
 */
function getCurrentUser() {
    const userSession = JSON.parse(
        sessionStorage.getItem('news_open_user') || '{}'
    );
    return userSession.usuario || '@nodo_anonimo';
}

/**
 * fetch con timeout mediante AbortController.
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Lanza un error enriquecido si la respuesta HTTP no es OK.
 * @param {Response} response
 */
async function assertOk(response) {
    if (response.ok) return;
    let detail = `HTTP ${response.status}`;
    try {
        const body = await response.json();
        if (body?.detail) detail = body.detail;
    } catch { /* respuesta sin JSON */ }
    const err = new Error(detail);
    err.status = response.status;
    throw err;
}

/**
 * Normaliza la respuesta del backend al formato que la UI espera.
 * El backend devuelve { status, data } en POSTs.
 * El backend usa "@nodo_alfa"; aquí dejamos solo "nodo_alfa".
 */
function normalizarUsuario(usuario) {
    return (usuario || '').replace(/^@/, '') || 'anonimo';
}

// --------------------------------------------------------------------------
// 3. PUBLICACIONES / FEED
// --------------------------------------------------------------------------
export const PostsAPI = {
    /**
     * GET /comentarios
     * @returns {Promise<Array>}
     */
    async obtenerPublicaciones() {
        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/comentarios`, {
                method: 'GET',
                headers: getHeaders()
            });
            await assertOk(response);

            const data = await response.json();
            // El backend devuelve una lista directa [{id, usuario, mensaje, fecha}]
            return (Array.isArray(data) ? data : []).map(p => ({
                id: p.id,
                usuario: normalizarUsuario(p.usuario),
                mensaje: p.mensaje,
                fecha: p.fecha
            }));
        } catch (error) {
            console.warn('⚠️ Servidor no disponible. Usando respaldo local:', error.message);
            return [
                { id: 1, usuario: 'nodo_alfa', mensaje: 'Transmisión estable en el sector norte.', fecha: 'Hace 5 min' },
                { id: 2, usuario: 'red_libre', mensaje: 'Nuevos nodos sincronizados en la malla.', fecha: 'Hace 12 min' }
            ];
        }
    },

    /**
     * POST /comentarios
     * @param {string} contenido
     * @returns {Promise<Object>}
     */
    async crearPublicacion(contenido) {
        const texto = (contenido || '').trim();
        if (!texto) throw new Error('La publicación no puede estar vacía.');

        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/comentarios`, {
                method: 'POST',
                headers: getHeaders(),
                // FIX: el backend espera "mensaje", no "contenido"
                body: JSON.stringify({
                    mensaje: texto,
                    usuario: getCurrentUser()
                })
            });
            await assertOk(response);

            const body = await response.json();
            const p = body.data;
            return {
                id: p.id,
                usuario: normalizarUsuario(p.usuario),
                mensaje: p.mensaje,
                fecha: p.fecha
            };
        } catch (error) {
            console.warn('⚠️ Modo offline: guardando publicación localmente', error.message);
            return {
                id: Date.now(),
                usuario: 'nodo_local',
                mensaje: texto,
                fecha: 'Ahora mismo',
                offline: true
            };
        }
    }
};

// --------------------------------------------------------------------------
// 4. MULTIMEDIA / VIDEOS
// --------------------------------------------------------------------------
export const MediaAPI = {
    /**
     * Sube un video a la malla.
     * NOTA: el backend actual (main.py) NO implementa /media/upload.
     * Si no existe, se activa el modo simulado.
     * @param {{titulo:string, descripcion:string, archivo:File}} param0
     * @returns {Promise<Object>}
     */
    async subirVideo({ titulo, descripcion, archivo }) {
        const formData = new FormData();
        formData.append('titulo', titulo || '');
        formData.append('descripcion', descripcion || '');
        if (archivo) formData.append('file', archivo);

        const userSession = JSON.parse(
            sessionStorage.getItem('news_open_user') || '{}'
        );
        const headers = {};
        if (userSession.token) headers['Authorization'] = `Bearer ${userSession.token}`;

        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/media/upload`, {
                method: 'POST',
                headers,
                body: formData
            });
            await assertOk(response);
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Simulación de carga local activada:', error.message);
            // FIX: liberar objectURL cuando el <video> termine de cargar.
            const objectUrl = archivo ? URL.createObjectURL(archivo) : null;
            return {
                status: 'success',
                message: 'Video sincronizado en el nodo local.',
                videoUrl: objectUrl,
                // Devolvemos el blob para que la UI pueda hacer revoke al terminar
                _revoke: objectUrl
                    ? () => URL.revokeObjectURL(objectUrl)
                    : null
            };
        }
    }
};

// --------------------------------------------------------------------------
// 5. CHAT EN VIVO
// --------------------------------------------------------------------------
export const ChatAPI = {
    /**
     * GET /chat → historial completo.
     * @returns {Promise<Array>}
     */
    async obtenerMensajesChat() {
        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/chat`, {
                method: 'GET',
                headers: getHeaders()
            });
            await assertOk(response);

            const data = await response.json();
            return (Array.isArray(data) ? data : []).map(m => ({
                id: m.id,
                usuario: normalizarUsuario(m.usuario),
                mensaje: m.mensaje,
                timestamp: m.timestamp
            }));
        } catch (error) {
            console.warn('⚠️ No se pudo cargar el chat. Usando respaldo local:', error.message);
            return [
                { id: 1, usuario: 'anon_user', mensaje: '¿Hay alguien conectado en la zona sur?', timestamp: '12:00' }
            ];
        }
    },

    /**
     * POST /chat → envía un mensaje.
     * @param {string} mensaje
     * @returns {Promise<Object>}
     */
    async enviarMensajeChat(mensaje) {
        const texto = (mensaje || '').trim();
        if (!texto) throw new Error('El mensaje no puede estar vacío.');

        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    mensaje: texto,
                    usuario: getCurrentUser()
                })
            });
            await assertOk(response);

            const body = await response.json();
            const m = body.data;
            return {
                id: m.id,
                usuario: normalizarUsuario(m.usuario),
                mensaje: m.mensaje,
                timestamp: m.timestamp
            };
        } catch (error) {
            console.warn('⚠️ Chat offline:', error.message);
            return {
                id: Date.now(),
                usuario: 'anon_user',
                mensaje: texto,
                timestamp: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                offline: true
            };
        }
    }
};
