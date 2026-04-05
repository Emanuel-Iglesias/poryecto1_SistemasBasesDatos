// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "proyecto1_secret_key";

function verificarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token)
    return res.status(401).json({ error: "Acceso denegado. Token requerido." });

  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(403).json({ error: "Token inválido o expirado." });
  }
}

module.exports = verificarToken;