// backend/routes/salidas.js
const express = require("express");
const router  = express.Router();
const { sql, poolPromise } = require("../config/db");
const verificarToken = require("../middleware/authMiddleware");

// ── GET /api/salidas — Listar todas las salidas ──────────────────────────────
router.get("/", verificarToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT s.IdSalida, s.IdProducto, p.nombre_producto,
             s.Cantidad, s.FechaSalida
      FROM tb_salida_productos s
      INNER JOIN tb_productos p ON s.IdProducto = p.id_producto
      ORDER BY s.FechaSalida DESC`);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/salidas — Registrar salida y descontar stock ───────────────────
router.post("/", verificarToken, async (req, res) => {
  const { IdProducto, Cantidad } = req.body;

  if (!IdProducto || !Cantidad || Cantidad <= 0)
    return res.status(400).json({ error: "IdProducto y Cantidad (> 0) son requeridos." });

  try {
    const pool = await poolPromise;

    // Verificar stock disponible
    const stockResult = await pool.request()
      .input("IdProducto", sql.Int, IdProducto)
      .query("SELECT stock, nombre_producto FROM tb_productos WHERE id_producto = @IdProducto");

    if (stockResult.recordset.length === 0)
      return res.status(404).json({ error: "Producto no encontrado." });

    const { stock, nombre_producto } = stockResult.recordset[0];

    if (stock < Cantidad)
      return res.status(400).json({
        error: `Stock insuficiente. Stock actual de "${nombre_producto}": ${stock} unidades.`
      });

    // Transacción: insertar salida + descontar stock
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      await new sql.Request(transaction)
        .input("IdProducto", sql.Int, IdProducto)
        .input("Cantidad",   sql.Int, Cantidad)
        .query("INSERT INTO tb_salida_productos (IdProducto, Cantidad) VALUES (@IdProducto, @Cantidad)");

      await new sql.Request(transaction)
        .input("IdProducto", sql.Int, IdProducto)
        .input("Cantidad",   sql.Int, Cantidad)
        .query("UPDATE tb_productos SET stock = stock - @Cantidad WHERE id_producto = @IdProducto");

      await transaction.commit();

      res.status(201).json({
        mensaje: `Salida registrada. Nuevo stock de "${nombre_producto}": ${stock - Cantidad} unidades.`
      });
    } catch (innerErr) {
      await transaction.rollback();
      throw innerErr;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/salidas/:id — Eliminar registro ──────────────────────────────
router.delete("/:id", verificarToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("IdSalida", sql.Int, req.params.id)
      .query("DELETE FROM tb_salida_productos WHERE IdSalida = @IdSalida");
    res.json({ mensaje: "Registro de salida eliminado." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;