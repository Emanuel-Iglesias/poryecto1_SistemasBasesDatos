// backend/routes/clientes.js
const express = require("express");
const router  = express.Router();
const mysql   = require("../config/dbMysql");
const verificarToken = require("../middleware/authMiddleware");

// GET /api/clientes — listar todos
router.get("/", verificarToken, async (req, res) => {
  try {
    const [rows] = await mysql.execute("SELECT id, datos_cliente FROM clientes");
    res.json(rows.map(r => ({ id: r.id, ...r.datos_cliente })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/clientes/:nit — buscar por NIT
router.get("/:nit", verificarToken, async (req, res) => {
  try {
    const [rows] = await mysql.execute(
      "SELECT datos_cliente FROM clientes WHERE JSON_EXTRACT(datos_cliente, '$.nit') = ?",
      [req.params.nit]
    );
    if (!rows.length) return res.status(404).json({ error: "Cliente no encontrado." });
    res.json(rows[0].datos_cliente);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clientes — crear cliente
router.post("/", verificarToken, async (req, res) => {
  const { nit, nombre, direccion, telefono, correo } = req.body;
  if (!nit || !nombre) return res.status(400).json({ error: "NIT y nombre son obligatorios." });
  try {
    // Verificar que el NIT no exista
    const [existe] = await mysql.execute(
      "SELECT id FROM clientes WHERE JSON_EXTRACT(datos_cliente, '$.nit') = ?", [nit]
    );
    if (existe.length) return res.status(409).json({ error: "Ya existe un cliente con ese NIT." });

    const datos = JSON.stringify({ nit, nombre, direccion: direccion || "", telefono: telefono || "", correo: correo || "" });
    await mysql.execute("INSERT INTO clientes (datos_cliente) VALUES (?)", [datos]);
    res.status(201).json({ mensaje: "Cliente registrado correctamente." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/clientes/:nit — editar cliente
router.put("/:nit", verificarToken, async (req, res) => {
  const { nombre, direccion, telefono, correo } = req.body;
  try {
    const [existe] = await mysql.execute(
      "SELECT id FROM clientes WHERE JSON_EXTRACT(datos_cliente, '$.nit') = ?", [req.params.nit]
    );
    if (!existe.length) return res.status(404).json({ error: "Cliente no encontrado." });

    const datos = JSON.stringify({ nit: req.params.nit, nombre, direccion: direccion || "", telefono: telefono || "", correo: correo || "" });
    await mysql.execute(
      "UPDATE clientes SET datos_cliente = ? WHERE JSON_EXTRACT(datos_cliente, '$.nit') = ?",
      [datos, req.params.nit]
    );
    res.json({ mensaje: "Cliente actualizado correctamente." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/clientes/:nit — eliminar cliente
router.delete("/:nit", verificarToken, async (req, res) => {
  try {
    await mysql.execute(
      "DELETE FROM clientes WHERE JSON_EXTRACT(datos_cliente, '$.nit') = ?", [req.params.nit]
    );
    res.json({ mensaje: "Cliente eliminado correctamente." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;