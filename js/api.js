// ==========================================
// CONFIGURACIÓN DEL SERVIDOR (Afinación Centralizada)
// ==========================================
// LOCAL (Para pruebas en tu PC):
const API_URL = 'https://news-open-backend.onrender.com';

// NUBE (Cuando lances a Render, borras las barras "//" de la línea de abajo y se las pones a la de arriba):
// const API_URL = "https://newsopen-backend.onrender.com";

// Esperar a que la interfaz este lista
document.addEventListener("DOMContentLoaded", () => {
    const btnEnviar = document.getElementById('btn-enviar-comentario');
    if (btnEnviar) {
        btnEnviar.addEventListener('click', () => {
            const cajaTexto = document.getElementById('comentario-input');
            if (cajaTexto) {
                verificarComentarioConIA(cajaTexto.value);
            }
        });
    }
});

async function verificarComentarioConIA(texto) {
    const descripcionNodo = document.getElementById('nodo-descripcion');
    const cajaTexto = document.getElementById('comentario-input');
    
    if (!texto.trim()) {
        alert("Por favor, introduce contenido para publicar.");
        return;
    }

    // Quitar alertas previas para no saturar la pantalla
    const alertaPrevia = document.getElementById('alerta-ia-status');
    if (alertaPrevia) alertaPrevia.remove();

    try {
        // Peticion directa usando nuestra variable centralizada 🚀
        const respuesta = await fetch(`${API_URL}/verificar-comentario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto: texto })
        });

        const resultado = await respuesta.json();

        // Crear la alerta visual en el panel
        const cajaAlerta = document.createElement('div');
        cajaAlerta.id = 'alerta-ia-status';
        cajaAlerta.style.marginTop = '12px';
        cajaAlerta.style.padding = '10px';
        cajaAlerta.style.borderRadius = '6px';
        cajaAlerta.style.fontSize = '12px';

        if (resultado.valido) {
            // APROBADO: Alerta Verde
            cajaAlerta.style.background = 'rgba(16, 185, 129, 0.15)';
            cajaAlerta.style.border = '1px solid #10b981';
            cajaAlerta.style.color = '#34d399';
            cajaAlerta.innerHTML = `<strong>🟢 Publicado:</strong> ${resultado.mensaje}`;
            if (cajaTexto) cajaTexto.value = ""; // Limpiar el cuadro
            
            // 🔄 SOLUCIÓN AL FALTANTE: Forzar actualización inmediata del feed al publicar con éxito
            cargarFeedDesdeServidor();
        } else {
            // RECHAZADO: Alerta Roja (Filtro de insultos)
            cajaAlerta.style.background = 'rgba(239, 68, 68, 0.15)';
            cajaAlerta.style.border = '1px solid #ef4444';
            cajaAlerta.style.color = '#f87171';
            cajaAlerta.innerHTML = `<strong>🔴 Bloqueado por Moderacion:</strong> ${resultado.mensaje}`;
        }

        if (descripcionNodo) {
            descripcionNodo.appendChild(cajaAlerta);
        }

    } catch (error) {
        console.error("Error de conexion con el Backend:", error);
        alert("News Open: El servidor de Python no responde. ¡Asegúrate de iniciar tu script de FastAPI!");
    }
}

// 1. DICCIONARIO DE IDIOMAS
const traducciones = {
    es: {
        tituloLogin: "NEWS OPEN • SECURE LOGIN",
        instruccionLogin: "Iniciando escáner de seguridad...",
        btnDictar: "Dictar Datos de Registro",
        ejemploDictar: 'Ejemplo: "Mi correo es... nací el... mi país es..."',
        lblCorreo: "Correo Electrónico:",
        lblFecha: "F. Nacimiento:",
        lblPais: "País:",
        lblGps: "Ubicación del Nodo (GPS):",
        lblPin: "PIN de Respaldo:",
        btnValidar: "Validar e Ingresar a la Malla",
        mallaSubtitulo: "Malla de Información Comunitaria y Descentralizada",
        placeholderTxt: "Escribe un reporte libre y seguro en este nodo...",
        btnTransmitir: "Transmitir con Filtro de IA"
    },
    en: {
        tituloLogin: "NEWS OPEN • SECURE LOGIN",
        instruccionLogin: "Starting security scanner...",
        btnDictar: "Dictate Registration Data",
        ejemploDictar: 'Example: "My email is... I was born... my country is..."',
        lblCorreo: "Email Address:",
        lblFecha: "Birthdate:",
        lblPais: "Country:",
        lblGps: "Node Location (GPS):",
        lblPin: "Backup PIN:",
        btnValidar: "Validate & Enter the Mesh",
        mallaSubtitulo: "Community and Decentralized Information Mesh",
        placeholderTxt: "Write a free and secure report on this node...",
        btnTransmitir: "Transmit with AI Filter"
    },
    pt: {
        tituloLogin: "NEWS OPEN • SECURE LOGIN",
        instruccionLogin: "Iniciando scanner de segurança...",
        btnDictar: "Ditar Dados de Registro",
        ejemploDictar: 'Exemplo: "Meu e-mail é... nasci em... meu país é..."',
        lblCorreo: "Correio Eletrônico:",
        lblFecha: "Data de Nasc.:",
        lblPais: "País:",
        lblGps: "Localização do Nó (GPS):",
        lblPin: "PIN de Segurança:",
        btnValidar: "Validar e Entrar na Rede",
        mallaSubtitulo: "Rede de Informação Comunitária e Descentralizada",
        placeholderTxt: "Escreva um relatório livre e seguro neste nó...",
        btnTransmitir: "Transmitir com Filtro de IA"
    }
};

// 2. FUNÇÃO QUE CAMBIA LOS TEXTOS EN LA PANTALLA
function cambiarIdioma(idioma) {
    const t = traducciones[idioma];
    if (!t) return;

    document.querySelector("#login-biometrico h2").innerHTML = t.tituloLogin;
    document.getElementById("biometria-instruccion").innerText = t.instruccionLogin;
    document.getElementById("btn-dictar-registro").innerText = t.btnDictar;
    document.querySelector("#controles-security p").innerText = t.ejemploDictar;
    
    const labels = document.querySelectorAll(".form-group label");
    if(labels.length >= 5) {
        labels[0].innerText = t.lblCorreo;
        labels[1].innerText = t.lblFecha;
        labels[2].innerText = t.lblPais;
        labels[3].innerText = t.lblGps;
        labels[4].innerText = t.lblPin;
    }
    
    document.getElementById("btn-verificar-todo").innerText = t.btnValidar;

    document.querySelector("#ui-container p").innerText = t.mallaSubtitulo;
    document.getElementById("comentario-input").placeholder = t.placeholderTxt;
    document.getElementById("btn-enviar-comentario").innerText = t.btnTransmitir;
}

document.addEventListener("DOMContentLoaded", () => {
    const selector = document.getElementById("selector-idioma");
    if (selector) {
        selector.addEventListener("change", (e) => {
            cambiarIdioma(e.target.value);
        });
    }
});

// =====================================================================
// 🔄 NUEVO SISTEMA CONECTADO AL BACKEND EN TIEMPO REAL
// =====================================================================

// Carga las publicaciones reales que están guardadas en tu Python
async function cargarFeedDesdeServidor() {
    const contenedor = document.getElementById("chat-messages-container");
    if (!contenedor) return;

    try {
        const respuesta = await fetch(`${API_URL}/comentarios`);
        if (!respuesta.ok) return;
        
        const comentariosReales = await respuesta.json();
        
        // Limpiamos el contenedor viejo para renderizar la lista fresca sin duplicados
        contenedor.innerHTML = "";

        comentariosReales.forEach(pub => {
            agregarPublicacionAlFeed(pub);
        });
    } catch (error) {
        console.error("Error actualizando la red de publicaciones:", error);
    }
}

function agregarPublicacionAlFeed(pub) {
    const contenedor = document.getElementById("chat-messages-container");
    if (!contenedor) return;

    const burbuja = document.createElement("div");
    burbuja.className = "chat-bubble";
    
    let contenidoVideo = "";
    if (pub.tipo === "video") {
        contenidoVideo = `<div class="chat-video-preview"></div>`;
    }

    burbuja.innerHTML = `
        <div class="chat-meta">
            <span>⚡ @${pub.usuario}</span>
            <span>${pub.loc}</span>
        </div>
        <div class="chat-text">${pub.texto}</div>
        ${contenidoVideo}
    `;

    contenedor.appendChild(burbuja);
    contenedor.scrollTop = contenedor.scrollHeight;
}

// Arrancar la conexión real con el servidor
document.addEventListener("DOMContentLoaded", () => {
    // Primera carga manual instantánea
    cargarFeedDesdeServidor();

    // 📡 Loop Sincronizado: Pide datos reales al backend cada 5 segundos
    setInterval(cargarFeedDesdeServidor, 5000);
});


// =====================================================================
// 📱 ADAPTACIÓN INTELIGENTE PARA CELULARES (BOTÓN FLOTANTE COMENTARIOS)
// =====================================================================
(function() {
    function inicializarPanelMovil() {
        if (window.innerWidth <= 768) {
            const panel = document.getElementById('nodo-descripcion')?.parentElement || 
                          document.querySelector('.panel-derecho-comentarios') || 
                          document.querySelector('aside') || 
                          document.querySelector('[class*="comentario"]');

            if (panel && !document.getElementById('btn-comentarios-movil')) {
                
                panel.style.position = 'fixed';
                panel.style.top = '0';
                panel.style.right = '-100%'; 
                panel.style.width = '85%';
                panel.style.height = '100vh';
                panel.style.backgroundColor = '#1e1e2e'; 
                panel.style.color = '#ffffff';
                panel.style.zIndex = '1000';
                panel.style.transition = 'right 0.4s ease';
                panel.style.boxShadow = '-5px 0 15px rgba(0,0,0,0.5)';
                panel.style.overflowY = 'auto';
                panel.style.padding = '20px';

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
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '24px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    zIndex: '1001',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none'
                });

                document.body.appendChild(botonMovil);

                botonMovil.addEventListener('click', function() {
                    if (panel.style.right === '-100%') {
                        panel.style.right = '0'; 
                        botonMovil.innerText = '❌';
                        botonMovil.style.backgroundColor = '#dc3545';
                    } else {
                        panel.style.right = '-100%'; 
                        botonMovil.innerText = '💬';
                        botonMovil.style.backgroundColor = '#007bff';
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
    window.addEventListener('resize', inicializarPanelMovil);
})();
