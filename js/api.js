// ==========================================================================
// API.JS - Capa de Comunicación HTTP / WebSocket para News Open
// ==========================================================================

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api/v1'
    : 'https://api.newsopen.net/v1';

/**
 * Obtiene las cabeceras de autorización con el token almacenado en sesión.
 * @returns {HeadersInit}
 */
function getHeaders() {
    const userSession = JSON.parse(sessionStorage.getItem('news_open_user') || '{}');
    return {
        'Content-Type': 'application/json',
        'Authorization': userSession.token ? `Bearer ${userSession.token}` : ''
    };
}

/**
 * Publicaciones / Reportes de la Malla
 */
export const PostsAPI = {
    /**
     * Obtiene las publicaciones activas.
     * @returns {Promise<Array>} Lista de noticias/comentarios.
     */
    async obtenerPublicaciones() {
        try {
            const response = await fetch(`${API_BASE_URL}/posts`, {
                method: 'GET',
                headers: getHeaders()
            });

            if (!response.ok) throw new Error('Error al obtener publicaciones');
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Servidor no disponible. Usando datos locales de respaldo:', error.message);
            return [
                { id: 1, usuario: 'nodo_alfa', mensaje: 'Transmisión estable en el sector norte.', fecha: 'Hace 5 min' },
                { id: 2, usuario: 'red_libre', mensaje: 'Nuevos nodos sincronizados en la malla.', fecha: 'Hace 12 min' }
            ];
        }
    },

    /**
     * Envía una nueva publicación a la red.
     * @param {string} contenido 
     * @returns {Promise<Object>}
     */
    async crearPublicacion(contenido) {
        try {
            const response = await fetch(`${API_BASE_URL}/posts`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ contenido })
            });

            if (!response.ok) throw new Error('Error al transmitir la publicación');
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Modo Offline: Guardando publicación localmente');
            return {
                id: Date.now(),
                usuario: 'nodo_local',
                mensaje: contenido,
                fecha: 'Ahora mismo'
            };
        }
    }
};

/**
 * Carga de Contenido Multimedia / Videos
 */
export const MediaAPI = {
    /**
     * Transmite/sube un video a la malla de News Open.
     * @param {Object} videoData 
     * @param {string} videoData.titulo
     * @param {string} videoData.descripcion
     * @param {File} videoData.archivo
     * @returns {Promise<Object>}
     */
    async subirVideo({ titulo, descripcion, archivo }) {
        const formData = new FormData();
        formData.append('titulo', titulo);
        formData.append('descripcion', descripcion);
        if (archivo) formData.append('file', archivo);

        try {
            const userSession = JSON.parse(sessionStorage.getItem('news_open_user') || '{}');
            const response = await fetch(`${API_BASE_URL}/media/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': userSession.token ? `Bearer ${userSession.token}` : ''
                },
                body: formData
            });

            if (!response.ok) throw new Error('Fallo al subir el archivo multimedia');
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Simulación de carga local activada:', error.message);
            return {
                status: 'success',
                message: 'Video sincronizado en el nodo local.',
                videoUrl: archivo ? URL.createObjectURL(archivo) : null
            };
        }
    }
};

/**
 * Chat en Vivo / Mensajería
 */
export const ChatAPI = {
    /**
     * Envía un mensaje directo al chat general en vivo.
     * @param {string} mensaje 
     * @returns {Promise<Object>}
     */
    async enviarMensajeChat(mensaje) {
        try {
            const response = await fetch(`${API_BASE_URL}/chat/send`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ mensaje })
            });

            if (!response.ok) throw new Error('Error al transmitir mensaje');
            return await response.json();
        } catch (error) {
            return {
                usuario: 'anon_user',
                mensaje: mensaje,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
        }
    }
};
