// backend/routes/auth.js
const express = require("express");
const router  = express.Router();
const bcrypt  = require("bcrypt");
const jwt     = require("jsonwebtoken");
const { sql, poolPromise } = require("../config/db");

const SALT_ROUNDS = 10;
const JWT_SECRET  = process.env.JWT_SECRET || "proyecto1_secret_key";

// ── POST /api/auth/registro ──────────────────────────────────────────────────
router.post("/registro", async (req, res) => {
  const { NombreUsuario, Contrasena, CorreoElectronico } = req.body;

  if (!NombreUsuario || !Contrasena || !CorreoElectronico)
    return res.status(400).json({ error: "Todos los campos son obligatorios." });

  if (Contrasena.length < 6)
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });

  try {
    const pool = await poolPromise;

    const existe = await pool.request()
      .input("NombreUsuario", sql.VarChar, NombreUsuario)
      .input("Correo",        sql.VarChar, CorreoElectronico)
      .query(`SELECT IdUsuario FROM tb_usuarios
              WHERE NombreUsuario = @NombreUsuario OR CorreoElectronico = @Correo`);

    if (existe.recordset.length > 0)
      return res.status(409).json({ error: "El usuario o correo ya está registrado." });

    const hash = await bcrypt.hash(Contrasena, SALT_ROUNDS);

    await pool.request()
      .input("NombreUsuario", sql.VarChar, NombreUsuario)
      .input("Contrasena",    sql.VarChar, hash)
      .input("Correo",        sql.VarChar, CorreoElectronico)
      .query(`INSERT INTO tb_usuarios (NombreUsuario, Contrasena, CorreoElectronico)
              VALUES (@NombreUsuario, @Contrasena, @Correo)`);

    res.status(201).json({ mensaje: "Usuario registrado exitosamente." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar usuario." });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { NombreUsuario, Contrasena } = req.body;

  if (!NombreUsuario || !Contrasena)
    return res.status(400).json({ error: "Usuario y contraseña son obligatorios." });

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("NombreUsuario", sql.VarChar, NombreUsuario)
      .query(`SELECT IdUsuario, NombreUsuario, Contrasena, CorreoElectronico
              FROM tb_usuarios WHERE NombreUsuario = @NombreUsuario`);

    if (result.recordset.length === 0)
      return res.status(401).json({ error: "Credenciales incorrectas." });

    const usuario  = result.recordset[0];
    const coincide = await bcrypt.compare(Contrasena, usuario.Contrasena);

    if (!coincide)
      return res.status(401).json({ error: "Credenciales incorrectas." });

    const token = jwt.sign(
      { IdUsuario: usuario.IdUsuario, NombreUsuario: usuario.NombreUsuario },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      mensaje: "Login exitoso.",
      token,
      usuario: {
        IdUsuario:         usuario.IdUsuario,
        NombreUsuario:     usuario.NombreUsuario,
        CorreoElectronico: usuario.CorreoElectronico
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al iniciar sesión." });
  }
});

module.exports = router;