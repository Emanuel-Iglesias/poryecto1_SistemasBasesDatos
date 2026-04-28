// backend/server.js
const express = require("express");
const cors    = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Iniciar conexión MySQL al arrancar
require("./config/dbMysql");

// Rutas
app.use("/api/productos",    require("./routes/productos"));
app.use("/api/proveedores",  require("./routes/proveedores"));
app.use("/api/reportes",     require("./routes/reportes"));
app.use("/api/distribucion", require("./routes/distribucion"));
app.use("/api/auth",         require("./routes/auth"));
app.use("/api/salidas",      require("./routes/salidas"));
app.use("/api/clientes",     require("./routes/clientes"));

app.get("/", (req, res) => res.json({ mensaje: "Servidor funcionando correctamente" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));