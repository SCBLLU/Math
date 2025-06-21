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

function graficar(funcInput, a, fa, dfa, f) {
    // Rango dinámico centrado en a
    const rango = 5;
    const xMin = a - rango;
    const xMax = a + rango;
    const puntos = 200;
    const xs = [];
    const ys = [];
    const ysTangent = [];
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
                    data: xs.map(x => (Math.abs(x - a) < 1e-3 ? fa : null)),
                    borderColor: '#e74c3c',
                    backgroundColor: '#e74c3c',
                    type: 'scatter',
                    pointRadius: 7,
                    showLine: false,
                    fill: false
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
}

function mostrarAproxInfo(funcInput, a, fa, dfa) {
    const infoDiv = document.getElementById('aproxInfo');
    const tangente = `y = ${dfa.toFixed(4)}(x - ${a}) + ${fa.toFixed(4)}`;
    const xEj = a + 0.1;
    let aprox, real;
    try {
        aprox = dfa * (xEj - a) + fa;
        real = math.parse(funcInput).compile().evaluate({ x: xEj });
    } catch {
        aprox = real = '—';
    }
    let errorAbs = (isFinite(aprox) && isFinite(real)) ? Math.abs(real - aprox) : '—';
    infoDiv.innerHTML = `
        <div class="bg-blue-50 rounded-xl p-6 shadow mt-4 w-full max-w-xl mx-auto">
            <h3 class="text-lg font-bold text-blue-700 mb-3 flex items-center gap-2"><i class='fa-solid fa-info-circle'></i> Datos de la Aproximación Lineal</h3>
            <ul class="space-y-2 text-gray-700">
                <li><b>f(a):</b> <span class="ml-2">${fa.toFixed(6)}</span></li>
                <li><b>f'(a):</b> <span class="ml-2">${dfa.toFixed(6)}</span></li>
                <li><b>Ecuación de la recta tangente:</b> <code class="bg-white px-1 rounded">${tangente}</code></li>
                <li><b>Ejemplo de aproximación en x = ${(xEj).toFixed(2)}:</b>
                    <span class="block mt-1">Tangente: <b>${aprox.toFixed(6)}</b> &nbsp;|&nbsp; Real: <b>${real.toFixed(6)}</b> &nbsp;|&nbsp; Error absoluto: <b>${errorAbs.toExponential ? errorAbs.toExponential(2) : errorAbs}</b></span>
                </li>
            </ul>
        </div>
    `;
}
