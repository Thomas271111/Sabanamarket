// src/routes/product.routes.js
// =============================================
// Rutas del módulo de productos
// Algunas son públicas, otras requieren token
// =============================================

const express = require("express");
const router  = express.Router();

const {
  crearProducto,
  listarProductos,
  obtenerProducto,
  editarProducto,
  eliminarProducto,
  misProductos,
} = require("../controllers/product.controller");

const { checkAuth } = require("../middleware/auth.middleware");

// ── Rutas PÚBLICAS (no requieren token) ──────

// PROD-05 + PROD-06 + PROD-10 + PROD-11:
// GET /api/products?page=1&cat=tecnologia&estado=nuevo&search=texto
router.get("/", listarProductos);

// PROD-07: Ver detalle de un producto
// GET /api/products/:id
router.get("/:id", obtenerProducto);

// ── Rutas PRIVADAS (requieren token JWT) ─────

// PROD-03 + PROD-04: Crear producto
// POST /api/products
router.post("/", checkAuth, crearProducto);

// PROD-08: Editar producto
// PUT /api/products/:id
router.put("/:id", checkAuth, editarProducto);

// PROD-09: Eliminar producto (lógico)
// DELETE /api/products/:id
router.delete("/:id", checkAuth, eliminarProducto);

module.exports = router;
