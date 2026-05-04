// src/routes/user.routes.js
// =============================================
// Rutas del módulo de perfil de usuario
// Todas las rutas aquí son PRIVADAS —
// requieren el token JWT (checkAuth)
// =============================================

const express = require("express");
const router = express.Router();

// Importamos el controlador de usuarios
const {
  getPerfil,
  actualizarCarrera,
  subirFoto,
} = require("../controllers/user.controller");

// Importamos el middleware de autenticación (AUTH-06)
const { checkAuth } = require("../middleware/auth.middleware");

// ────────────────────────────────────────────
// PROF-01: Obtener perfil de un usuario
// GET /api/users/:id
// Es pública: cualquiera puede ver un perfil
// ────────────────────────────────────────────
router.get("/:id", getPerfil);

// ────────────────────────────────────────────
// PROF-02: Actualizar carrera
// PATCH /api/users/:id/career
// Es privada: solo el propio usuario
// ────────────────────────────────────────────
router.patch("/:id/career", checkAuth, actualizarCarrera);

// ────────────────────────────────────────────
// PROF-03: Subir foto de perfil
// POST /api/users/photo
// Es privada: solo usuarios autenticados
// ────────────────────────────────────────────
router.post("/photo", checkAuth, subirFoto);

module.exports = router;

// ────────────────────────────────────────────
// PROD-12: Mis publicaciones
// GET /api/users/:id/products
// Publica: cualquiera puede ver los productos de un vendedor
// ────────────────────────────────────────────
const { misProductos } = require("../controllers/product.controller");
router.get("/:id/products", misProductos);
