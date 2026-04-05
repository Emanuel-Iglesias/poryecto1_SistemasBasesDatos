// reportes.js — authHeaders() viene de auth.js (cargado antes en el HTML)
const API_REP = "http://localhost:3000/api/reportes";
let graficoInstancia = null;

async function consultarStockBajo() {
  const limite = document.getElementById("limite_stock").value || 10;
  const res    = await fetch(`${API_REP}/stock-bajo?limite=${limite}`, { headers: authHeaders() });
  const datos  = await res.json();
  const tbody  = document.getElementById("tabla-stock-bajo");

  tbody.innerHTML = datos.length === 0
    ? `<tr><td colspan="4" class="text-center text-muted">Sin resultados</td></tr>`
    : datos.map(p => `
        <tr>
          <td>${p.nombre_producto}</td>
          <td>Q ${parseFloat(p.precio).toFixed(2)}</td>
          <td><span class="badge bg-danger">${p.stock}</span></td>
          <td>${new Date(p.fecha_ingreso).toLocaleString("es-GT")}</td>
        </tr>`).join("");
}

async function consultarPorFecha() {
  const desde = document.getElementById("fecha_desde").value;
  const hasta = document.getElementById("fecha_hasta").value;

  if (!desde || !hasta) return alert("Selecciona ambas fechas.");

  const res   = await fetch(`${API_REP}/por-fecha?desde=${desde}&hasta=${hasta}`, { headers: authHeaders() });
  const datos = await res.json();
  const tbody = document.getElementById("tabla-por-fecha");

  tbody.innerHTML = datos.length === 0
    ? `<tr><td colspan="4" class="text-center text-muted">Sin resultados en ese rango</td></tr>`
    : datos.map(p => `
        <tr>
          <td>${p.nombre_producto}</td>
          <td>Q ${parseFloat(p.precio).toFixed(2)}</td>
          <td>${p.stock}</td>
          <td>${new Date(p.fecha_ingreso).toLocaleString("es-GT")}</td>
        </tr>`).join("");
}

// NUEVO: Salidas por rango de fechas (Módulo 8)
async function consultarSalidasFecha() {
  const desde = document.getElementById("sal_desde").value;
  const hasta = document.getElementById("sal_hasta").value;
  const tbody = document.getElementById("tabla-salidas-fecha");

  if (!desde || !hasta) return alert("Selecciona ambas fechas.");

  const res   = await fetch(`${API_REP}/salidas-por-fecha?desde=${desde}&hasta=${hasta}`, { headers: authHeaders() });
  const datos = await res.json();

  tbody.innerHTML = !Array.isArray(datos) || datos.length === 0
    ? `<tr><td colspan="4" class="text-center text-muted">Sin resultados en ese rango</td></tr>`
    : datos.map(s => `
        <tr>
          <td>${s.IdSalida}</td>
          <td>${s.nombre_producto}</td>
          <td><span class="badge bg-warning text-dark">${s.Cantidad}</span></td>
          <td>${new Date(s.FechaSalida).toLocaleString("es-GT")}</td>
        </tr>`).join("");
}

async function consultarJoin(tipo) {
  const res   = await fetch(`${API_REP}/${tipo}-join`, { headers: authHeaders() });
  const datos = await res.json();
  const tbody = document.getElementById("tabla-join");
  const thead = document.getElementById("thead-join");
  const desc  = document.getElementById("descripcion-join");

  const descripciones = {
    inner: "INNER JOIN — Solo productos que tienen proveedor asignado y viceversa.",
    left:  "LEFT JOIN — Todos los productos, tengan o no proveedor asignado.",
    right: "RIGHT JOIN — Todos los proveedores, tengan o no productos asignados."
  };
  desc.textContent = descripciones[tipo];

  if (datos.length === 0) {
    thead.innerHTML = "";
    tbody.innerHTML = `<tr><td class="text-center text-muted py-3">Sin resultados</td></tr>`;
    return;
  }

  // Encabezados dinámicos (igual que el original)
  thead.innerHTML = `<tr>${Object.keys(datos[0]).map(k =>
    `<th>${k.replace(/_/g, " ").toUpperCase()}</th>`).join("")}</tr>`;

  tbody.innerHTML = datos.map(row => `
    <tr>${Object.values(row).map(v =>
      `<td>${v !== null ? v : "—"}</td>`).join("")}
    </tr>`).join("");
}

async function cargarGrafico() {
  const res   = await fetch(`${API_REP}/grafico-proveedores`, { headers: authHeaders() });
  const datos = await res.json();

  if (datos.length === 0) return alert("No hay datos para el gráfico.");

  const labels  = datos.map(d => d.nombre_proveedor);
  const values  = datos.map(d => d.total_suministrado);
  const colores = labels.map((_, i) => `hsl(${(i * 60) % 360}, 70%, 55%)`);

  if (graficoInstancia) graficoInstancia.destroy();

  const ctx = document.getElementById("grafico-proveedores").getContext("2d");
  graficoInstancia = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Total Suministrado",
        data: values,
        backgroundColor: colores,
        borderRadius: 8,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Cantidad de Productos Suministrados por Proveedor",
          font: { size: 16 }
        }
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  });
}