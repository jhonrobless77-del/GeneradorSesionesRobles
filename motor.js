let dbPlanificadorCCSS = null;

// Configuración de los verbos de Bloom
const dbBloomLocal = {
    "Recordar": "Identificar, listar, nombrar, localizar, reconocer.",
    "Comprender": "Explicar, describir, clasificar, resumir, ilustrar.",
    "Aplicar": "Emplear, utilizar, calcular, resolver, trazar.",
    "Analizar": "Comparar, contrastar, diferenciar, analizar, debatir.",
    "Evaluar": "Justificar, defender, evaluar, criticar.",
    "Crear": "Diseñar, proponer, formular, elaborar, producir."
};

// --- EL CAMBIO CRÍTICO: DOMContentLoaded ---
// Esto asegura que el HTML esté 100% cargado antes de ejecutar cualquier lógica.
document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM cargado, iniciando carga de JSON...");
    
    await cargarArchivoJsonCurricular();
    
    // Vincular botones y selectores
    document.getElementById("btn-generar").addEventListener("click", ejecutarPlanificacionConIA);
    document.getElementById("ciclo-select").addEventListener("change", actualizarCascadaFormulario);
    document.getElementById("competencia-select").addEventListener("change", actualizarCascadaFormulario);
    document.getElementById("bloom-select").addEventListener("change", actualizarTextoVerbos);
    
    document.getElementById("btn-guardar").addEventListener("click", guardarKey);
    document.getElementById("btn-borrar").addEventListener("click", borrarKey);
    
    recuperarApiKeyLocal();
});

async function cargarArchivoJsonCurricular() {
    try {
        const respuesta = await fetch('./ccss_secundaria.json');
        if (!respuesta.ok) throw new Error("No se encontró el archivo ccss_secundaria.json");
        dbPlanificadorCCSS = await respuesta.json();
        poblarDesplegablesIniciales();
    } catch (e) {
        console.error("Error al cargar JSON:", e);
        alert("Aviso: Revisa que 'ccss_secundaria.json' esté en la misma carpeta que index.html.");
    }
}

function poblarDesplegablesIniciales() {
    if (!dbPlanificadorCCSS) return;

    // Llenar Competencias
    const selectComp = document.getElementById("competencia-select");
    selectComp.innerHTML = dbPlanificadorCCSS.competencias_completas_ccss
        .map(c => `<option value="${c.codigo}">${c.nombre}</option>`).join("");
    
    // Llenar Enfoques
    const selectEnf = document.getElementById("enfoque-select");
    selectEnf.innerHTML = dbPlanificadorCCSS.enfoques_transversales_oficiales
        .map((e, i) => `<option value="${i}">${e.nombre}</option>`).join("");
    
    actualizarCascadaFormulario();
}

function actualizarCascadaFormulario() {
    if (!dbPlanificadorCCSS) return;

    const codigoComp = document.getElementById("competencia-select").value;
    const ciclo = document.getElementById("ciclo-select").value;
    const compData = dbPlanificadorCCSS.competencias_completas_ccss.find(c => c.codigo === codigoComp);

    // Llenar Capacidades
    document.getElementById("capacidades-container").innerHTML = compData.capacidades
        .map(c => `<div class="text-[11px] text-slate-600 font-medium">• ${c}</div>`).join("");
    
    // Llenar Desempeños
    const selectDes = document.getElementById("desempeno-select");
    selectDes.innerHTML = compData.desempenos_oficiales[ciclo]
        .map((d, i) => `<option value="${i}">${d.substring(0, 60)}...</option>`).join("");
        
    actualizarTextoVerbos();
}

// ... (Aquí copias el resto de tu función ejecutarPlanificacionConIA de antes)
