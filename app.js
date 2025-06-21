// app.js
let chart;

// Elimino los botones flotantes antiguos si existen
const oldHelp = document.getElementById('openHelp');
const oldDownload = document.getElementById('downloadChart');
if (oldHelp && oldHelp.classList.contains('help-btn')) oldHelp.remove();
if (oldDownload && oldDownload.classList.contains('download-btn')) oldDownload.remove();

// Botón ayuda y descarga
const openHelp = document.getElementById('openHelp');
const helpModal = document.getElementById('helpModal');
const closeModal = document.getElementById('closeModal');
const downloadBtn = document.getElementById('downloadChart');

openHelp.onclick = () => helpModal.style.display = 'block';
closeModal.onclick = () => helpModal.style.display = 'none';
window.onclick = (e) => { if (e.target === helpModal) helpModal.style.display = 'none'; };

downloadBtn.onclick = () => {
    const chartEl = document.getElementById('chart');
    const url = chartEl.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = 'grafica_tangente.png';
    link.click();
};

// Ejemplos rápidos
Array.from(document.getElementsByClassName('ejemplo-btn')).forEach(btn => {
    btn.onclick = () => {
        document.getElementById('functionInput').value = btn.dataset.func;
        document.getElementById('pointInput').value = btn.dataset.a;
    };
});

// Mejorar validación visual
const functionInput = document.getElementById('functionInput');
const pointInput = document.getElementById('pointInput');
functionInput.addEventListener('input', () => functionInput.classList.remove('input-error'));
pointInput.addEventListener('input', () => pointInput.classList.remove('input-error'));

// Validación visual y lógica en tiempo real
functionInput.addEventListener('input', () => {
    const icon = document.getElementById('funcIcon');
    functionInput.classList.remove('input-error', 'valid');
    icon.className = 'input-icon';
    if (!functionInput.value.trim()) return;
    try {
        math.parse(functionInput.value.trim()).compile();
        functionInput.classList.add('valid');
        icon.classList.add('fa-solid', 'fa-circle-check');
    } catch {
        functionInput.classList.add('input-error');
        icon.classList.add('fa-solid', 'fa-circle-xmark');
    }
});
pointInput.addEventListener('input', () => {
    const icon = document.getElementById('pointIcon');
    pointInput.classList.remove('input-error', 'valid');
    icon.className = 'input-icon';
    if (!pointInput.value.trim()) return;
    if (!isNaN(pointInput.value) && pointInput.value.trim() !== '') {
        pointInput.classList.add('valid');
        icon.classList.add('fa-solid', 'fa-circle-check');
    } else {
        pointInput.classList.add('input-error');
        icon.classList.add('fa-solid', 'fa-circle-xmark');
    }
});

document.getElementById('tangentForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const funcInput = functionInput.value.trim();
    const pointVal = pointInput.value.trim();
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = '';
    functionInput.classList.remove('input-error');
    pointInput.classList.remove('input-error');

    // Validación básica
    if (!funcInput) {
        errorMsg.textContent = 'Por favor ingresa una función.';
        functionInput.classList.add('input-error');
        return;
    }
    if (pointVal === '' || isNaN(pointVal)) {
        errorMsg.textContent = 'Por favor ingresa un valor numérico para a.';
        pointInput.classList.add('input-error');
        return;
    }
    const a = parseFloat(pointVal);
    let f, df;
    try {
        f = math.parse(funcInput).compile();
        df = math.derivative(funcInput, 'x').compile();
    } catch (err) {
        errorMsg.textContent = 'Función inválida. Revisa la sintaxis.';
        return;
    }
    let fa, dfa;
    try {
        fa = f.evaluate({ x: a });
        dfa = df.evaluate({ x: a });
        if (!isFinite(fa) || !isFinite(dfa)) throw 'Valor no finito';
    } catch (err) {
        errorMsg.textContent = 'No se pudo evaluar la función o su derivada en x = ' + a;
        return;
    }
    graficar(funcInput, a, fa, dfa, f);
    mostrarAproxInfo(funcInput, a, fa, dfa);
});

// Al inicio, ocultar el botón de descarga de gráfica y la sección de datos
const downloadChartContainer = document.getElementById('downloadChartContainer');
if (downloadChartContainer) downloadChartContainer.style.display = 'none';
const aproxInfoContainer = document.getElementById('aproxInfoContainer');
if (aproxInfoContainer) aproxInfoContainer.style.display = 'none';

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
