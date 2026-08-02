// ==========================================
// CONFIGURACIÓN DEL SERVIDOR (Afinación Centralizada)
// ==========================================
// LOCAL / NUBE:
const API_URL = 'https://news-open-backend.onrender.com';

// Esperar a que la interfaz esté lista
document.addEventListener("DOMContentLoaded", () => {
    // Escuchar el botón de enviar publicación (Planeta Azul)
    const btnEnviar = document.getElementById('btn-enviar-comentario');
    if (btnEnviar) {
        btnEnviar.addEventListener('click', () => {
            const cajaTexto = document.getElementById('comentario-input');
            if (cajaTexto) {
                verificarComentarioConIA(cajaTexto.value);
            }
        });
    }

    // Escuchar el selector de idiomas de forma segura
    const selector = document.getElementById("selector-idioma");
    if (selector) {
        selector.addEventListener("change", (e) => {
            cambiarIdioma(e.target.value);
        });
    }

    // Carga inicial y bucle de sincronización del feed
    cargarFeedDesdeServidor();
    setInterval(cargarFeedDesdeServidor, 5000);
});

// =====================================================================
// 🤖 Petición al Backend con Moderación de IA
// =====================================================================
async function verificarComentarioConIA(texto) {
    const cajaTexto = document.getElementById('comentario-input');
    const contenedorFeed = document.getElementById('chat-messages-container');
    
    if (!texto || !texto.trim()) {
        alert("Por favor, introduce contenido para publicar.");
        return;
    }

    // Quitar alertas previas
    const alertaPrevia = document.getElementById('alerta-ia-status');
    if (alertaPrevia) alertaPrevia.remove();

    try {
        const respuesta = await fetch(`${API_URL}/verificar-comentario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto: texto })
        });

        const resultado = await respuesta.json();

        // Crear notificación visual
        const cajaAlerta = document.createElement('div');
        cajaAlerta.id = 'alerta-ia-status';
        cajaAlerta.style.marginTop = '10px';
        cajaAlerta.style.padding = '8px 12px';
        cajaAlerta.style.borderRadius = '6px';
        cajaAlerta.style.fontSize = '12px';

        if (resultado.valido) {
            cajaAlerta.style.background = 'rgba(16, 185, 129, 0.15)';
            cajaAlerta.style.border = '1px solid #10b981';
            cajaAlerta.style.color = '#34d399';
            cajaAlerta.innerHTML = `<strong>🟢 Publicado:</strong> ${resultado.mensaje}`;
            
            if (cajaTexto) cajaTexto.value = ""; // Limpiar input
            
            // Forzar actualización inmediata del feed
            cargarFeedDesdeServidor();
        } else {
            cajaAlerta.style.background = 'rgba(239, 68, 68, 0.15)';
            cajaAlerta.style.border = '1px solid #ef4444';
            cajaAlerta.style.color = '#f87171';
            cajaAlerta.innerHTML = `<strong>🔴 Bloqueado por Moderación:</strong> ${resultado.mensaje}`;
        }

        if (contenedorFeed && contenedorFeed.parentElement) {
            contenedorFeed.parentElement.appendChild(cajaAlerta);
        }

    } catch (error) {
        console.error("Error de conexión con el Backend:", error);
        alert("News Open: El servidor backend no responde.");
    }
}

// =====================================================================
// 🌐 DICCIONARIO Y TRADUCCIÓN SEGURO (Sin romper la ejecución)
// =====================================================================
const traducciones = {
    es: {
        lblCorreo: "Correo Electrónico:",
        lblFecha: "F. Nacimiento:",
        lblPais: "País:",
        lblGps: "Ubicación del Nodo (GPS):",
        lblPin: "PIN de Respaldo:",
        btnValidar: "Validar e Ingresar a la Malla",
        placeholderTxt: "Escribe un nuevo reporte o publicación...",
        btnTransmitir: "CREAR PUBLICACIÓN"
    },
    en: {
        lblCorreo: "Email Address:",
        lblFecha: "Birthdate:",
        lblPais: "Country:",
        lblGps: "Node Location (GPS):",
        lblPin: "Backup PIN:",
        btnValidar: "Validate & Enter Mesh",
        placeholderTxt: "Write a new report or post...",
        btnTransmitir: "CREATE POST"
    },
    pt: {
        lblCorreo: "Correio Eletrônico:",
        lblFecha: "Data de Nasc.:",
        lblPais: "País:",
        lblGps: "Localização do Nó (GPS):",
        lblPin: "PIN de Segurança:",
        btnValidar: "Validar e Entrar na Rede",
        placeholderTxt: "Escreva un novo relatório...",
        btnTransmitir: "CRIAR PUBLICAÇÃO"
    }
};

function cambiarIdioma(idioma) {
    const t = traducciones[idioma];
    if (!t) return;

    // Asignación segura con verifcaciones condicionales (Evita crash por null)
    const labels = document.querySelectorAll("#login-biometrico .form-group label");
    if (labels.length >= 5) {
        labels[0].innerText = t.lblCorreo;
        labels[1].innerText = t.lblFecha;
        labels[2].innerText = t.lblPais;
        labels[3].innerText = t.lblGps;
        labels[4].innerText = t.lblPin;
    }

    const btnValidar = document.getElementById("btn-verificar-todo");
    if (btnValidar) btnValidar.innerText = t.btnValidar;

    const inputComentario = document.getElementById("comentario-input");
    if (inputComentario) inputComentario.placeholder = t.placeholderTxt;

    const btnEnviar = document.getElementById("btn-enviar-comentario");
    if (btnEnviar) btnEnviar.innerText = t.btnTransmitir;
}

// =====================================================================
// 🔄 SISTEMA FEED EN TIEMPO REAL
// =====================================================================
async function cargarFeedDesdeServidor() {
    const contenedor = document.getElementById("chat-messages-container");
    if (!contenedor) return;

    try {
        const respuesta = await fetch(`${API_URL}/comentarios`);
        if (!respuesta.ok) return;
        
        const comentariosReales = await respuesta.json();
        contenedor.innerHTML = ""; // Limpiar antes de actualizar

        comentariosReales.forEach(pub => {
            agregarPublicacionAlFeed(pub);
        });
    } catch (error) {
        console.error("Error sincronizando publicaciones:", error);
    }
}

function agregarPublicacionAlFeed(pub) {
    const contenedor = document.getElementById("chat-messages-container");
    if (!contenedor) return;

    const burbuja = document.createElement("div");
    burbuja.className = "chat-message-bubble bubble-cyan";
    burbuja.style.marginBottom = "10px";
    burbuja.style.padding = "10px";
    burbuja.style.background = "rgba(0, 123, 255, 0.15)";
    burbuja.style.borderLeft = "3px solid #007bff";
    burbuja.style.borderRadius = "4px";
    
    let contenidoExtra = "";
    if (pub.tipo === "video") {
        contenidoExtra = `<div style="margin-top:5px; color:#ef4444; font-size:11px;">📹 [Video adjunto]</div>`;
    }

    burbuja.innerHTML = `
        <div style="font-size: 11px; color: #93c5fd; margin-bottom: 4px;">
            <strong>@${pub.usuario || 'anonimo'}</strong> • <span style="opacity:0.7;">${pub.loc || 'Nodo Global'}</span>
        </div>
        <div style="font-size: 13px; color: #fff;">${pub.texto}</div>
        ${contenidoExtra}
    `;

    contenedor.appendChild(burbuja);
    contenedor.scrollTop = contenedor.scrollHeight;
}

// =====================================================================
// 📱 ADAPTACIÓN INTELIGENTE PARA MOVILES
// =====================================================================
(function() {
    function inicializarPanelMovil() {
        if (window.innerWidth <= 768) {
            const panel = document.querySelector('.hologram-modal');

            if (panel && !document.getElementById('btn-comentarios-movil')) {
                const botonMovil = document.createElement('button');
                botonMovil.id = 'btn-comentarios-movil';
                botonMovil.innerText = '💬';
                
                Object.assign(botonMovil.style, {
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '20px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                    zIndex: '9999',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                });

                document.body.appendChild(botonMovil);

                botonMovil.addEventListener('click', function() {
                    if (window.abrirVentana) {
                        window.abrirVentana('modal-comentarios');
                    }
                });
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarPanelMovil);
    } else {
        inicializarPanelMovil();
    }
})();
// Función para enviar mensajes desde el input
async function enviarMensajeChat() {
  const input = document.getElementById('chat-input');
  const mensaje = input.value.trim();

  if (!mensaje) return;

  // 1. Mostrar de inmediato el mensaje en la interfaz (UX rápida)
  agregarMensajeAlChat('Tú', mensaje, 'propio');
  input.value = ''; // Limpiar el input

  try {
    // 2. Enviar el mensaje a tu backend de FastAPI
    const respuesta = await fetch('/api/chat/enviar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensaje: mensaje })
    });

    if (!respuesta.ok) {
      console.error('Error al enviar el mensaje al servidor');
    }
  } catch (error) {
    console.error('Error de conexión:', error);
  }
}

// Función auxiliar para renderizar el mensaje en el contenedor
function agregarMensajeAlChat(usuario, texto, tipo = 'remoto') {
  const contenedor = document.getElementById('chat-messages');
  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-msg ${tipo}`;
  msgDiv.innerHTML = `<strong>${usuario}:</strong> ${texto}`;
  
  contenedor.appendChild(msgDiv);
  
  // Auto-scroll hacia el último mensaje
  contenedor.scrollTop = contenedor.scrollHeight;
}
