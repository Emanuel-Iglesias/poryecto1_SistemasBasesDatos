// backend/server.js
const express = require("express");
const cors    = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Rutas originales
app.use("/api/productos",    require("./routes/productos"));
app.use("/api/proveedores",  require("./routes/proveedores"));
app.use("/api/reportes",     require("./routes/reportes"));
app.use("/api/distribucion", require("./routes/distribucion"));

// Rutas nuevas (Parte 2)
app.use("/api/auth",    require("./routes/auth"));
app.use("/api/salidas", require("./routes/salidas"));

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ mensaje: "Servidor funcionando correctamente" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});