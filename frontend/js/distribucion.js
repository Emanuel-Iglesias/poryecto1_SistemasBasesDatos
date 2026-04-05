const API_DIST = "http://localhost:3000/api/distribucion";
const API_PROD = "http://localhost:3000/api/productos";
const API_PROV = "http://localhost:3000/api/proveedores";

async function cargarSelectores() {
  const [resProd, resProv] = await Promise.all([fetch(API_PROD), fetch(API_PROV)]);
  const productos  = await resProd.json();
  const proveedores = await resProv.json();

  const selProd = document.getElementById("sel_producto");
  const selProv = document.getElementById("sel_proveedor");

  selProd.innerHTML = `<option value="">-- Selecciona un producto --</option>` +
    productos.map(p => `<option value="${p.id_producto}">${p.nombre_producto}</option>`).join("");

  selProv.innerHTML = `<option value="">-- Selecciona un proveedor --</option>` +
    proveedores.map(p => `<option value="${p.id_proveedor}">${p.nombre_proveedor}</option>`).join("");
}

async function cargarDistribucion() {
  const res   = await fetch(API_DIST);
  const datos = await res.json();
  const tbody = document.getElementById("tabla-distribucion");

  if (datos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">No hay distribuciones registradas</td></tr>`;
    return;
  }

  tbody.innerHTML = datos.map(d => `
    <tr>
      <td>${d.nombre_producto}</td>
      <td>${d.nombre_proveedor}</td>
      <td>${d.cantidad_suministrada}</td>
      <td>
        <button onclick="eliminarDistribucion(${d.id_producto}, ${d.id_proveedor})" class="btn btn-sm btn-danger">
          <i class="bi bi-trash"></i> Eliminar
        </button>
      </td>
    </tr>
  `).join("");
}

async function asignarDistribucion() {
  const id_producto  = document.getElementById("sel_producto").value;
  const id_proveedor = document.getElementById("sel_proveedor").value;
  const cantidad     = parseInt(document.getElementById("cantidad_suministrada").value);
  const msgDiv       = document.getElementById("msg-distribucion");

  if (!id_producto)            return mostrarMensaje(msgDiv, "Selecciona un producto.", "danger");
  if (!id_proveedor)           return mostrarMensaje(msgDiv, "Selecciona un proveedor.", "danger");
  if (!cantidad || cantidad < 1) return mostrarMensaje(msgDiv, "La cantidad debe ser mayor a 0.", "danger");

  try {
    const res  = await fetch(API_DIST, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_producto, id_proveedor, cantidad_suministrada: cantidad })
    });
    const data = await res.json();

    if (!res.ok) return mostrarMensaje(msgDiv, data.error, "danger");

    mostrarMensaje(msgDiv, data.mensaje, "success");
    document.getElementById("cantidad_suministrada").value = "";
    cargarDistribucion();
  } catch {
    mostrarMensaje(msgDiv, "Error al conectar con el servidor.", "danger");
  }
}

async function eliminarDistribucion(id_producto, id_proveedor) {
  if (!confirm("¿Eliminar esta distribución?")) return;

  try {
    const res  = await fetch(API_DIST, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_producto, id_proveedor })
    });
    const data = await res.json();
    alert(data.mensaje || data.error);
    cargarDistribucion();
  } catch {
    alert("Error al eliminar la distribución.");
  }
}

function mostrarMensaje(div, texto, tipo) {
  div.innerHTML = `<div class="alert alert-${tipo} py-2 mb-0">${texto}</div>`;
}

cargarSelectores();
cargarDistribucion();