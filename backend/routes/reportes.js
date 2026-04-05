const express = require("express");
const router  = express.Router();
const { sql, poolPromise } = require("../config/db");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

// ── Stock bajo ──────────────────────────────────────────────
router.get("/stock-bajo", async (req, res) => {
  const limite = parseInt(req.query.limite) || 10;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("limite", sql.Int, limite)
      .query("SELECT * FROM tb_productos WHERE stock < @limite ORDER BY stock ASC");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Por fecha ───────────────────────────────────────────────
router.get("/por-fecha", async (req, res) => {
  const { desde, hasta } = req.query;
  if (!desde || !hasta)
    return res.status(400).json({ error: "Parámetros desde y hasta son requeridos" });
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("desde", sql.DateTime, new Date(desde))
      .input("hasta", sql.DateTime, new Date(hasta))
      .query(`SELECT * FROM tb_productos 
              WHERE fecha_ingreso BETWEEN @desde AND @hasta 
              ORDER BY fecha_ingreso DESC`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── INNER JOIN ──────────────────────────────────────────────
router.get("/inner-join", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT pv.nombre_proveedor, pv.telefono, pv.correo_electronico,
             p.nombre_producto, p.precio, p.stock, pp.cantidad_suministrada
      FROM tb_proveedores pv
      INNER JOIN tb_producto_proveedor pp ON pv.id_proveedor = pp.id_proveedor
      INNER JOIN tb_productos p           ON pp.id_producto  = p.id_producto
      ORDER BY pv.nombre_proveedor`);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── LEFT JOIN ───────────────────────────────────────────────
router.get("/left-join", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT p.nombre_producto, p.precio, p.stock,
             pv.nombre_proveedor, pp.cantidad_suministrada
      FROM tb_productos p
      LEFT JOIN tb_producto_proveedor pp ON p.id_producto   = pp.id_producto
      LEFT JOIN tb_proveedores pv        ON pp.id_proveedor = pv.id_proveedor
      ORDER BY p.nombre_producto`);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── RIGHT JOIN ──────────────────────────────────────────────
router.get("/right-join", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT p.nombre_producto, p.precio,
             pv.nombre_proveedor, pv.telefono, pp.cantidad_suministrada
      FROM tb_productos p
      RIGHT JOIN tb_producto_proveedor pp ON p.id_producto   = pp.id_producto
      RIGHT JOIN tb_proveedores pv        ON pp.id_proveedor = pv.id_proveedor
      ORDER BY pv.nombre_proveedor`);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Gráfico ─────────────────────────────────────────────────
router.get("/grafico-proveedores", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT pv.nombre_proveedor,
             SUM(pp.cantidad_suministrada) AS total_suministrado
      FROM tb_proveedores pv
      INNER JOIN tb_producto_proveedor pp ON pv.id_proveedor = pp.id_proveedor
      GROUP BY pv.nombre_proveedor
      ORDER BY total_suministrado DESC`);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── EXPORTAR EXCEL ──────────────────────────────────────────
router.get("/exportar-excel", async (req, res) => {
  try {
    const pool = await poolPromise;
    const productos    = await pool.request().query("SELECT * FROM tb_productos ORDER BY nombre_producto");
    const proveedores  = await pool.request().query("SELECT * FROM tb_proveedores ORDER BY nombre_proveedor");
    const distribucion = await pool.request().query(`
      SELECT p.nombre_producto, pv.nombre_proveedor, pp.cantidad_suministrada
      FROM tb_producto_proveedor pp
      INNER JOIN tb_productos   p  ON pp.id_producto  = p.id_producto
      INNER JOIN tb_proveedores pv ON pp.id_proveedor = pv.id_proveedor
      ORDER BY pv.nombre_proveedor`);
    const stockBajo = await pool.request().query(
      "SELECT * FROM tb_productos WHERE stock < 10 ORDER BY stock ASC");

    const wb = new ExcelJS.Workbook();
    wb.creator = "Sistema de Gestión";

    const encabezado = {
      font: { bold: true, color: { argb: "FFFFFFFF" }, size: 11 },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F3460" } },
      alignment: { horizontal: "center", vertical: "middle" },
      border: {
        top: { style: "thin" }, bottom: { style: "thin" },
        left: { style: "thin" }, right: { style: "thin" }
      }
    };
    const fila = {
      border: {
        top:    { style: "thin", color: { argb: "FFDDDDDD" } },
        bottom: { style: "thin", color: { argb: "FFDDDDDD" } },
        left:   { style: "thin", color: { argb: "FFDDDDDD" } },
        right:  { style: "thin", color: { argb: "FFDDDDDD" } }
      }
    };

    // Hoja 1 — Productos
    const h1 = wb.addWorksheet("Productos");
    h1.columns = [
      { header: "ID",            key: "id_producto",     width: 8  },
      { header: "Nombre",        key: "nombre_producto", width: 30 },
      { header: "Descripción",   key: "descripcion",     width: 35 },
      { header: "Precio (Q)",    key: "precio",          width: 14 },
      { header: "Stock",         key: "stock",           width: 10 },
      { header: "Fecha Ingreso", key: "fecha_ingreso",   width: 22 },
    ];
    h1.getRow(1).eachCell(c => Object.assign(c, encabezado));
    h1.getRow(1).height = 22;
    productos.recordset.forEach(r => {
      const row = h1.addRow({
        ...r,
        precio: parseFloat(r.precio),
        fecha_ingreso: new Date(r.fecha_ingreso).toLocaleString("es-GT")
      });
      row.eachCell(c => Object.assign(c, fila));
    });

    // Hoja 2 — Proveedores
    const h2 = wb.addWorksheet("Proveedores");
    h2.columns = [
      { header: "ID",        key: "id_proveedor",       width: 8  },
      { header: "Nombre",    key: "nombre_proveedor",   width: 30 },
      { header: "Teléfono",  key: "telefono",           width: 18 },
      { header: "Correo",    key: "correo_electronico", width: 30 },
      { header: "Dirección", key: "direccion",          width: 35 },
    ];
    h2.getRow(1).eachCell(c => Object.assign(c, encabezado));
    h2.getRow(1).height = 22;
    proveedores.recordset.forEach(r => {
      const row = h2.addRow(r);
      row.eachCell(c => Object.assign(c, fila));
    });

    // Hoja 3 — Distribución
    const h3 = wb.addWorksheet("Distribución");
    h3.columns = [
      { header: "Producto",              key: "nombre_producto",      width: 30 },
      { header: "Proveedor",             key: "nombre_proveedor",     width: 30 },
      { header: "Cantidad Suministrada", key: "cantidad_suministrada",width: 22 },
    ];
    h3.getRow(1).eachCell(c => Object.assign(c, encabezado));
    h3.getRow(1).height = 22;
    distribucion.recordset.forEach(r => {
      const row = h3.addRow(r);
      row.eachCell(c => Object.assign(c, fila));
    });

    // Hoja 4 — Stock Bajo
    const h4 = wb.addWorksheet("Stock Bajo");
    h4.columns = [
      { header: "ID",            key: "id_producto",     width: 8  },
      { header: "Nombre",        key: "nombre_producto", width: 30 },
      { header: "Precio (Q)",    key: "precio",          width: 14 },
      { header: "Stock",         key: "stock",           width: 10 },
      { header: "Fecha Ingreso", key: "fecha_ingreso",   width: 22 },
    ];
    h4.getRow(1).eachCell(c => Object.assign(c, encabezado));
    h4.getRow(1).height = 22;
    stockBajo.recordset.forEach(r => {
      const row = h4.addRow({
        ...r,
        precio: parseFloat(r.precio),
        fecha_ingreso: new Date(r.fecha_ingreso).toLocaleString("es-GT")
      });
      row.eachCell(c => Object.assign(c, fila));
      if (r.stock < 5) {
        row.getCell("stock").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE0E0" } };
        row.getCell("stock").font = { bold: true, color: { argb: "FFCC0000" } };
      }
    });

    const fecha = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=reporte_${fecha}.xlsx`);
    await wb.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("Error exportando Excel:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── EXPORTAR PDF ────────────────────────────────────────────
router.get("/exportar-pdf", async (req, res) => {
  try {
    const pool = await poolPromise;
    const productos    = await pool.request().query("SELECT * FROM tb_productos ORDER BY nombre_producto");
    const proveedores  = await pool.request().query("SELECT * FROM tb_proveedores ORDER BY nombre_proveedor");
    const distribucion = await pool.request().query(`
      SELECT p.nombre_producto, pv.nombre_proveedor, pp.cantidad_suministrada
      FROM tb_producto_proveedor pp
      INNER JOIN tb_productos   p  ON pp.id_producto  = p.id_producto
      INNER JOIN tb_proveedores pv ON pp.id_proveedor = pv.id_proveedor
      ORDER BY pv.nombre_proveedor`);
    const stockBajo = await pool.request().query(
      "SELECT * FROM tb_productos WHERE stock < 10 ORDER BY stock ASC");

    const doc  = new PDFDocument({ margin: 40, size: "A4" });
    const fecha = new Date().toLocaleString("es-GT");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=reporte_${new Date().toISOString().slice(0,10)}.pdf`);
    doc.pipe(res);

    // ── Función helpers ──
    const titulo = (texto, color = "#0f3460") => {
      doc.moveDown(0.5)
         .fontSize(14).fillColor(color).font("Helvetica-Bold")
         .text(texto)
         .moveDown(0.3);
    };

    const encabezadoTabla = (cols) => {
      const y = doc.y;
      doc.rect(40, y, 515, 18).fill("#0f3460");
      let x = 45;
      cols.forEach(({ label, w }) => {
        doc.fontSize(8).fillColor("#ffffff").font("Helvetica-Bold")
           .text(label, x, y + 4, { width: w, ellipsis: true });
        x += w;
      });
      doc.moveDown(0.1);
    };

    const filaTabla = (cols, valores, indice) => {
      const y = doc.y + 2;
      if (indice % 2 === 0)
        doc.rect(40, y - 2, 515, 16).fill("#f0f4ff");
      let x = 45;
      cols.forEach(({ w }, i) => {
        doc.fontSize(7.5).fillColor("#222").font("Helvetica")
           .text(String(valores[i] ?? "—"), x, y, { width: w - 4, ellipsis: true });
        x += w;
      });
      doc.y = y + 14;
    };

    // ── Portada ──
    doc.rect(0, 0, 612, 100).fill("#0f3460");
    doc.fontSize(22).fillColor("#ffffff").font("Helvetica-Bold")
       .text("Reporte General del Sistema", 40, 30, { align: "center" });
    doc.fontSize(10).fillColor("#a0c4ff")
       .text(`Generado el ${fecha}`, 40, 62, { align: "center" });
    doc.moveDown(2);

    // ── Sección 1: Productos ──
    titulo("1. Productos");
    const colsProd = [
      { label: "ID",            w: 35  },
      { label: "Nombre",        w: 160 },
      { label: "Precio (Q)",    w: 70  },
      { label: "Stock",         w: 50  },
      { label: "Fecha Ingreso", w: 200 },
    ];
    encabezadoTabla(colsProd);
    productos.recordset.forEach((r, i) => {
      filaTabla(colsProd, [
        r.id_producto,
        r.nombre_producto,
        parseFloat(r.precio).toFixed(2),
        r.stock,
        new Date(r.fecha_ingreso).toLocaleString("es-GT")
      ], i);
      if (doc.y > 720) { doc.addPage(); }
    });

    // ── Sección 2: Proveedores ──
    doc.addPage();
    titulo("2. Proveedores");
    const colsProv = [
      { label: "ID",        w: 35  },
      { label: "Nombre",    w: 150 },
      { label: "Teléfono",  w: 90  },
      { label: "Correo",    w: 150 },
      { label: "Dirección", w: 90  },
    ];
    encabezadoTabla(colsProv);
    proveedores.recordset.forEach((r, i) => {
      filaTabla(colsProv, [
        r.id_proveedor,
        r.nombre_proveedor,
        r.telefono   || "—",
        r.correo_electronico || "—",
        r.direccion  || "—"
      ], i);
      if (doc.y > 720) { doc.addPage(); }
    });

    // ── Sección 3: Distribución ──
    doc.addPage();
    titulo("3. Distribución Producto-Proveedor");
    const colsDist = [
      { label: "Producto",              w: 200 },
      { label: "Proveedor",             w: 200 },
      { label: "Cantidad Suministrada", w: 115 },
    ];
    encabezadoTabla(colsDist);
    distribucion.recordset.forEach((r, i) => {
      filaTabla(colsDist, [
        r.nombre_producto,
        r.nombre_proveedor,
        r.cantidad_suministrada
      ], i);
      if (doc.y > 720) { doc.addPage(); }
    });

    // ── Sección 4: Stock Bajo ──
    doc.addPage();
    titulo("4. Productos con Stock Bajo (< 10)", "#cc0000");
    const colsStock = [
      { label: "ID",            w: 35  },
      { label: "Nombre",        w: 200 },
      { label: "Precio (Q)",    w: 80  },
      { label: "Stock",         w: 60  },
      { label: "Fecha Ingreso", w: 140 },
    ];
    encabezadoTabla(colsStock);
    stockBajo.recordset.forEach((r, i) => {
      filaTabla(colsStock, [
        r.id_producto,
        r.nombre_producto,
        parseFloat(r.precio).toFixed(2),
        r.stock,
        new Date(r.fecha_ingreso).toLocaleString("es-GT")
      ], i);
      if (doc.y > 720) { doc.addPage(); }
    });

    doc.end();

  } catch (err) {
    console.error("Error exportando PDF:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;