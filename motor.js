// 1. Importación actualizada según la nueva guía de Google
import { GoogleGenAI } from "https://esm.run/@google/genai";

let dbPlanificadorCCSS = null;

const dbBloomLocal = {
    "Recordar": "Identificar, listar, nombrar, localizar, reconocer.",
    "Comprender": "Explicar, describir, clasificar, resumir, ilustrar.",
    "Aplicar": "Emplear, utilizar, calcular, resolver, trazar.",
    "Analizar": "Comparar, contrastar, diferenciar, analizar, debatir.",
    "Evaluar": "Justificar, defender, evaluar, criticar.",
    "Crear": "Diseñar, proponer, formular, elaborar, producir."
};

// 2. Inicialización
document.addEventListener("DOMContentLoaded", () => {
    recuperarApiKeyLocal();
    cargarArchivoJsonCurricular();
    
    document.getElementById("btn-generar").addEventListener("click", ejecutarPlanificacionConIA);
    document.getElementById("ciclo-select").addEventListener("change", actualizarCascadaFormulario);
    document.getElementById("competencia-select").addEventListener("change", actualizarCascadaFormulario);
    document.getElementById("bloom-select").addEventListener("change", actualizarTextoVerbos);
    
    document.getElementById("btn-guardar").addEventListener("click", guardarKey);
    document.getElementById("btn-borrar").addEventListener("click", borrarKey);
});

// 3. Lógica de carga (se mantiene igual, es robusta)
async function cargarArchivoJsonCurricular() {
    try {
        const respuesta = await fetch('./ccss_secundaria.json');
        if (!respuesta.ok) throw new Error("No se encontró el JSON");
        dbPlanificadorCCSS = await respuesta.json();
        poblarDesplegablesIniciales();
    } catch (e) { console.error(e); }
}

function poblarDesplegablesIniciales() {
    if (!dbPlanificadorCCSS) return;
    const selectComp = document.getElementById("competencia-select");
    selectComp.innerHTML = "";
    dbPlanificadorCCSS.competencias_completas_ccss.forEach(c => {
        selectComp.innerHTML += `<option value="${c.codigo}">${c.nombre}</option>`;
    });
    actualizarCascadaFormulario();
}

function actualizarCascadaFormulario() {
    const codigoComp = document.getElementById("competencia-select").value;
    const ciclo = document.getElementById("ciclo-select").value;
    const compData = dbPlanificadorCCSS.competencias_completas_ccss.find(c => c.codigo === codigoComp);
    
    const capContainer = document.getElementById("capacidades-container");
    capContainer.innerHTML = compData.capacidades.map(c => `<div class="text-[11px]">• ${c}</div>`).join("");
    
    const selectDes = document.getElementById("desempeno-select");
    selectDes.innerHTML = compData.desempenos_oficiales[ciclo].map((d, i) => `<option value="${i}">${d.substring(0, 50)}...</option>`).join("");
}

function actualizarTextoVerbos() {
    document.getElementById("verbos-sugeridos").innerText = "Verbos CC.SS: " + dbBloomLocal[document.getElementById("bloom-select").value];
}

// 4. MOTOR DE IA ACTUALIZADO A LA NUEVA GUÍA
async function ejecutarPlanificacionConIA() {
    const apiKey = document.getElementById("api-key-input").value.trim();
    if (!apiKey) { alert("Ingresa tu API Key."); return; }
    
    const tema = document.getElementById("tema-input").value.trim();
    if (!tema) { alert("Escribe un tema."); return; }

    document.getElementById("loading-overlay").classList.remove("hidden");
    document.getElementById("loading-overlay").classList.add("flex");

    const promptFinal = `Eres un especialista pedagógico. Diseña una sesión para el tema: "${tema}". 
    Responde en formato JSON estricto (sin markdown) con estas llaves: 
    desempenoPrecisado, estrategiasInicio, recursosInicio, estrategiasDesarrollo, recursosDesarrollo, estrategiasCierre, recursosCierre, evaluacionSituacion, evaluacionEvidencia, evaluacionInstrumento.`;

    try {
        // Inicialización siguiendo la nueva guía de Google
        const ai = new GoogleGenAI({ apiKey: apiKey });

        // Usamos el modelo que la guía actual sugiere (gemini-3.5-flash es el nuevo estándar)
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash", 
            contents: promptFinal,
        });

        const respuestaIA = JSON.parse(response.text);

        // Inyección en pantalla
        document.getElementById("cell-desempeno-precisado").innerText = respuestaIA.desempenoPrecisado;
        document.getElementById("cell-estrategias-inicio").innerText = respuestaIA.estrategiasInicio;
        document.getElementById("cell-estrategias-desarrollo").innerText = respuestaIA.estrategiasDesarrollo;
        document.getElementById("cell-estrategias-cierre").innerText = respuestaIA.estrategiasCierre;
        // ... (resto de tus inyecciones igual que antes)

    } catch (error) {
        console.error("Error:", error);
        alert("Error: " + error.message);
    } finally {
        document.getElementById("loading-overlay").classList.add("hidden");
        document.getElementById("loading-overlay").classList.remove("flex");
    }
}

function guardarKey() { localStorage.setItem("key_modular_ccss", document.getElementById("api-key-input").value); alert("Guardado"); }
function borrarKey() { localStorage.removeItem("key_modular_ccss"); location.reload(); }
function recuperarApiKeyLocal() { document.getElementById("api-key-input").value = localStorage.getItem("key_modular_ccss") || ""; }
