const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        pp.id_producto, pp.id_proveedor,
        p.nombre_producto, pv.nombre_proveedor,
        pp.cantidad_suministrada
      FROM tb_producto_proveedor pp
      INNER JOIN tb_productos p ON pp.id_producto = p.id_producto
      INNER JOIN tb_proveedores pv ON pp.id_proveedor = pv.id_proveedor
      ORDER BY pv.nombre_proveedor
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("GET /distribucion error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  console.log("POST /distribucion body:", req.body);
  const { id_producto, id_proveedor, cantidad_suministrada } = req.body;

  if (!id_producto || !id_proveedor || !cantidad_suministrada) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }

  try {
    const pool = await poolPromise;

    // Si ya existe, actualiza sumando la cantidad
    const existe = await pool.request()
      .input("idp",  sql.Int, parseInt(id_producto))
      .input("idpv", sql.Int, parseInt(id_proveedor))
      .query("SELECT * FROM tb_producto_proveedor WHERE id_producto = @idp AND id_proveedor = @idpv");

    if (existe.recordset.length > 0) {
      await pool.request()
        .input("idp",  sql.Int, parseInt(id_producto))
        .input("idpv", sql.Int, parseInt(id_proveedor))
        .input("cant", sql.Int, parseInt(cantidad_suministrada))
        .query(`UPDATE tb_producto_proveedor 
                SET cantidad_suministrada = cantidad_suministrada + @cant
                WHERE id_producto = @idp AND id_proveedor = @idpv`);

      return res.json({ mensaje: "Cantidad actualizada — se sumó al registro existente" });
    }

    // Si no existe, inserta nuevo
    await pool.request()
      .input("idp",  sql.Int, parseInt(id_producto))
      .input("idpv", sql.Int, parseInt(id_proveedor))
      .input("cant", sql.Int, parseInt(cantidad_suministrada))
      .query(`INSERT INTO tb_producto_proveedor (id_producto, id_proveedor, cantidad_suministrada)
              VALUES (@idp, @idpv, @cant)`);

    res.status(201).json({ mensaje: "Distribución asignada correctamente" });

  } catch (err) {
    console.error("POST /distribucion error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/", async (req, res) => {
  const { id_producto, id_proveedor } = req.body;

  try {
    const pool = await poolPromise;

    // Obtener cantidad antes de eliminar para restar del stock
    const dist = await pool.request()
      .input("idp",  sql.Int, parseInt(id_producto))
      .input("idpv", sql.Int, parseInt(id_proveedor))
      .query("SELECT cantidad_suministrada FROM tb_producto_proveedor WHERE id_producto = @idp AND id_proveedor = @idpv");

    if (dist.recordset.length === 0)
      return res.status(404).json({ error: "Distribución no encontrada" });

    const cantidad = dist.recordset[0].cantidad_suministrada;

    // Eliminar distribución
    await pool.request()
      .input("idp",  sql.Int, parseInt(id_producto))
      .input("idpv", sql.Int, parseInt(id_proveedor))
      .query("DELETE FROM tb_producto_proveedor WHERE id_producto = @idp AND id_proveedor = @idpv");

    // Restar stock del producto
    await pool.request()
      .input("idp",  sql.Int, parseInt(id_producto))
      .input("cant", sql.Int, cantidad)
      .query(`UPDATE tb_productos 
              SET stock = CASE WHEN stock - @cant < 0 THEN 0 ELSE stock - @cant END
              WHERE id_producto = @idp`);

    res.json({ mensaje: `Distribución eliminada y stock reducido en ${cantidad} unidades` });
  } catch (err) {
    console.error("DELETE /distribucion error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;