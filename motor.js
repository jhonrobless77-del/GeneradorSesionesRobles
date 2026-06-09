let dbPlanificadorCCSS = null;

const dbBloomLocal = {
    "Recordar": "Identificar, listar, nombrar, localizar, reconocer.",
    "Comprender": "Explicar, describir, clasificar, resumir, ilustrar.",
    "Aplicar": "Emplear, utilizar, calcular, resolver, trazar.",
    "Analizar": "Comparar, contrastar, diferenciar, analizar, debatir.",
    "Evaluar": "Justificar, defender, evaluar, criticar.",
    "Crear": "Diseñar, proponer, formular, elaborar, producir."
};

// --- EL ENCENDIDO A PRUEBA DE FALLOS ---
// Usamos window.onload para asegurar que TODO el HTML esté dibujado antes de tocar nada
window.onload = async function() {
    console.log("Iniciando carga de sistema...");
    
    // 1. Cargar datos
    await cargarArchivoJsonCurricular();
    
    // 2. Vincular botones
    document.getElementById("btn-generar").onclick = ejecutarPlanificacionConIA;
    document.getElementById("btn-guardar").onclick = guardarKey;
    document.getElementById("btn-borrar").onclick = borrarKey;
    
    // 3. Vincular selectores
    document.getElementById("ciclo-select").onchange = actualizarCascadaFormulario;
    document.getElementById("competencia-select").onchange = actualizarCascadaFormulario;
    document.getElementById("bloom-select").onchange = actualizarTextoVerbos;
    
    // 4. Cargar estado previo
    recuperarApiKeyLocal();
};

async function cargarArchivoJsonCurricular() {
    try {
        const respuesta = await fetch('./ccss_secundaria.json');
        if (!respuesta.ok) throw new Error("JSON no encontrado");
        dbPlanificadorCCSS = await respuesta.json();
        
        // Poblar inmediatamente
        const selectComp = document.getElementById("competencia-select");
        selectComp.innerHTML = dbPlanificadorCCSS.competencias_completas_ccss
            .map(c => `<option value="${c.codigo}">${c.nombre}</option>`).join("");
        
        actualizarCascadaFormulario();
        console.log("Sistema listo.");
    } catch (e) { alert("Error cargando JSON: " + e.message); }
}

function actualizarCascadaFormulario() {
    const codigoComp = document.getElementById("competencia-select").value;
    const ciclo = document.getElementById("ciclo-select").value;
    const compData = dbPlanificadorCCSS.competencias_completas_ccss.find(c => c.codigo === codigoComp);

    // Capacidades
    document.getElementById("capacidades-container").innerHTML = compData.capacidades
        .map(c => `<div class="text-[11px]">• ${c}</div>`).join("");
    
    // Desempeños
    const selectDes = document.getElementById("desempeno-select");
    selectDes.innerHTML = compData.desempenos_oficiales[ciclo]
        .map((d, i) => `<option value="${i}">${d.substring(0, 50)}...</option>`).join("");
        
    actualizarTextoVerbos();
}

// RESTO DE FUNCIONES (EjecutarPlanificacion, etc) IGUAL QUE ANTES...
// ... (copia aquí el resto de la lógica de ejecutarPlanificacionConIA que ya teníamos)
