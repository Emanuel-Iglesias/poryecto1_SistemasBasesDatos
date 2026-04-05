const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../config/db");

// GET - Todos los proveedores
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM tb_proveedores ORDER BY nombre_proveedor");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - Crear proveedor
router.post("/", async (req, res) => {
  const { nombre_proveedor, telefono, correo_electronico, direccion } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("nombre", sql.VarChar, nombre_proveedor)
      .input("telefono", sql.VarChar, telefono)
      .input("correo", sql.VarChar, correo_electronico)
      .input("direccion", sql.VarChar, direccion)
      .query(`INSERT INTO tb_proveedores (nombre_proveedor, telefono, correo_electronico, direccion)
              VALUES (@nombre, @telefono, @correo, @direccion)`);
    res.status(201).json({ mensaje: "Proveedor creado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - Editar proveedor
router.put("/:id", async (req, res) => {
  const { nombre_proveedor, telefono, correo_electronico, direccion } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("id", sql.Int, req.params.id)
      .input("nombre", sql.VarChar, nombre_proveedor)
      .input("telefono", sql.VarChar, telefono)
      .input("correo", sql.VarChar, correo_electronico)
      .input("direccion", sql.VarChar, direccion)
      .query(`UPDATE tb_proveedores
              SET nombre_proveedor = @nombre, telefono = @telefono,
                  correo_electronico = @correo, direccion = @direccion
              WHERE id_proveedor = @id`);
    res.json({ mensaje: "Proveedor actualizado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Eliminar proveedor
router.delete("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("id", sql.Int, req.params.id)
      .query("DELETE FROM tb_proveedores WHERE id_proveedor = @id");
    res.json({ mensaje: "Proveedor eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Obtener un proveedor por ID
router.get("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("id", sql.Int, req.params.id)
      .query("SELECT * FROM tb_proveedores WHERE id_proveedor = @id");
    if (result.recordset.length === 0)
      return res.status(404).json({ error: "Proveedor no encontrado" });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;