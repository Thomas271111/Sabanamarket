// src/controllers/user.controller.js
// =============================================
// Lógica del módulo de perfil de usuario:
//   PROF-01 → Obtener datos del perfil
//   PROF-02 → Actualizar carrera
//   PROF-03 → Subir foto de perfil
//   PROF-04 → Conversión automática a vendedor
// =============================================

const pool = require("../config/db");

// ─────────────────────────────────────────────
// PROF-01: OBTENER PERFIL DE USUARIO
// GET /api/users/:id
// Devuelve nombre, carrera, reputación y foto
// ─────────────────────────────────────────────
const getPerfil = async (req, res) => {
  // El :id viene en la URL, ej: /api/users/5
  const { id } = req.params;

  try {
    const resultado = await pool.query(
      // Seleccionamos todo EXCEPTO la contraseña por seguridad
      `SELECT id, nombre, email, carrera, foto_url, rol, is_vendedor, reputacion, created_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    // Si no encontramos al usuario, respondemos 404
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // ✅ Respondemos con los datos del perfil
    return res.status(200).json({
      nombre: resultado.rows[0].nombre,
      email: resultado.rows[0].email,
      carrera: resultado.rows[0].carrera,
      foto_url: resultado.rows[0].foto_url,
      rol: resultado.rows[0].rol,
      is_vendedor: resultado.rows[0].is_vendedor,
      reputacion: resultado.rows[0].reputacion,  // PROF-05: promedio de estrellas
      created_at: resultado.rows[0].created_at,
    });

  } catch (error) {
    console.error("Error en getPerfil:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────
// PROF-02: ACTUALIZAR CARRERA
// PATCH /api/users/:id/career
// Body: { career: "ingenieria_sistemas" }
// ─────────────────────────────────────────────
const actualizarCarrera = async (req, res) => {
  const { id } = req.params;
  const { career } = req.body;

  // Validamos que venga el campo carrera
  if (!career || career.trim() === "") {
    return res.status(400).json({ error: "Dato inválido: la carrera no puede estar vacía" });
  }

  // Lista de carreras válidas — evita que manden cualquier texto
  const carrerasValidas = [
    "ingenieria_sistemas", "administracion", "derecho",
    "medicina", "psicologia", "comunicacion", "mercadeo", "educacion", "otra"
  ];

  if (!carrerasValidas.includes(career)) {
    return res.status(400).json({ error: "Dato inválido: carrera no reconocida" });
  }

  // Solo el propio usuario puede editar su perfil
  // req.user viene del middleware checkAuth (AUTH-06)
  if (parseInt(id) !== req.user.id) {
    return res.status(403).json({ error: "No puedes editar el perfil de otro usuario" });
  }

  try {
    const resultado = await pool.query(
      "UPDATE users SET carrera = $1 WHERE id = $2 RETURNING id, nombre, carrera",
      [career, id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    return res.status(200).json({
      mensaje: "Carrera actualizada correctamente",
      usuario: resultado.rows[0],
    });

  } catch (error) {
    console.error("Error en actualizarCarrera:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────
// PROF-03: SUBIR FOTO DE PERFIL
// POST /api/users/photo
// Body: { foto_url: "https://..." }
// Nota: Por ahora recibimos una URL directa.
// En producción usarías multer + cloudinary.
// ─────────────────────────────────────────────
const subirFoto = async (req, res) => {
  const { foto_url } = req.body;
  // El id del usuario viene del token JWT (middleware checkAuth)
  const userId = req.user.id;

  if (!foto_url || foto_url.trim() === "") {
    return res.status(400).json({ error: "La URL de la foto es obligatoria" });
  }

  // Validación básica de que sea una URL
  try {
    new URL(foto_url); // Si no es URL válida, lanza error
  } catch {
    return res.status(400).json({ error: "La URL de la foto no es válida" });
  }

  try {
    const resultado = await pool.query(
      "UPDATE users SET foto_url = $1 WHERE id = $2 RETURNING id, nombre, foto_url",
      [foto_url, userId]
    );

    // ✅ Respondemos con la URL guardada
    return res.status(201).json({
      mensaje: "Foto de perfil actualizada",
      url: resultado.rows[0].foto_url,
    });

  } catch (error) {
    console.error("Error en subirFoto:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────
// PROF-04: CONVERSIÓN AUTOMÁTICA A VENDEDOR
// Esta función NO es un endpoint directo.
// Se llama internamente desde el controlador
// de productos cuando el usuario crea su
// primer producto (PROD-03).
// ─────────────────────────────────────────────
const convertirAVendedor = async (userId) => {
  try {
    // Contamos cuántos productos activos tiene el usuario
    const resultado = await pool.query(
      "SELECT COUNT(*) FROM products WHERE owner_id = $1 AND activo = true",
      [userId]
    );

    const cantidadProductos = parseInt(resultado.rows[0].count);

    // Si tiene más de 0 productos, lo marcamos como vendedor
    if (cantidadProductos > 0) {
      await pool.query(
        "UPDATE users SET is_vendedor = true WHERE id = $1",
        [userId]
      );
      console.log(`✅ Usuario ${userId} convertido a vendedor`);
    }

  } catch (error) {
    // No interrumpimos el flujo principal si esto falla
    console.error("Error en convertirAVendedor:", error.message);
  }
};

module.exports = { getPerfil, actualizarCarrera, subirFoto, convertirAVendedor };
