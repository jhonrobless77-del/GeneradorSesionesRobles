let dbPlanificadorCCSS = null;

const dbBloomLocal = {
    "Recordar": "Identificar, listar, nombrar, localizar, reconocer.",
    "Comprender": "Explicar, describir, clasificar, resumir, ilustrar.",
    "Aplicar": "Emplear, utilizar, calcular, resolver, trazar.",
    "Analizar": "Comparar, contrastar, diferenciar, analizar, debatir.",
    "Evaluar": "Justificar, defender, evaluar, criticar.",
    "Crear": "Diseñar, proponer, formular, elaborar, producir."
};

// Carga inicial
document.addEventListener("DOMContentLoaded", () => {
    cargarArchivoJsonCurricular();
    document.getElementById("btn-generar").addEventListener("click", ejecutarPlanificacionConIA);
    document.getElementById("ciclo-select").addEventListener("change", actualizarCascadaFormulario);
    document.getElementById("competencia-select").addEventListener("change", actualizarCascadaFormulario);
    document.getElementById("bloom-select").addEventListener("change", actualizarTextoVerbos);
});

async function cargarArchivoJsonCurricular() {
    try {
        const respuesta = await fetch('./ccss_secundaria.json');
        dbPlanificadorCCSS = await respuesta.json();
        
        // Poblar selects
        const selectComp = document.getElementById("competencia-select");
        dbPlanificadorCCSS.competencias_completas_ccss.forEach(c => {
            selectComp.innerHTML += `<option value="${c.codigo}">${c.nombre}</option>`;
        });
        actualizarCascadaFormulario();
    } catch (e) { alert("Error al cargar JSON."); }
}

function actualizarCascadaFormulario() {
    if (!dbPlanificadorCCSS) return;
    const codigoComp = document.getElementById("competencia-select").value;
    const ciclo = document.getElementById("ciclo-select").value;
    const compData = dbPlanificadorCCSS.competencias_completas_ccss.find(c => c.codigo === codigoComp);

    // Capacidades
    document.getElementById("capacidades-container").innerHTML = compData.capacidades.map(c => `<div>• ${c}</div>`).join("");
    
    // Desempeños
    const selectDes = document.getElementById("desempeno-select");
    selectDes.innerHTML = compData.desempenos_oficiales[ciclo].map((d, i) => `<option value="${i}">${d.substring(0, 50)}...</option>`).join("");
}

function actualizarTextoVerbos() {
    document.getElementById("verbos-sugeridos").innerText = "Verbos: " + dbBloomLocal[document.getElementById("bloom-select").value];
}

async function ejecutarPlanificacionConIA() {
    const apiKey = document.getElementById("api-key-input").value.trim();
    if (!apiKey) { alert("Ingresa tu API Key"); return; }

    const tema = document.getElementById("tema-input").value.trim();
    if (!tema) { alert("Escribe un tema"); return; }

    document.getElementById("loading-overlay").classList.remove("hidden");

    const ciclo = document.getElementById("ciclo-select").value;
    const codigoComp = document.getElementById("competencia-select").value;
    const compData = dbPlanificadorCCSS.competencias_completas_ccss.find(c => c.codigo === codigoComp);
    const desBase = compData.desempenos_oficiales[ciclo][document.getElementById("desempeno-select").value];
    const bloom = document.getElementById("bloom-select").value;

    // PETICIÓN REST PURA (La forma más robusta)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const prompt = `Eres un pedagogo de CC.SS. Genera un JSON estricto con: desempenoPrecisado, estrategiasInicio, recursosInicio, estrategiasDesarrollo, recursosDesarrollo, estrategiasCierre, recursosCierre, evaluacionSituacion, evaluacionEvidencia, evaluacionInstrumento. Tema: ${tema}. Competencia: ${compData.nombre}. Desempeño: ${desBase}. Nivel Bloom: ${bloom}.`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const data = await response.json();
        const texto = data.candidates[0].content.parts[0].text;
        const res = JSON.parse(texto.replace(/```json/g, "").replace(/```/g, ""));

        // Inyección
        document.getElementById("cell-desempeno-precisado").innerText = res.desempenoPrecisado;
        document.getElementById("cell-estrategias-inicio").innerText = res.estrategiasInicio;
        document.getElementById("cell-estrategias-desarrollo").innerText = res.estrategiasDesarrollo;
        document.getElementById("cell-estrategias-cierre").innerText = res.estrategiasCierre;
        // ... (agrega aquí el resto de inyecciones tal como estaban)
        
    } catch (e) {
        alert("Error: " + e.message);
    } finally {
        document.getElementById("loading-overlay").classList.add("hidden");
    }
}
