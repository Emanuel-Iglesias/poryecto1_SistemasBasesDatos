// productos.js — authHeaders() viene de auth.js (cargado antes en el HTML)
const API = "http://localhost:3000/api/productos";

async function cargarProductos() {
  const res = await fetch(API, { headers: authHeaders() });
  const productos = await res.json();
  const tbody = document.getElementById("tabla-productos");

  if (!productos.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-3">No hay productos registrados</td></tr>`;
    return;
  }

  tbody.innerHTML = productos.map(p => `
    <tr>
      <td>${p.id_producto}</td>
      <td>${p.nombre_producto}</td>
      <td>${p.descripcion || "—"}</td>
      <td>Q ${parseFloat(p.precio).toFixed(2)}</td>
      <td>
        <span class="badge ${p.stock < 10 ? "bg-danger" : "bg-success"}">
          ${p.stock}
        </span>
      </td>
      <td>${new Date(p.fecha_ingreso).toLocaleString("es-GT")}</td>
      <td>
        <button onclick="editarProducto(${p.id_producto})" class="btn btn-sm btn-warning me-1">
          <i class="bi bi-pencil"></i>
        </button>
        <button onclick="eliminarProducto(${p.id_producto})" class="btn btn-sm btn-danger">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join("");
}

async function guardarProducto() {
  const id     = document.getElementById("id_producto").value;
  const nombre = document.getElementById("nombre_producto").value.trim();
  const precio = parseFloat(document.getElementById("precio").value);
  const stock  = parseInt(document.getElementById("stock").value);
  const desc   = document.getElementById("descripcion").value.trim();
  const msgDiv = document.getElementById("msg-producto");

  if (!nombre)                    return mostrarMensaje(msgDiv, "El nombre del producto es obligatorio.", "danger");
  if (isNaN(precio) || precio <= 0) return mostrarMensaje(msgDiv, "El precio debe ser un número positivo.", "danger");
  if (isNaN(stock)  || stock  < 0)  return mostrarMensaje(msgDiv, "El stock debe ser un número positivo.", "danger");

  const body = { nombre_producto: nombre, descripcion: desc, precio, stock };

  try {
    const res = await fetch(id ? `${API}/${id}` : API, {
      method:  id ? "PUT" : "POST",
      headers: authHeaders(),
      body:    JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) return mostrarMensaje(msgDiv, data.error, "danger");
    mostrarMensaje(msgDiv, data.mensaje, "success");
    limpiarFormulario();
    cargarProductos();
  } catch {
    mostrarMensaje(msgDiv, "Error al conectar con el servidor.", "danger");
  }
}

async function editarProducto(id) {
  const res = await fetch(`${API}/${id}`, { headers: authHeaders() });
  const p   = await res.json();

  document.getElementById("id_producto").value       = p.id_producto;
  document.getElementById("nombre_producto").value   = p.nombre_producto;
  document.getElementById("precio").value            = p.precio;
  document.getElementById("stock").value             = p.stock;
  document.getElementById("descripcion").value       = p.descripcion || "";
  document.getElementById("form-titulo").textContent = "Editar Producto";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function eliminarProducto(id) {
  if (!confirm("¿Seguro que deseas eliminar este producto? También se eliminarán sus distribuciones.")) return;
  try {
    const res  = await fetch(`${API}/${id}`, { method: "DELETE", headers: authHeaders() });
    const data = await res.json();
    alert(data.mensaje || data.error);
    cargarProductos();
  } catch {
    alert("Error al eliminar el producto.");
  }
}

function limpiarFormulario() {
  document.getElementById("id_producto").value       = "";
  document.getElementById("nombre_producto").value   = "";
  document.getElementById("precio").value            = "";
  document.getElementById("stock").value             = "";
  document.getElementById("descripcion").value       = "";
  document.getElementById("form-titulo").textContent = "Nuevo Producto";
  document.getElementById("msg-producto").innerHTML  = "";
}

function mostrarMensaje(div, texto, tipo) {
  div.innerHTML = `<div class="alert alert-${tipo} py-2 mb-0">${texto}</div>`;
}

cargarProductos();