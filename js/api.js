// ==========================================
// CONFIGURACIÓN DEL SERVIDOR (Afinación Centralizada)
// ==========================================
// LOCAL (Para pruebas en tu PC):
const API_URL = "https://news-open-backend.onrender.com/filtrar";

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
            cajaAlerta.innerHTML = `<strong>🟢 Publicado:</strong> ${resultado.mensaje}`; // <-- CORREGIDO AQUÍ
            if (cajaTexto) cajaTexto.value = ""; // Limpiar el cuadro
        } else {
            // RECHAZADO: Alerta Roja (Filtro de insultos)
            cajaAlerta.style.background = 'rgba(239, 68, 68, 0.15)';
            cajaAlerta.style.border = '1px solid #ef4444';
            cajaAlerta.style.color = '#f87171';
            cajaAlerta.innerHTML = `<strong>🔴 Bloqueado por Moderacion:</strong> ${resultado.mensaje}`; // <-- CORREGIDO AQUÍ
        }

        if (descripcionNodo) {
            descripcionNodo.appendChild(cajaAlerta);
        }

    } catch (error) {
        console.error("Error de conexion con el Backend:", error);
        alert("News Open: El servidor de Python (Puerto 8001) no responde. ¡Asegurate de iniciar tu script de FastAPI en la otra consola!");
    }
}

// 1. DICCIONARIO DE IDIOMAS (Agrega las frases clave de tu interfaz)
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

    // Traducir pantalla de Login
    document.querySelector("#login-biometrico h2").innerHTML = t.tituloLogin;
    document.getElementById("biometria-instruccion").innerText = t.instruccionLogin;
    document.getElementById("btn-dictar-registro").innerText = t.btnDictar;
    document.querySelector("#controles-security p").innerText = t.ejemploDictar;
    
    // Traducir etiquetas del formulario (Buscamos por texto interno)
    const labels = document.querySelectorAll(".form-group label");
    if(labels.length >= 5) {
        labels[0].innerText = t.lblCorreo;
        labels[1].innerText = t.lblFecha;
        labels[2].innerText = t.lblPais;
        labels[3].innerText = t.lblGps;
        labels[4].innerText = t.lblPin;
    }
    
    document.getElementById("btn-verificar-todo").innerText = t.btnValidar;

    // Traducir Interfaz principal
    document.querySelector("#ui-container p").innerText = t.mallaSubtitulo;
    document.getElementById("comentario-input").placeholder = t.placeholderTxt;
    document.getElementById("btn-enviar-comentario").innerText = t.btnTransmitir;
}

// 3. ESCUCHAR CUANDO EL USUARIO CAMBIE EL SELECTOR
document.addEventListener("DOMContentLoaded", () => {
    const selector = document.getElementById("selector-idioma");
    if (selector) {
        selector.addEventListener("change", (e) => {
            cambiarIdioma(e.target.value);
        });
    }
});
document.addEventListener('DOMContentLoaded', function() {
    const botonMovil = document.getElementById('btn-comentarios-movil');
    const panelComentarios = document.querySelector('.panel-derecho-comentarios'); // Tu clase del panel

    botonMovil.addEventListener('click', function() {
        // Esta función 'toglea' (agrega o quita) la clase que lo despliega
        panelComentarios.classList.toggle('desplegado');
        
        // Cambiamos el icono para saber que se puede cerrar
        if (panelComentarios.classList.contains('desplegado')) {
            botonMovil.innerText = '❌';
        } else {
            botonMovil.innerText = '💬';
        }
    });
});

// SIMULADOR DE TRANSMISIONES INTERNACIONALES EN VIVO
const publicacionesSimuladas = [
    { usuario: "anon_tokyo", loc: "TOKIO, JP (35.67, 139.65)", texto: "Malla estable en Asia. Reportando clima despejado y tráfico de red normal.", tipo: "texto" },
    { usuario: "operator_ny", loc: "NUEVA YORK, US (40.71, -74.00)", texto: "Señal de transmisión de video establecida desde Manhattan.", tipo: "video" },
    { usuario: "berlin_node", loc: "BERLÍN, DE (52.52, 13.40)", texto: "¡Increíble la velocidad de respuesta del filtro de IA local!", tipo: "texto" },
    { usuario: "amazonas_libre", loc: "MANAOS, BR (-3.11, -60.02)", texto: "Transmisión satelital comunitaria activa.", tipo: "video" }
];

function inicializarSimuladorFeed() {
    const contenedor = document.getElementById("chat-messages-container");
    if (!contenedor) return;

    // Insertar las publicaciones iniciales en la caja flotante
    publicacionesSimuladas.forEach(pub => {
        agregarPublicacionAlFeed(pub);
    });

    // Cada 12 segundos simulamos que entra un nuevo usuario aleatorio en el mundo
    setInterval(() => {
        const usuariosNuevos = ["paris_connect", "sydney_mesh", "cairo_operator", "andes_node"];
        const textosNuevos = ["Enlace de datos verificado.", "Todo limpio por aquí.", "Transmitiendo paquetes seguros.", "Conectando al planeta."];
        const userRandom = usuariosNuevos[Math.floor(Math.random() * usuariosNuevos.length)];
        const textRandom = textosNuevos[Math.floor(Math.random() * textosNuevos.length)];
        const esVideo = Math.random() > 0.5;

        agregarPublicacionAlFeed({
            usuario: userRandom,
            loc: `SATELLITE_NODE_//_${userRandom.toUpperCase()}`,
            texto: textRandom,
            tipo: esVideo ? "video" : "texto"
        });
    }, 12000);
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
    // Auto-scroll hacia abajo para ver el último mensaje
    contenedor.scrollTop = contenedor.scrollHeight;
}

// Arrancar el simulador cuando cargue la página
document.addEventListener("DOMContentLoaded", inicializarSimuladorFeed);
