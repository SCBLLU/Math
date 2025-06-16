// main.js
// Lógica para calcular el límite numéricamente y graficar con Chart.js

function evaluarFuncion(funcion, x) {
    // Reemplaza 'x' por el valor y evalúa la función de forma segura
    try {
        // Permite funciones matemáticas comunes
        const f = funcion.replace(/sin\(/g, 'Math.sin(')
            .replace(/cos\(/g, 'Math.cos(')
            .replace(/tan\(/g, 'Math.tan(')
            .replace(/log\(/g, 'Math.log(')
            .replace(/exp\(/g, 'Math.exp(')
            .replace(/sqrt\(/g, 'Math.sqrt(')
            .replace(/pi/g, 'Math.PI')
            .replace(/e/g, 'Math.E');
        return eval(f.replace(/x/g, `(${x})`));
    } catch (e) {
        return NaN;
    }
}

function aproximarLimite(funcion, x0) {
    // Calcula el límite numéricamente por ambos lados
    const h = 1e-4;
    const valoresIzq = [], valoresDer = [];
    for (let i = 5; i >= 1; i--) {
        let xi = x0 - h * i;
        valoresIzq.push(evaluarFuncion(funcion, xi));
    }
    for (let i = 1; i <= 5; i++) {
        let xi = x0 + h * i;
        valoresDer.push(evaluarFuncion(funcion, xi));
    }
    // Promedio de los valores cercanos
    const promedio = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
    return {
        izq: promedio(valoresIzq),
        der: promedio(valoresDer),
        aprox: (promedio(valoresIzq) + promedio(valoresDer)) / 2,
        valoresIzq,
        valoresDer
    };
}

document.getElementById('limitForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const funcion = document.getElementById('funcion').value;
    const x0 = parseFloat(document.getElementById('valor').value);
    const resultado = aproximarLimite(funcion, x0);
    document.getElementById('resultado').innerHTML =
        `Límite por la izquierda: <b>${resultado.izq.toFixed(6)}</b><br>` +
        `Límite por la derecha: <b>${resultado.der.toFixed(6)}</b><br>` +
        `Aproximación del límite: <b>${resultado.aprox.toFixed(6)}</b>`;
    graficarFuncion(funcion, x0);
    mostrarTabla(funcion, x0);
});

function graficarFuncion(funcion, x0) {
    const ctx = document.getElementById('grafica').getContext('2d');
    const xs = [], ys = [];
    for (let i = -20; i <= 20; i++) {
        let x = x0 + i * 0.01;
        xs.push(x);
        ys.push(evaluarFuncion(funcion, x));
    }
    if (window.miGrafica) window.miGrafica.destroy();
    window.miGrafica = new Chart(ctx, {
        type: 'line',
        data: {
            labels: xs,
            datasets: [{
                label: 'f(x)',
                data: ys,
                borderColor: '#007bff',
                fill: false
            }]
        },
        options: {
            responsive: false,
            scales: {
                x: { title: { display: true, text: 'x' } },
                y: { title: { display: true, text: 'f(x)' } }
            }
        }
    });
}

function mostrarTabla(funcion, x0) {
    let html = '<table><tr><th>x</th><th>f(x)</th></tr>';
    for (let i = -5; i <= 5; i++) {
        if (i === 0) continue;
        let x = x0 + i * 0.001;
        let y = evaluarFuncion(funcion, x);
        html += `<tr><td>${x.toFixed(6)}</td><td>${isNaN(y) ? 'Indefinido' : y.toFixed(6)}</td></tr>`;
    }
    html += '</table>';
    document.getElementById('tablaValores').innerHTML = html;
}

// Función para imprimir resultados y tabla
function imprimirResultados() {
    const container = document.querySelector('.container');
    const printWindow = window.open('', '', 'width=900,height=700');
    printWindow.document.write(`
        <html>
        <head>
            <title>Impresión de resultados</title>
            <style>
                body { background: #fff; font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; }
                .print-header { text-align: center; font-size: 2em; color: #6366f1; margin: 24px 0 18px 0; font-weight: 700; }
                .print-section { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(99,102,241,0.08); padding: 24px 32px; }
                #resultado { margin: 18px 0 10px 0; font-weight: 600; color: #6366f1; text-align: center; font-size: 1.08em; }
                table { width: 100%; border-collapse: collapse; border-radius: 6px; overflow: hidden; font-size: 1em; margin-top: 18px; }
                th { background: #6366f1; color: #fff; font-weight: 600; padding: 7px 0; }
                td { background: #fff; color: #22223b; padding: 6px 0; }
                tr:nth-child(even) td { background: #f1f5f9; }
                canvas { display: block; margin: 0 auto 18px auto; background: #f8fafc; border-radius: 8px; box-shadow: 0 1px 4px rgba(99,102,241,0.07); }
                .acciones, form, .btn-principal { display: none !important; }
            </style>
        </head>
        <body>
            <div class="print-header">Calculadora de Límites</div>
            <div class="print-section">
                ${container.querySelector('#resultado').outerHTML}
                <div style="text-align:center; margin:18px 0;">
                    <img src="${document.getElementById('grafica').toDataURL('image/png')}" style="max-width:100%; border-radius:8px; box-shadow:0 1px 4px rgba(99,102,241,0.07);"/>
                </div>
                ${container.querySelector('#tablaValores').outerHTML}
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 400);
}

// Exportar tabla a CSV
function exportarTabla() {
    const filas = document.querySelectorAll('#tablaValores table tr');
    let csv = '';
    filas.forEach(fila => {
        let cols = Array.from(fila.querySelectorAll('th,td')).map(td => '"' + td.innerText + '"');
        csv += cols.join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tabla_limite.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// Descargar gráfica como imagen
function descargarGrafica() {
    const canvas = document.getElementById('grafica');
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grafica_limite.png';
    a.click();
}

document.getElementById('btnImprimir').addEventListener('click', imprimirResultados);
document.getElementById('btnExportar').addEventListener('click', exportarTabla);
document.getElementById('btnDescargarGrafica').addEventListener('click', descargarGrafica);
