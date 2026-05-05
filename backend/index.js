// src/index.js
// =============================================
// Punto de entrada del servidor Express
// =============================================

const express = require("express");
const cors    = require("cors");
require("dotenv").config();

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── MIDDLEWARES GLOBALES ────────────────────
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ─── RUTAS ──────────────────────────────────

// Autenticacion — AUTH-03, 04, 05
const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

// Perfil de usuario — PROF-01, 02, 03
const userRoutes = require("./routes/user.routes");
app.use("/api/users", userRoutes);

// Productos — PROD-03 al 12
const productRoutes = require("./routes/product.routes");
app.use("/api/products", productRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ mensaje: "SabanaMarket API funcionando correctamente" });
});

// ─── ARRANQUE ───────────────────────────────
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
