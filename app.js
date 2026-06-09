// 1. Importación DIRECTA y robusta del SDK oficial (Sin depender de importmap)
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

let dbPlanificadorCCSS = null;

const dbBloomLocal = {
    "Recordar": "Identificar, listar, nombrar, localizar, reconocer.",
    "Comprender": "Explicar, describir, clasificar, resumir, ilustrar.",
    "Aplicar": "Emplear, utilizar, calcular, resolver, trazar.",
    "Analizar": "Comparar, contrastar, diferenciar, analizar, debatir.",
    "Evaluar": "Justificar, defender, evaluar, criticar.",
    "Crear": "Diseñar, proponer, formular, elaborar, producir."
};

// 2. INICIALIZACIÓN INMEDIATA (Como es un módulo, esto corre apenas la página está lista)
recuperarApiKeyLocal();
cargarArchivoJsonCurricular();

// 3. CONEXIÓN DE TODOS LOS BOTONES
document.getElementById("btn-generar").addEventListener("click", ejecutarPlanificacionConIA);
document.getElementById("ciclo-select").addEventListener("change", actualizarCascadaFormulario);
document.getElementById("competencia-select").addEventListener("change", actualizarCascadaFormulario);
document.getElementById("bloom-select").addEventListener("change", actualizarTextoVerbos);

document.getElementById("btn-guardar").addEventListener("click", guardarKey);
document.getElementById("btn-borrar").addEventListener("click", borrarKey);

document.getElementById("api-key-input").addEventListener("input", () => {
    const key = document.getElementById("api-key-input").value.trim();
    marcarEstadoKey(key.length > 0);
});

// 4. LECTURA DE BASE DE DATOS (JSON)
async function cargarArchivoJsonCurricular() {
    try {
        const respuesta = await fetch('ccss_secundaria.json');
        if (!respuesta.ok) throw new Error("No se encontró el archivo ccss_secundaria.json");
        dbPlanificadorCCSS = await respuesta.json();
        poblarDesplegablesIniciales();
    } catch (error) {
        console.error(error);
        alert("Aviso: No se pudo cargar el archivo ccss_secundaria.json. Revisa tu repositorio de GitHub.");
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

    const capContainer = document.getElementById("capacidades-container");
    capContainer.innerHTML = "";
    compData.capacidades.forEach(cap => {
        capContainer.innerHTML += `<div class="text-[11px] text-slate-600 font-medium">• ${cap}</div>`;
    });

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

// 5. CONTROL DE API KEY
function guardarKey() {
    const key = document.getElementById("api-key-input").value.trim();
    if (key) {
        localStorage.setItem("key_modular_ccss", key);
        marcarEstadoKey(true);
        alert("API Key conectada exitosamente.");
    } else {
        alert("El cuadro está vacío. Pega tu API Key primero.");
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

// 6. MOTOR ROBUSTO DE IA (SDK OFICIAL)
async function ejecutarPlanificacionConIA() {
    const apiKey = document.getElementById("api-key-input").value.trim();
    if (!apiKey) { 
        alert("Falta la API Key. Por favor pégala en el cuadro de la izquierda."); 
        document.getElementById("api-key-input").focus();
        return; 
    }

    localStorage.setItem("key_modular_ccss", apiKey);
    marcarEstadoKey(true);

    const tema = document.getElementById("tema-input").value.trim();
    if (!tema) { alert("Debes escribir un tema para la sesión."); return; }

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

    const promptFinal = `Eres un especialista pedagógico del MINEDU elaborando una sesión de Ciencias Sociales.
Basándote en los siguientes datos, genera el contenido para los cuadros de la sesión. 

=== DATOS CURRICULARES ===
Tema: "${tema}"
Competencia: "${compData.nombre}"
Desempeño base: "${desBase}"
Complejidad Cognitiva: Nivel ${bloom}

=== INSTRUCCIONES DE RESPUESTA JSON ===
Devuelve los datos estructurados exactamente con estas llaves:
{
  "desempenoPrecisado": "Desempeño oficial adaptado al tema",
  "estrategiasInicio": "Problematización, Propósito, Motivación y Saberes previos",
  "recursosInicio": "Materiales para el inicio",
  "estrategiasDesarrollo": "Procesos didácticos: 1) Problematización, 2) Análisis de información (usar verbos de nivel ${bloom}), 3) Toma de decisiones",
  "recursosDesarrollo": "Fuentes primarias/secundarias o mapas",
  "estrategiasCierre": "Metacognición y extensión",
  "recursosCierre": "Material de evaluación",
  "evaluacionSituacion": "Situación donde se evaluará al estudiante",
  "evaluacionEvidencia": "Producto tangible",
  "evaluacionInstrumento": "Instrumento técnico a utilizar"
}`;

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash-latest",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const result = await model.generateContent(promptFinal);
        const textoRespuesta = result.response.text();
        const respuestaIA = JSON.parse(textoRespuesta);

        document.getElementById("doc-tema-display").innerText = "Tema de la Sesión: " + tema;
        document.getElementById("cell-competencia").innerText = compData.nombre;
        document.getElementById("cell-capacidades").innerHTML = compData.capacidades.join("<br>");
        document.getElementById("cell-desempeno-precisado").innerText = respuestaIA.desempenoPrecisado;
        
        document.getElementById("cell-enfoque").innerText = enfData.nombre;
        let actitudesMapeadas = "";
        if (Array.isArray(enfData.valores_actitudes)) {
            actitudesMapeadas = enfData.valores_actitudes.map(v => `• ${v.valor}: ${v.actitud}`).join("\n");
        } else {
            actitudesMapeadas = enfData.valores_actitudes || "Actitudes asociadas al enfoque.";
        }
        document.getElementById("cell-actitudes").innerText = actitudesMapeadas;

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
        console.error("Detalle del error:", error);
        alert(`Error en el motor de IA: ${error.message}`);
    } finally {
        document.getElementById("loading-overlay").classList.add("hidden");
        document.getElementById("loading-overlay").classList.remove("flex");
    }
}
