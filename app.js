// Variable global para retener la base de datos curricular una vez leída
let dbPlanificadorCCSS = null;

// Configuración de los verbos de Bloom para la interfaz
const dbBloomLocal = {
    "Recordar": "Identificar, listar, nombrar, localizar, reconocer.",
    "Comprender": "Explicar, describir, clasificar, resumir, ilustrar.",
    "Aplicar": "Emplear, utilizar, calcular, resolver, trazar.",
    "Analizar": "Comparar, contrastar, diferenciar, analizar, debatir.",
    "Evaluar": "Justificar, defender, evaluar, defender, criticar.",
    "Crear": "Diseñar, proponer, formular, elaborar, producir."
};

// ASINCRONÍA DE ARRANQUE: Leer el JSON apenas cargue la estructura
window.addEventListener("load", () => {
    recuperarApiKeyLocal();
    cargarArchivoJsonCurricular();
    
    // Escuchar cambios de selectores para actualizar en cascada
    document.getElementById("ciclo-select").addEventListener("change", actualizarCascadaFormulario);
    document.getElementById("competencia-select").addEventListener("change", actualizarCascadaFormulario);
    document.getElementById("bloom-select").addEventListener("change", actualizarTextoVerbos);
    
    // Monitorear ingreso de texto en la Key
    document.getElementById("api-key-input").addEventListener("input", () => {
        const key = document.getElementById("api-key-input").value.trim();
        marcarEstadoKey(key.length > 0);
    });
});

// LEER EL ARCHIVO JSON MODULAR
async function cargarArchivoJsonCurricular() {
    try {
        const respuesta = await fetch('./ccss_secundaria.json');
        if (!respuesta.ok) {
            throw new Error("No se pudo leer el archivo ccss_secundaria.json");
        }
        dbPlanificadorCCSS = await respuesta.json();
        poblarDesplegablesIniciales();
    } catch (error) {
        console.error(error);
        alert("Error de enlace: El archivo 'ccss_secundaria.json' no se encuentra o está mal escrito en GitHub.");
    }
}

function poblarDesplegablesIniciales() {
    if (!dbPlanificadorCCSS) return;

    const selectEnfoque = document.getElementById("enfoque-select");
    selectEnfoque.innerHTML = "";
    dbPlanificadorCCSS.enfoques_transversales_oficiales.forEach((enf, i) => {
        selectEnfoque.innerHTML += `<option value="${i}">${enf.nombre}</option>`;
    });

    const selectComp = document.getElementById("competencia-select");
    selectComp.innerHTML = "";
    dbPlanificadorCCSS.competencias_completas_ccss.forEach(c => {
        selectComp.innerHTML += `<option value="${c.codigo}">${c.nombre}</option>`;
    });

    actualizarCascadaFormulario();
}

function actualizarCascadaFormulario() {
    if (!dbPlanificadorCCSS) return;

    const codigoComp = document.getElementById("competencia-select").value;
    const ciclo = document.getElementById("ciclo-select").value;
    const compData = dbPlanificadorCCSS.competencias_completas_ccss.find(c => c.codigo === codigoComp);

    // Actualizar Capacidades
    const capContainer = document.getElementById("capacidades-container");
    capContainer.innerHTML = "";
    compData.capacidades.forEach(cap => {
        capContainer.innerHTML += `<div class="text-[11px] text-slate-600 font-medium">• ${cap}</div>`;
    });

    // Actualizar Desempeños
    const selectDes = document.getElementById("desempeno-select");
    selectDes.innerHTML = "";
    compData.desempenos_oficiales[ciclo].forEach((des, i) => {
        const corteTexto = des.length > 95 ? des.substring(0, 95) + "..." : des;
        selectDes.innerHTML += `<option value="${i}" title="${des}">${corteTexto}</option>`;
    });

    actualizarTextoVerbos();
}

function actualizarTextoVerbos() {
    const bloomKey = document.getElementById("bloom-select").value;
    document.getElementById("verbos-sugeridos").innerText = "Verbos CC.SS: " + dbBloomLocal[bloomKey];
}

// MANEJO DE LLAVE LOCAL
function guardarKey() {
    const key = document.getElementById("api-key-input").value.trim();
    if (key) {
        localStorage.setItem("key_modular_ccss", key);
        marcarEstadoKey(true);
        alert("API Key guardada con éxito.");
    }
}
function borrarKey() {
    localStorage.removeItem("key_modular_ccss");
    document.getElementById("api-key-input").value = "";
    marcarEstadoKey(false);
}
function recuperarApiKeyLocal() {
    const key = localStorage.getItem("key_modular_ccss");
    if (key) {
        document.getElementById("api-key-input").value = key;
        marcarEstadoKey(true);
    } else {
        marcarEstadoKey(false);
    }
}
function marcarEstadoKey(existe) {
    const el = document.getElementById("key-status");
    if (el) {
        if (existe) {
            el.innerHTML = `<i class="fa-solid fa-circle-check text-green-500"></i> Key lista`;
            el.className = "text-[11px] font-medium text-green-600 mt-2 flex items-center gap-1";
        } else {
            el.innerHTML = `<i class="fa-solid fa-circle-exclamation text-amber-500"></i> Esperando Key...`;
            el.className = "text-[11px] font-medium text-amber-600 mt-2 flex items-center gap-1";
        }
    }
}

// CONEXIÓN PRINCIPAL CON LA IA DE GOOGLE GEMINI
async function ejecutarPlanificacionConIA() {
    const apiKey = document.getElementById("api-key-input").value.trim();
    
    if (!apiKey) { 
        alert("Por favor, ingresa tu API Key de Gemini en el cuadro de la izquierda."); 
        document.getElementById("api-key-input").focus();
        return; 
    }

    // Guardado automático discreto
    localStorage.setItem("key_modular_ccss", apiKey);
    marcarEstadoKey(true);

    const tema = document.getElementById("tema-input").value.trim();
    if (!tema) { alert("Por favor, escribe el tema específico para la sesión."); return; }

    // Mostrar pantalla de carga
    document.getElementById("loading-overlay").classList.remove("hidden");
    document.getElementById("loading-overlay").classList.add("flex");

    const ciclo = document.getElementById("ciclo-select").value;
    const codigoComp = document.getElementById("competencia-select").value;
    const compData = dbPlanificadorCCSS.competencias_completas_ccss.find(c => c.codigo === codigoComp);
    const desIndex = document.getElementById("desempeno-select").value;
    const desBase = compData.desempenos_oficiales[ciclo][desIndex];
    const enfIndex = document.getElementById("enfoque-select").value;
    const enfData = dbPlanificadorCCSS.enfoques_transversales_oficiales[enfIndex];
    const bloom = document.getElementById("bloom-select").value;

    const promptFinal = `Actúa como especialista técnico-pedagógico del MINEDU del Perú.
Diseña los contenidos exactos de la sesión de aprendizaje basándote estrictamente en los datos de entrada provistos.
Debes responder ÚNICAMENTE con un objeto JSON plano, sin usar marcas markdown de bloque tipo \`\`\`json, sin comentarios. Solo el texto crudo del JSON con estas llaves textuales exactas:

{
  "desempenoPrecisado": "Redacta el desempeño oficial provisto pero precisado y adaptado exactamente al tema de la sesión",
  "estrategiasInicio": "Redacta las actividades docentes y de alumnos para la Problematización, Propósito, Motivación y Saberes previos",
  "recursosInicio": "Materiales didácticos de inicio",
  "estrategiasDesarrollo": "Secuencia de los procesos didácticos de Ciencias Sociales: 1) Problematización, 2) Análisis de información (forzando el uso de verbos de acción del nivel de Bloom: ${bloom}) y 3) Toma de decisiones o Acuerdos",
  "recursosDesarrollo": "Fuentes primarias o secundarias, mapas o lecturas especializadas utilizadas",
  "estrategiasCierre": "Describe las preguntas de metacognición histórica/social y la actividad de extensión",
  "recursosCierre": "Ficha de autoevaluación",
  "evaluacionSituacion": "Describe el contexto formativo donde se evaluará al estudiante",
  "evaluacionEvidencia": "Producto tangible o actuación final evaluada",
  "evaluacionInstrumento": "Detalla el instrumento ideal de tu catálogo justificándolo brevemente"
}

=== DATOS DE ENTRADA CURRICULARES ===
- Tema: "${tema}"
- Competencia Social: "${compData.nombre}"
- Capacidades: "${compData.capacidades.join(", ")}"
- Desempeño base del CNEB: "${desBase}"
- Enfoque transversal asignado: "${enfData.nombre}"
- Complejidad Cognitiva Requerida: Nivel ${bloom}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptFinal }] }] })
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            const mensajeGoogle = errorBody.error?.message || "Error desconocido en el servidor de Google.";
            throw new Error(`Google API (Status ${response.status}): ${mensajeGoogle}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content.parts[0].text) {
            throw new Error("La estructura de respuesta de la IA llegó vacía. Inténtalo de nuevo.");
        }

        let textoRespuesta = data.candidates[0].content.parts[0].text;
        textoRespuesta = textoRespuesta.replace(/^```json/i, "").replace(/```$/i, "").trim();
        
        const respuestaIA = JSON.parse(textoRespuesta);

        // INYECCIÓN DIRECTA POR CELDA EN LA UX SKELETON
        document.getElementById("doc-tema-display").innerText = "Tema de la Sesión: " + tema;
        document.getElementById("cell-competencia").innerText = compData.nombre;
        document.getElementById("cell-capacidades").innerHTML = compData.capacidades.join("<br>");
        document.getElementById("cell-desempeno-precisado").innerText = respuestaIA.desempenoPrecisado;
        document.getElementById("cell-enfoque").innerText = enfData.nombre;
        document.getElementById("cell-actitudes").innerText = respuestaIA.actitudes || enfData.valores_actitudes;

        document.getElementById("cell-estrategias-inicio").innerText = respuestaIA.estrategiasInicio;
        document.getElementById("cell-recursos-inicio").innerText = respuestaIA.recursosInicio;
        
        document.getElementById("cell-estrategias-desarrollo").innerText = respuestaIA.estrategiasDesarrollo;
        document.getElementById("cell-recursos-desarrollo").innerText = respuestaIA.recursosDesarrollo;
        
        document.getElementById("cell-estrategias-cierre").innerText = respuestaIA.estrategiasCierre;
        document.getElementById("cell-recursos-cierre").innerText = respuestaIA.recursosCierre;

        document.getElementById("cell-eval-competencia").innerText = compData.nombre;
        document.getElementById("cell-eval-desempeno").innerText = respuestaIA.desempenoPrecisado;
        document.getElementById("cell-eval-situacion").innerText = respuestaIA.evaluacionSituacion;
        document.getElementById("cell-eval-evidencia").innerText = respuestaIA.evaluacionEvidencia;
        document.getElementById("cell-eval-instrumento").innerText = respuestaIA.evaluacionInstrumento;

    } catch (error) {
        console.error(error);
        alert(`Aviso del Sistema:\n${error.message}`);
    } finally {
        document.getElementById("loading-overlay").classList.add("hidden");
        document.getElementById("loading-overlay").classList.remove("flex");
    }
}
