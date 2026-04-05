const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../config/db");

// GET - Obtener todos los productos
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM tb_productos ORDER BY fecha_ingreso DESC");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Obtener un producto por ID
router.get("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("id", sql.Int, req.params.id)
      .query("SELECT * FROM tb_productos WHERE id_producto = @id");
    if (result.recordset.length === 0) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - Crear producto
router.post("/", async (req, res) => {
  const { nombre_producto, descripcion, precio, stock } = req.body;
  try {
    const pool = await poolPromise;

    // Validar nombre único
    const existe = await pool.request()
      .input("nombre", sql.VarChar, nombre_producto)
      .query("SELECT id_producto FROM tb_productos WHERE nombre_producto = @nombre");
    if (existe.recordset.length > 0) return res.status(400).json({ error: "El nombre del producto ya existe" });

    await pool.request()
      .input("nombre", sql.VarChar, nombre_producto)
      .input("descripcion", sql.Text, descripcion)
      .input("precio", sql.Decimal(10, 2), precio)
      .input("stock", sql.Int, stock)
      .query(`INSERT INTO tb_productos (nombre_producto, descripcion, precio, stock)
              VALUES (@nombre, @descripcion, @precio, @stock)`);

    res.status(201).json({ mensaje: "Producto creado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - Editar producto
router.put("/:id", async (req, res) => {
  const { nombre_producto, descripcion, precio, stock } = req.body;
  try {
    const pool = await poolPromise;

    // Validar nombre único (excluyendo el mismo producto)
    const existe = await pool.request()
      .input("nombre", sql.VarChar, nombre_producto)
      .input("id", sql.Int, req.params.id)
      .query("SELECT id_producto FROM tb_productos WHERE nombre_producto = @nombre AND id_producto <> @id");
    if (existe.recordset.length > 0) return res.status(400).json({ error: "Ya existe otro producto con ese nombre" });

    await pool.request()
      .input("id", sql.Int, req.params.id)
      .input("nombre", sql.VarChar, nombre_producto)
      .input("descripcion", sql.Text, descripcion)
      .input("precio", sql.Decimal(10, 2), precio)
      .input("stock", sql.Int, stock)
      .query(`UPDATE tb_productos
              SET nombre_producto = @nombre, descripcion = @descripcion,
                  precio = @precio, stock = @stock
              WHERE id_producto = @id`);

    res.json({ mensaje: "Producto actualizado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Eliminar producto
router.delete("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("id", sql.Int, req.params.id)
      .query("DELETE FROM tb_productos WHERE id_producto = @id");
    res.json({ mensaje: "Producto eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;