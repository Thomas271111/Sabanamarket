// src/controllers/product.controller.js
// =============================================
// Lógica del módulo de productos:
//   PROD-03 → Crear producto (persistencia en BD)
//   PROD-04 → Subida de múltiples imágenes
//   PROD-05 → Listado general de productos
//   PROD-06 → Paginación (10 por página)
//   PROD-07 → Detalle individual
//   PROD-08 → Edición de producto
//   PROD-09 → Eliminación lógica
//   PROD-10 → Filtro por categoría
//   PROD-11 → Filtro por estado (nuevo/usado)
//   PROD-12 → Mis publicaciones
// =============================================

const pool = require("../config/db");
const { convertirAVendedor } = require("./user.controller");

// Categorías válidas del marketplace
const CATEGORIAS_VALIDAS = [
  "libros", "tecnologia", "ropa", "deportes",
  "hogar", "apuntes", "otro"
];

// ─────────────────────────────────────────────
// PROD-03 + PROD-04: CREAR PRODUCTO
// POST /api/products
// Body: { titulo, descripcion, precio, categoria, estado, imagenes[] }
// ─────────────────────────────────────────────
const crearProducto = async (req, res) => {
  // El id del vendedor viene del token JWT (checkAuth)
  const owner_id = req.user.id;

  const { titulo, descripcion, precio, categoria, estado, imagenes } = req.body;

  // ── Validaciones de campos obligatorios ──
  if (!titulo || !descripcion || !precio || !categoria || !estado) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  // PROD-02: El precio debe ser mayor a 0
  if (precio <= 0) {
    return res.status(400).json({ error: "El precio debe ser mayor a 0" });
  }

  // Validamos que la categoría sea una de las permitidas
  if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    return res.status(400).json({ error: `Categoría inválida. Opciones: ${CATEGORIAS_VALIDAS.join(", ")}` });
  }

  // PROD-11: estado solo puede ser "nuevo" o "usado"
  if (!["nuevo", "usado"].includes(estado)) {
    return res.status(400).json({ error: 'El estado debe ser "nuevo" o "usado"' });
  }

  // PROD-04: imagenes es un array de URLs (puede estar vacío)
  // Verificamos que sea un array si viene
  const urlsImagenes = Array.isArray(imagenes) ? imagenes : [];

  try {
    // Guardamos el producto en la base de datos
    const resultado = await pool.query(
      `INSERT INTO products (owner_id, titulo, descripcion, precio, categoria, estado, imagenes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [owner_id, titulo, descripcion, precio, categoria, estado, urlsImagenes]
    );

    const nuevoProducto = resultado.rows[0];

    // PROF-04: Convertimos al usuario en vendedor automáticamente
    // si este es su primer producto
    await convertirAVendedor(owner_id);

    // Respondemos con 201 Created
    return res.status(201).json({
      mensaje: "Producto publicado exitosamente",
      id: nuevoProducto.id,
      owner: nuevoProducto.owner_id,
    });

  } catch (error) {
    console.error("Error en crearProducto:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────
// PROD-05 + PROD-06 + PROD-10 + PROD-11:
// LISTADO DE PRODUCTOS CON FILTROS Y PAGINACIÓN
// GET /api/products?page=1&cat=tecnologia&estado=nuevo&search=texto
// ─────────────────────────────────────────────
const listarProductos = async (req, res) => {
  // Leemos los parámetros de la URL (query params)
  const pagina    = parseInt(req.query.page)   || 1;       // PROD-06: página actual
  const categoria = req.query.cat              || null;    // PROD-10: filtro categoría
  const estado    = req.query.estado           || null;    // PROD-11: filtro estado
  const busqueda  = req.query.search           || null;    // Búsqueda por texto
  const limite    = 10;                                    // PROD-06: 10 por página
  const offset    = (pagina - 1) * limite;                 // Cuántos saltar

  try {
    // Construimos la query dinámicamente según los filtros activos
    // Usamos un array de condiciones y valores para evitar SQL injection
    const condiciones = ["p.activo = true"]; // Solo productos activos
    const valores     = [];
    let   contador    = 1; // Contador de parámetros ($1, $2, ...)

    // PROD-10: filtro por categoría
    if (categoria) {
      condiciones.push(`p.categoria = $${contador}`);
      valores.push(categoria);
      contador++;
    }

    // PROD-11: filtro por estado
    if (estado && ["nuevo", "usado"].includes(estado)) {
      condiciones.push(`p.estado = $${contador}`);
      valores.push(estado);
      contador++;
    }

    // Búsqueda por texto en título o descripción
    if (busqueda) {
      condiciones.push(`(p.titulo ILIKE $${contador} OR p.descripcion ILIKE $${contador})`);
      valores.push(`%${busqueda}%`); // ILIKE = búsqueda sin distinguir mayúsculas
      contador++;
    }

    const where = `WHERE ${condiciones.join(" AND ")}`;

    // Contamos el total de productos para la paginación
    const totalQuery = await pool.query(
      `SELECT COUNT(*) FROM products p ${where}`,
      valores
    );
    const total = parseInt(totalQuery.rows[0].count);

    // Traemos los productos de la página actual
    // Hacemos JOIN con users para traer el nombre del vendedor
    const productosQuery = await pool.query(
      `SELECT p.*, u.nombre AS vendedor_nombre, u.reputacion AS vendedor_reputacion
       FROM products p
       JOIN users u ON p.owner_id = u.id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${contador} OFFSET $${contador + 1}`,
      [...valores, limite, offset]
    );

    // PROD-06: Respondemos con data + info de paginación
    return res.status(200).json({
      data       : productosQuery.rows,
      total,                                    // Total de productos
      page       : pagina,                      // Página actual
      totalPages : Math.ceil(total / limite),   // Total de páginas
      limit      : limite,
    });

  } catch (error) {
    console.error("Error en listarProductos:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────
// PROD-07: DETALLE DE UN PRODUCTO
// GET /api/products/:id
// ─────────────────────────────────────────────
const obtenerProducto = async (req, res) => {
  const { id } = req.params;

  try {
    const resultado = await pool.query(
      `SELECT p.*, u.nombre AS vendedor_nombre, u.foto_url AS vendedor_foto,
              u.reputacion AS vendedor_reputacion, u.is_vendedor
       FROM products p
       JOIN users u ON p.owner_id = u.id
       WHERE p.id = $1 AND p.activo = true`,
      [id]
    );

    // PROD-07: Si no existe el producto, respondemos 404
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: "Producto no disponible" });
    }

    return res.status(200).json(resultado.rows[0]);

  } catch (error) {
    console.error("Error en obtenerProducto:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────
// PROD-08: EDITAR PRODUCTO
// PUT /api/products/:id
// Body: { titulo?, descripcion?, precio?, categoria?, estado?, imagenes? }
// ─────────────────────────────────────────────
const editarProducto = async (req, res) => {
  const { id }      = req.params;
  const userId      = req.user.id;
  const { titulo, descripcion, precio, categoria, estado, imagenes } = req.body;

  // Verificamos que el producto exista y pertenezca al usuario
  try {
    const productoActual = await pool.query(
      "SELECT * FROM products WHERE id = $1 AND activo = true",
      [id]
    );

    if (productoActual.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // Solo el dueño puede editar su producto
    if (productoActual.rows[0].owner_id !== userId) {
      return res.status(403).json({ error: "No puedes editar un producto que no es tuyo" });
    }

    // PROD-02: Validamos precio si viene en el body
    if (precio !== undefined && precio <= 0) {
      return res.status(400).json({ error: "El precio debe ser mayor a 0" });
    }

    // Usamos los valores nuevos o mantenemos los actuales si no vienen
    const prod = productoActual.rows[0];

    const resultado = await pool.query(
      `UPDATE products
       SET titulo      = $1,
           descripcion = $2,
           precio      = $3,
           categoria   = $4,
           estado      = $5,
           imagenes    = $6,
           updated_at  = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        titulo      ?? prod.titulo,
        descripcion ?? prod.descripcion,
        precio      ?? prod.precio,
        categoria   ?? prod.categoria,
        estado      ?? prod.estado,
        imagenes    ?? prod.imagenes,
        id,
      ]
    );

    return res.status(200).json({
      mensaje  : "Producto actualizado",
      producto : resultado.rows[0],
    });

  } catch (error) {
    console.error("Error en editarProducto:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────
// PROD-09: ELIMINAR PRODUCTO (lógica)
// DELETE /api/products/:id
// No borra el registro — solo lo marca como inactivo
// ─────────────────────────────────────────────
const eliminarProducto = async (req, res) => {
  const { id }  = req.params;
  const userId  = req.user.id;

  try {
    const producto = await pool.query(
      "SELECT * FROM products WHERE id = $1 AND activo = true",
      [id]
    );

    if (producto.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // Solo el dueño (o un admin) puede eliminar
    if (producto.rows[0].owner_id !== userId && req.user.rol !== "admin") {
      return res.status(403).json({ error: "No tienes permiso para eliminar este producto" });
    }

    // PROD-09: Marcamos activo = false en vez de borrar el registro
    await pool.query(
      "UPDATE products SET activo = false, updated_at = NOW() WHERE id = $1",
      [id]
    );

    return res.status(200).json({ mensaje: "Producto eliminado correctamente" });

  } catch (error) {
    console.error("Error en eliminarProducto:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────
// PROD-12: MIS PUBLICACIONES
// GET /api/users/:id/products
// Devuelve solo los productos del vendedor autenticado
// ─────────────────────────────────────────────
const misProductos = async (req, res) => {
  const { id } = req.params;

  try {
    const resultado = await pool.query(
      `SELECT * FROM products
       WHERE owner_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    // Devolvemos todos (activos e inactivos) para que el vendedor
    // pueda ver cuáles tiene desactivados
    return res.status(200).json({
      data  : resultado.rows,
      total : resultado.rows.length,
    });

  } catch (error) {
    console.error("Error en misProductos:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  crearProducto,
  listarProductos,
  obtenerProducto,
  editarProducto,
  eliminarProducto,
  misProductos,
};
