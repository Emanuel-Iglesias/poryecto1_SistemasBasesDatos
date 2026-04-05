// frontend/js/auth.js
const API = "http://localhost:3000/api";

function getToken() {
  return localStorage.getItem("token");
}

// Genera los headers con Authorization + Content-Type
function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + getToken()
  };
}

// Redirige al login si no hay sesión activa
function requireAuth() {
  if (!getToken()) window.location.href = "login.html";
}

// Cierra sesión
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "login.html";
}