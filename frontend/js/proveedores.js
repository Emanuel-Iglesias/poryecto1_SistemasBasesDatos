// proveedores.js — authHeaders() viene de auth.js (cargado antes en el HTML)
const API = "http://localhost:3000/api/proveedores";

async function cargarProveedores() {
  const res         = await fetch(API, { headers: authHeaders() });
  const proveedores = await res.json();
  const tbody       = document.getElementById("tabla-proveedores");

  if (!proveedores.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">No hay proveedores registrados</td></tr>`;
    return;
  }

  tbody.innerHTML = proveedores.map(p => `
    <tr>
      <td>${p.id_proveedor}</td>
      <td>${p.nombre_proveedor}</td>
      <td>${p.telefono || "—"}</td>
      <td>${p.correo_electronico || "—"}</td>
      <td>${p.direccion || "—"}</td>
      <td>
        <button onclick="editarProveedor(${p.id_proveedor})" class="btn btn-sm btn-warning me-1">
          <i class="bi bi-pencil"></i>
        </button>
        <button onclick="eliminarProveedor(${p.id_proveedor})" class="btn btn-sm btn-danger">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join("");
}

async function guardarProveedor() {
  const id     = document.getElementById("id_proveedor").value;
  const nombre = document.getElementById("nombre_proveedor").value.trim();
  const tel    = document.getElementById("telefono").value.trim();
  const correo = document.getElementById("correo_electronico").value.trim();
  const dir    = document.getElementById("direccion").value.trim();
  const msgDiv = document.getElementById("msg-proveedor");

  if (!nombre) return mostrarMensaje(msgDiv, "El nombre del proveedor es obligatorio.", "danger");

  const body = { nombre_proveedor: nombre, telefono: tel, correo_electronico: correo, direccion: dir };

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
    cargarProveedores();
  } catch {
    mostrarMensaje(msgDiv, "Error al conectar con el servidor.", "danger");
  }
}

async function editarProveedor(id) {
  const res = await fetch(`${API}/${id}`, { headers: authHeaders() });
  const p   = await res.json();

  document.getElementById("id_proveedor").value       = p.id_proveedor;
  document.getElementById("nombre_proveedor").value   = p.nombre_proveedor;
  document.getElementById("telefono").value           = p.telefono || "";
  document.getElementById("correo_electronico").value = p.correo_electronico || "";
  document.getElementById("direccion").value          = p.direccion || "";
  document.getElementById("form-titulo").textContent  = "Editar Proveedor";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function eliminarProveedor(id) {
  if (!confirm("¿Seguro que deseas eliminar este proveedor? También se eliminarán sus distribuciones.")) return;
  try {
    const res  = await fetch(`${API}/${id}`, { method: "DELETE", headers: authHeaders() });
    const data = await res.json();
    alert(data.mensaje || data.error);
    cargarProveedores();
  } catch {
    alert("Error al eliminar el proveedor.");
  }
}

function limpiarFormulario() {
  document.getElementById("id_proveedor").value       = "";
  document.getElementById("nombre_proveedor").value   = "";
  document.getElementById("telefono").value           = "";
  document.getElementById("correo_electronico").value = "";
  document.getElementById("direccion").value          = "";
  document.getElementById("form-titulo").textContent  = "Nuevo Proveedor";
  document.getElementById("msg-proveedor").innerHTML  = "";
}

function mostrarMensaje(div, texto, tipo) {
  div.innerHTML = `<div class="alert alert-${tipo} py-2 mb-0">${texto}</div>`;
}

cargarProveedores();