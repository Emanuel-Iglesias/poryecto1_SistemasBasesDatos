const express = require("express");
const router  = require("express").Router();
const { sql, poolPromise } = require("../config/db");
const verificarToken = require("../middleware/authMiddleware");

// GET — listar todas las distribuciones
router.get("/", verificarToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        pp.id_producto, pp.id_proveedor,
        p.nombre_producto, pv.nombre_proveedor,
        pp.cantidad_suministrada
      FROM tb_producto_proveedor pp
      INNER JOIN tb_productos   p  ON pp.id_producto  = p.id_producto
      INNER JOIN tb_proveedores pv ON pp.id_proveedor = pv.id_proveedor
      ORDER BY pv.nombre_proveedor
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("GET /distribucion error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST — asignar distribución y AUMENTAR stock
router.post("/", verificarToken, async (req, res) => {
  const { id_producto, id_proveedor, cantidad_suministrada } = req.body;

  if (!id_producto || !id_proveedor || !cantidad_suministrada) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }

  const idP   = parseInt(id_producto);
  const idPv  = parseInt(id_proveedor);
  const cant  = parseInt(cantidad_suministrada);

  try {
    const pool = await poolPromise;

    // Verificar si ya existe la relación producto-proveedor
    const existe = await pool.request()
      .input("idp",  sql.Int, idP)
      .input("idpv", sql.Int, idPv)
      .query("SELECT cantidad_suministrada FROM tb_producto_proveedor WHERE id_producto = @idp AND id_proveedor = @idpv");

    if (existe.recordset.length > 0) {
      // Ya existe → sumar cantidad en distribución
      await pool.request()
        .input("idp",  sql.Int, idP)
        .input("idpv", sql.Int, idPv)
        .input("cant", sql.Int, cant)
        .query(`UPDATE tb_producto_proveedor 
                SET cantidad_suministrada = cantidad_suministrada + @cant
                WHERE id_producto = @idp AND id_proveedor = @idpv`);
    } else {
      // No existe → insertar nuevo registro
      await pool.request()
        .input("idp",  sql.Int, idP)
        .input("idpv", sql.Int, idPv)
        .input("cant", sql.Int, cant)
        .query(`INSERT INTO tb_producto_proveedor (id_producto, id_proveedor, cantidad_suministrada)
                VALUES (@idp, @idpv, @cant)`);
    }

    // En ambos casos: aumentar stock del producto
    await pool.request()
      .input("idp",  sql.Int, idP)
      .input("cant", sql.Int, cant)
      .query("UPDATE tb_productos SET stock = stock + @cant WHERE id_producto = @idp");

    res.status(201).json({ mensaje: `Stock aumentado en ${cant} unidades correctamente.` });

  } catch (err) {
    console.error("POST /distribucion error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE — eliminar distribución y DESCONTAR stock
router.delete("/", verificarToken, async (req, res) => {
  const { id_producto, id_proveedor } = req.body;

  const idP  = parseInt(id_producto);
  const idPv = parseInt(id_proveedor);

  try {
    const pool = await poolPromise;

    // Obtener cantidad antes de eliminar para restar del stock
    const dist = await pool.request()
      .input("idp",  sql.Int, idP)
      .input("idpv", sql.Int, idPv)
      .query("SELECT cantidad_suministrada FROM tb_producto_proveedor WHERE id_producto = @idp AND id_proveedor = @idpv");

    if (dist.recordset.length === 0)
      return res.status(404).json({ error: "Distribución no encontrada" });

    const cantidad = dist.recordset[0].cantidad_suministrada;

    // Eliminar distribución
    await pool.request()
      .input("idp",  sql.Int, idP)
      .input("idpv", sql.Int, idPv)
      .query("DELETE FROM tb_producto_proveedor WHERE id_producto = @idp AND id_proveedor = @idpv");

    // Restar stock (nunca baja de 0)
    await pool.request()
      .input("idp",  sql.Int, idP)
      .input("cant", sql.Int, cantidad)
      .query(`UPDATE tb_productos 
              SET stock = CASE WHEN stock - @cant < 0 THEN 0 ELSE stock - @cant END
              WHERE id_producto = @idp`);

    res.json({ mensaje: `Distribución eliminada y stock reducido en ${cantidad} unidades.` });

  } catch (err) {
    console.error("DELETE /distribucion error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;