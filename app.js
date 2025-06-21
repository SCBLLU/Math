// app.js
// Variable global para la gráfica
let chart;

// Elimino los botones flotantes antiguos si existen (limpieza por si hay duplicados)
const oldHelp = document.getElementById('openHelp');
const oldDownload = document.getElementById('downloadChart');
if (oldHelp && oldHelp.classList.contains('help-btn')) oldHelp.remove();
if (oldDownload && oldDownload.classList.contains('download-btn')) oldDownload.remove();

// Referencias a botones de ayuda y descarga
const openHelp = document.getElementById('openHelp');
const helpModal = document.getElementById('helpModal');
const closeModal = document.getElementById('closeModal');
const downloadBtn = document.getElementById('downloadChart');

// Mostrar modal de ayuda
openHelp.onclick = () => helpModal.style.display = 'block';
// Cerrar modal de ayuda
closeModal.onclick = () => helpModal.style.display = 'none';
// Cerrar modal si se hace clic fuera del contenido
window.onclick = (e) => { if (e.target === helpModal) helpModal.style.display = 'none'; };

// Descargar la gráfica como imagen PNG
downloadBtn.onclick = () => {
    const chartEl = document.getElementById('chart');
    const url = chartEl.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = 'grafica_tangente.png';
    link.click();
};

// Botones de ejemplos rápidos: rellenan los campos con ejemplos
Array.from(document.getElementsByClassName('ejemplo-btn')).forEach(btn => {
    btn.onclick = () => {
        document.getElementById('functionInput').value = btn.dataset.func;
        document.getElementById('pointInput').value = btn.dataset.a;
    };
});

// Referencias a inputs y botones principales
const functionInput = document.getElementById('functionInput');
const pointInput = document.getElementById('pointInput');
const funcIcon = document.getElementById('funcIcon');
const pointIcon = document.getElementById('pointIcon');
const clearBtn = document.getElementById('clearBtn');
const goToResultsBtn = document.getElementById('goToResultsBtn');

// Función para validar la función matemática ingresada
function validarFuncionInput(valor) {
    if (!valor.trim()) return { valido: false, mensaje: '' };
    // Solo permite caracteres válidos
    if (/[^0-9xX+\-*/^().,\sA-Za-z]/.test(valor)) {
        return { valido: false, mensaje: 'La función contiene caracteres inválidos.' };
    }
    try {
        const parsed = math.parse(valor);
        const symbols = [];
        parsed.traverse(function (node) {
            if (node.isSymbolNode) symbols.push(node.name);
        });
        // Solo permite símbolos y funciones conocidas
        const allowed = ['x', ...Object.keys(math).filter(k => typeof math[k] === 'function' || typeof math[k] === 'number')];
        const notAllowed = symbols.filter(name => !allowed.includes(name));
        if (notAllowed.length > 0) return { valido: false, mensaje: 'Símbolo no permitido: ' + notAllowed.join(', ') };
        parsed.compile();
        return { valido: true, mensaje: '' };
    } catch (err) {
        return { valido: false, mensaje: 'Sintaxis inválida.' };
    }
}

// Validación visual en tiempo real para el input de función
functionInput.addEventListener('input', () => {
    functionInput.classList.remove('input-error', 'valid');
    funcIcon.className = 'input-icon';
    const val = functionInput.value.trim();
    const validacion = validarFuncionInput(val);
    if (!val) return;
    if (validacion.valido) {
        functionInput.classList.add('valid');
        funcIcon.classList.add('fa-solid', 'fa-circle-check');
    } else {
        functionInput.classList.add('input-error');
        funcIcon.classList.add('fa-solid', 'fa-circle-xmark');
    }
});
// Validación visual en tiempo real para el input del punto
pointInput.addEventListener('input', () => {
    pointInput.classList.remove('input-error', 'valid');
    pointIcon.className = 'input-icon';
    if (!pointInput.value.trim()) return;
    if (!isNaN(pointInput.value) && pointInput.value.trim() !== '' && isFinite(pointInput.value)) {
        pointInput.classList.add('valid');
        pointIcon.classList.add('fa-solid', 'fa-circle-check');
    } else {
        pointInput.classList.add('input-error');
        pointIcon.classList.add('fa-solid', 'fa-circle-xmark');
    }
});

// Botón para limpiar los campos y la gráfica
clearBtn.onclick = () => {
    functionInput.value = '';
    pointInput.value = '';
    document.getElementById('errorMsg').textContent = '';
    functionInput.classList.remove('input-error', 'valid');
    pointInput.classList.remove('input-error', 'valid');
    funcIcon.className = 'input-icon';
    pointIcon.className = 'input-icon';
    if (chart) chart.destroy();
    if (downloadChartContainer) downloadChartContainer.style.display = 'none';
    if (aproxInfoContainer) aproxInfoContainer.style.display = 'none';
    goToResultsBtn.style.display = 'none';
};

// Botón flotante para ir a la sección de resultados
goToResultsBtn.onclick = () => {
    const aproxInfo = document.getElementById('aproxInfoContainer');
    if (aproxInfo && aproxInfo.style.display !== 'none') {
        aproxInfo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        const chartSection = document.getElementById('chart');
        if (chartSection) chartSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
};

// Validación visual y lógica en tiempo real (duplicada para asegurar consistencia)
functionInput.addEventListener('input', () => {
    const icon = document.getElementById('funcIcon');
    functionInput.classList.remove('input-error', 'valid');
    icon.className = 'input-icon';
    const val = functionInput.value.trim();
    const validacion = validarFuncionInput(val);
    if (!val) return;
    if (validacion.valido) {
        functionInput.classList.add('valid');
        icon.classList.add('fa-solid', 'fa-circle-check');
    } else {
        functionInput.classList.add('input-error');
        icon.classList.add('fa-solid', 'fa-circle-xmark');
    }
});
pointInput.addEventListener('input', () => {
    const icon = document.getElementById('pointIcon');
    pointInput.classList.remove('input-error', 'valid');
    icon.className = 'input-icon';
    if (!pointInput.value.trim()) return;
    if (!isNaN(pointInput.value) && pointInput.value.trim() !== '' && isFinite(pointInput.value)) {
        pointInput.classList.add('valid');
        icon.classList.add('fa-solid', 'fa-circle-check');
    } else {
        pointInput.classList.add('input-error');
        icon.classList.add('fa-solid', 'fa-circle-xmark');
    }
});

// Evento principal: al enviar el formulario, valida y grafica
// Calcula la derivada, evalúa en el punto y muestra resultados
// Si hay error, muestra mensaje
// Si todo está bien, grafica y muestra info

document.getElementById('tangentForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const funcInput = functionInput.value.trim();
    const pointVal = pointInput.value.trim();
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = '';
    functionInput.classList.remove('input-error');
    pointInput.classList.remove('input-error');
    funcIcon.className = 'input-icon';
    pointIcon.className = 'input-icon';

    // Validación unificada
    const validacion = validarFuncionInput(funcInput);
    if (!funcInput) {
        errorMsg.textContent = 'Por favor ingresa una función.';
        functionInput.classList.add('input-error');
        funcIcon.classList.add('fa-solid', 'fa-circle-xmark');
        return;
    }
    if (!validacion.valido) {
        errorMsg.textContent = validacion.mensaje;
        functionInput.classList.add('input-error');
        funcIcon.classList.add('fa-solid', 'fa-circle-xmark');
        return;
    }
    if (pointVal === '' || isNaN(pointVal) || !isFinite(pointVal)) {
        errorMsg.textContent = 'Por favor ingresa un valor numérico válido para a.';
        pointInput.classList.add('input-error');
        pointIcon.classList.add('fa-solid', 'fa-circle-xmark');
        return;
    }
    const a = parseFloat(pointVal);
    if (Math.abs(a) > 1e6) {
        errorMsg.textContent = 'El valor de a es demasiado grande.';
        pointInput.classList.add('input-error');
        pointIcon.classList.add('fa-solid', 'fa-circle-xmark');
        return;
    }
    let f, df;
    try {
        f = math.parse(funcInput).compile();
        df = math.derivative(funcInput, 'x').compile();
    } catch (err) {
        errorMsg.textContent = 'Función inválida. Revisa la sintaxis.';
        functionInput.classList.add('input-error');
        funcIcon.classList.add('fa-solid', 'fa-circle-xmark');
        return;
    }
    let fa, dfa;
    try {
        fa = f.evaluate({ x: a });
        dfa = df.evaluate({ x: a });
        if (!isFinite(fa) || !isFinite(dfa)) throw 'Valor no finito';
    } catch (err) {
        errorMsg.textContent = 'No se pudo evaluar la función o su derivada en x = ' + a;
        pointInput.classList.add('input-error');
        pointIcon.classList.add('fa-solid', 'fa-circle-xmark');
        return;
    }
    graficar(funcInput, a, fa, dfa, f);
    mostrarAproxInfo(funcInput, a, fa, dfa);
    goToResultsBtn.style.display = 'flex';
});

// Al inicio, ocultar el botón de descarga de gráfica y la sección de datos
const downloadChartContainer = document.getElementById('downloadChartContainer');
if (downloadChartContainer) downloadChartContainer.style.display = 'none';
const aproxInfoContainer = document.getElementById('aproxInfoContainer');
if (aproxInfoContainer) aproxInfoContainer.style.display = 'none';

// Función para graficar la función y la tangente usando Chart.js
function graficar(funcInput, a, fa, dfa, f) {
    // Rango dinámico centrado en a
    const rango = 5;
    const xMin = a - rango;
    const xMax = a + rango;
    const puntos = 100;
    const xs = [];
    const ys = [];
    const ysTangent = [];
    const tangencyPoints = [];
    for (let i = 0; i <= puntos; i++) {
        const x = xMin + (xMax - xMin) * i / puntos;
        xs.push(Number(x.toFixed(4))); // Redondeo para evitar decimales largos
        let yVal;
        try {
            yVal = f.evaluate({ x });
            if (!isFinite(yVal) || Math.abs(yVal) > 1e4) yVal = null; // Evita saltos por asíntotas
        } catch {
            yVal = null;
        }
        ys.push(yVal);
        ysTangent.push(dfa * (x - a) + fa);
        // Solo un punto de tangencia, para mayor claridad
        tangencyPoints.push(Math.abs(x - a) < 1e-3 ? fa : null);
    }
    if (chart) chart.destroy();
    // Restablece el tamaño del canvas para que Chart.js lo controle
    const chartEl = document.getElementById('chart');
    chartEl.width = chartEl.parentElement.offsetWidth;
    chartEl.height = chartEl.parentElement.offsetHeight;
    const ctx = chartEl.getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: xs,
            datasets: [
                {
                    label: 'f(x)',
                    data: ys,
                    borderColor: '#2980b9',
                    fill: false,
                    pointRadius: 0,
                    borderWidth: 2,
                    spanGaps: true
                },
                {
                    label: 'Recta Tangente',
                    data: ysTangent,
                    borderColor: '#e67e22',
                    borderDash: [8, 6],
                    fill: false,
                    pointRadius: 0,
                    borderWidth: 2,
                    spanGaps: true
                },
                {
                    label: 'Punto de tangencia',
                    data: tangencyPoints,
                    borderColor: '#111827',
                    backgroundColor: '#f43f5e', // rosa fuerte
                    type: 'scatter',
                    pointRadius: 10,
                    pointHoverRadius: 14,
                    pointStyle: 'circle',
                    showLine: false,
                    fill: false,
                    borderWidth: 3,
                    hoverBorderColor: '#f59e42',
                    hoverBackgroundColor: '#f59e42',
                    spanGaps: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            if (context.dataset.label === 'Punto de tangencia') {
                                return `Punto de tangencia: x=${a}, y=${fa.toFixed(4)}`;
                            }
                            return `x=${context.label}, y=${context.parsed.y?.toFixed(4)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'x' },
                    min: xMin,
                    max: xMax,
                    ticks: {
                        callback: function (value, index, values) {
                            // Solo muestra algunos ticks para evitar saturación
                            return index % 20 === 0 ? this.getLabelForValue(value) : '';
                        },
                        maxRotation: 0,
                        minRotation: 0,
                        autoSkip: false
                    },
                    grid: { color: '#e0e6ed' }
                },
                y: {
                    title: { display: true, text: 'y' },
                    grid: { color: '#e0e6ed' }
                }
            }
        }
    });
    // Mostrar el botón de descarga de gráfica
    const downloadChartContainer = document.getElementById('downloadChartContainer');
    if (downloadChartContainer) downloadChartContainer.style.display = 'block';
}

// Muestra la información de la aproximación lineal y permite descargar los datos
function mostrarAproxInfo(funcInput, a, fa, dfa) {
    // Mostrar la sección de datos
    const aproxInfoContainer = document.getElementById('aproxInfoContainer');
    if (aproxInfoContainer) aproxInfoContainer.style.display = 'block';
    // Llenar los valores en los spans/codes del HTML
    document.getElementById('faValue').textContent = fa.toFixed(6);
    document.getElementById('dfaValue').textContent = dfa.toFixed(6);
    const tangente = `y = ${dfa.toFixed(4)}(x - ${a}) + ${fa.toFixed(4)}`;
    document.getElementById('tangenteValue').textContent = tangente;
    const xEj = a + 0.1;
    let aprox, real;
    try {
        aprox = dfa * (xEj - a) + fa;
        real = math.parse(funcInput).compile().evaluate({ x: xEj });
    } catch {
        aprox = real = '—';
    }
    document.getElementById('xEjValue').textContent = xEj.toFixed(2);
    document.getElementById('aproxValue').textContent = isFinite(aprox) ? aprox.toFixed(6) : '—';
    document.getElementById('realValue').textContent = isFinite(real) ? real.toFixed(6) : '—';
    // Mostrar el botón de descarga de datos
    const btn = document.getElementById('downloadDataBtn');
    if (btn) {
        btn.style.display = 'inline-flex';
        btn.onclick = () => {
            const contenido =
                `Aproximación Lineal\n\nFunción: ${funcInput}\nPunto a evaluar (a): ${a}\nf(a): ${fa.toFixed(6)}\nf'(a): ${dfa.toFixed(6)}\nEcuación de la recta tangente: ${tangente}\n\nAproximación en x = ${(xEj).toFixed(2)}\nTangente: ${isFinite(aprox) ? aprox.toFixed(6) : '—'}\nReal: ${isFinite(real) ? real.toFixed(6) : '—'}`;
            const blob = new Blob([contenido], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'datos_aproximacion.txt';
            link.click();
        };
    }
}
