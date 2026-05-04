import { useState, useEffect } from "react";

// ============================================================
// PROF-05: Visualización de reputación con estrellas
// PROF-06: Cierre de sesión — elimina token y redirige
// ============================================================

// ── Helpers ──────────────────────────────────────────────────

// PROF-05: Convierte el número de estrellas en una etiqueta
const etiquetaReputacion = (estrellas) => {
  if (estrellas === 0)   return { texto: "Sin reseñas aún", color: "#aaa" };
  if (estrellas >= 4.5)  return { texto: "Excelente vendedor", color: "#38a169" };
  if (estrellas >= 4)    return { texto: "Muy bueno", color: "#48bb78" };
  if (estrellas >= 3)    return { texto: "Bueno", color: "#C9A84C" };
  return                        { texto: "Regular", color: "#e53e3e" };
};

// Renderiza las estrellas llenas, medias y vacías
const Estrellas = ({ valor }) => {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const llena  = valor >= i;
        const media  = !llena && valor >= i - 0.5;
        return (
          <span key={i} style={{
            fontSize: 18,
            color: llena || media ? "#C9A84C" : "#e0e0e0",
          }}>
            {llena ? "★" : media ? "⯨" : "☆"}
          </span>
        );
      })}
      <span style={{ fontSize: 13, color: "#888", marginLeft: 4 }}>
        ({valor > 0 ? valor.toFixed(1) : "0.0"})
      </span>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────
export default function Perfil() {
  // Datos del perfil cargados desde el backend
  const [perfil, setPerfil] = useState(null);

  // Estado de carga y error
  const [cargando, setCargando]   = useState(true);
  const [error, setError]         = useState("");

  // Controla si se muestra el formulario de editar carrera
  const [editandoCarrera, setEditandoCarrera] = useState(false);
  const [nuevaCarrera, setNuevaCarrera]       = useState("");
  const [guardando, setGuardando]             = useState(false);
  const [mensajeOk, setMensajeOk]             = useState("");

  // URL base del backend
  const API_URL = "http://localhost:3001/api";

  // Mapa de carreras para mostrar nombre legible
  const nombresCarrera = {
    ingenieria_sistemas : "Ingeniería de Sistemas",
    administracion      : "Administración de Empresas",
    derecho             : "Derecho",
    medicina            : "Medicina",
    psicologia          : "Psicología",
    comunicacion        : "Comunicación Social",
    mercadeo            : "Mercadeo y Negocios Internacionales",
    educacion           : "Educación",
    otra                : "Otra",
  };

  // ── PROF-01: Cargamos el perfil al montar el componente ────
  useEffect(() => {
    const cargarPerfil = async () => {
      // Leemos el usuario guardado en localStorage tras el login
      const usuarioGuardado = localStorage.getItem("usuario");

      if (!usuarioGuardado) {
        // Si no hay sesión, redirigimos al login
        window.location.href = "/login";
        return;
      }

      const usuario = JSON.parse(usuarioGuardado);

      try {
        const respuesta = await fetch(`${API_URL}/users/${usuario.id}`);
        const datos     = await respuesta.json();

        if (!respuesta.ok) {
          setError(datos.error || "No se pudo cargar el perfil");
          return;
        }

        setPerfil(datos);
        setNuevaCarrera(datos.carrera || "");

      } catch {
        setError("No se pudo conectar al servidor");
      } finally {
        setCargando(false);
      }
    };

    cargarPerfil();
  }, []);

  // ── PROF-02: Guardar nueva carrera ─────────────────────────
  const handleGuardarCarrera = async () => {
    if (!nuevaCarrera) return;
    setGuardando(true);
    setMensajeOk("");

    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const token   = localStorage.getItem("token");

    try {
      const respuesta = await fetch(`${API_URL}/users/${usuario.id}/career`, {
        method  : "PATCH",
        headers : {
          "Content-Type"  : "application/json",
          "Authorization" : `Bearer ${token}`, // AUTH-06: enviamos el token
        },
        body: JSON.stringify({ career: nuevaCarrera }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(datos.error || "Error al actualizar la carrera");
        return;
      }

      // Actualizamos el perfil en pantalla sin recargar
      setPerfil((prev) => ({ ...prev, carrera: nuevaCarrera }));
      setEditandoCarrera(false);
      setMensajeOk("¡Carrera actualizada correctamente!");
      setTimeout(() => setMensajeOk(""), 3000);

    } catch {
      setError("No se pudo conectar al servidor");
    } finally {
      setGuardando(false);
    }
  };

  // ── PROF-06: Cierre de sesión ───────────────────────────────
  const handleLogout = () => {
    // Eliminamos el token y datos del usuario del localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    // Redirigimos al login
    window.location.href = "/login";
  };

  // ── Estados de carga y error ────────────────────────────────
  if (cargando) {
    return (
      <div style={estilos.centrado}>
        <div style={estilos.spinner} />
        <p style={{ color: "#888", marginTop: 16, fontFamily: "Source Sans 3, sans-serif" }}>
          Cargando perfil...
        </p>
      </div>
    );
  }

  if (error && !perfil) {
    return (
      <div style={estilos.centrado}>
        <p style={{ color: "#e53e3e", fontFamily: "Source Sans 3, sans-serif" }}>{error}</p>
      </div>
    );
  }

  const reputacion = perfil?.reputacion || 0;
  const etiqueta   = etiquetaReputacion(reputacion);

  // ── RENDER PRINCIPAL ────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Source+Sans+3:wght@300;400;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #f0f4f8;
          font-family: 'Source Sans 3', sans-serif;
        }

        /* ── Navbar ── */
        .prof-navbar {
          background: #002D72;
          padding: 0 32px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .prof-navbar-brand {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          color: white;
          font-size: 20px;
          font-weight: 400;
        }

        .prof-navbar-brand span { color: #C9A84C; }

        /* PROF-06: Botón de logout en la navbar */
        .prof-btn-logout {
          background: none;
          border: 1px solid rgba(255,255,255,0.3);
          color: rgba(255,255,255,0.85);
          padding: 7px 16px;
          border-radius: 4px;
          font-size: 13px;
          font-family: 'Source Sans 3', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .prof-btn-logout:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.6);
        }

        /* ── Layout principal ── */
        .prof-layout {
          max-width: 900px;
          margin: 36px auto;
          padding: 0 20px;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 24px;
        }

        @media (max-width: 700px) {
          .prof-layout { grid-template-columns: 1fr; }
        }

        /* ── Tarjeta base ── */
        .prof-card {
          background: white;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.07);
          padding: 28px;
        }

        /* ── Avatar ── */
        .prof-avatar {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background: #002D72;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Playfair Display', serif;
          font-size: 36px;
          color: white;
          font-style: italic;
          margin: 0 auto 16px;
          overflow: hidden;
          border: 3px solid #C9A84C;
        }

        .prof-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .prof-nombre {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          color: #002D72;
          text-align: center;
          font-weight: 600;
        }

        .prof-email {
          font-size: 12px;
          color: #aaa;
          text-align: center;
          margin-top: 4px;
        }

        /* Badge vendedor */
        .prof-badge {
          display: inline-block;
          background: #002D72;
          color: white;
          font-size: 11px;
          padding: 3px 10px;
          border-radius: 20px;
          margin: 10px auto 0;
          letter-spacing: 0.5px;
        }

        .prof-badge.comprador {
          background: #e8eff7;
          color: #002D72;
        }

        .prof-divider {
          height: 1px;
          background: #f0f0f0;
          margin: 20px 0;
        }

        /* ── Sección de info ── */
        .prof-info-label {
          font-size: 11px;
          font-weight: 600;
          color: #aaa;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .prof-info-value {
          font-size: 15px;
          color: #333;
        }

        .prof-info-row {
          margin-bottom: 16px;
        }

        /* ── Botón editar ── */
        .prof-btn-editar {
          background: none;
          border: 1.5px solid #002D72;
          color: #002D72;
          padding: 6px 14px;
          border-radius: 4px;
          font-size: 12px;
          font-family: 'Source Sans 3', sans-serif;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 6px;
        }

        .prof-btn-editar:hover {
          background: #002D72;
          color: white;
        }

        /* ── Botón guardar ── */
        .prof-btn-guardar {
          background: #002D72;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 13px;
          font-family: 'Source Sans 3', sans-serif;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
          margin-right: 8px;
        }

        .prof-btn-guardar:hover { background: #001a4d; }
        .prof-btn-guardar:disabled { opacity: 0.6; cursor: not-allowed; }

        .prof-btn-cancelar {
          background: none;
          border: none;
          color: #aaa;
          font-size: 13px;
          cursor: pointer;
          font-family: 'Source Sans 3', sans-serif;
        }

        .prof-btn-cancelar:hover { color: #555; }

        /* ── Select de carrera ── */
        .prof-select {
          width: 100%;
          border: 1.5px solid #002D72;
          border-radius: 4px;
          padding: 9px 12px;
          font-size: 14px;
          color: #333;
          font-family: 'Source Sans 3', sans-serif;
          outline: none;
          margin-bottom: 10px;
          background: white;
          appearance: none;
        }

        /* ── Sección de reputación PROF-05 ── */
        .prof-reputacion-card {
          background: white;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.07);
          padding: 28px;
          margin-bottom: 24px;
        }

        .prof-section-title {
          font-family: 'Playfair Display', serif;
          font-size: 17px;
          color: #002D72;
          margin-bottom: 18px;
          font-style: italic;
        }

        /* ── Mensaje de éxito ── */
        .prof-msg-ok {
          background: #f0fff4;
          border: 1px solid #c6f6d5;
          color: #276749;
          padding: 10px 14px;
          border-radius: 4px;
          font-size: 13px;
          margin-bottom: 16px;
        }

        /* ── Spinner ── */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* ── NAVBAR ─────────────────────────────── */}
      <nav className="prof-navbar">
        <div className="prof-navbar-brand">
          Sabana<span>Market</span>
        </div>

        {/* PROF-06: Botón de logout */}
        <button className="prof-btn-logout" onClick={handleLogout}>
          ← Cerrar sesión
        </button>
      </nav>

      {/* ── LAYOUT ─────────────────────────────── */}
      <div className="prof-layout">

        {/* ── COLUMNA IZQUIERDA: datos del usuario ── */}
        <div>
          <div className="prof-card" style={{ textAlign: "center" }}>

            {/* Avatar con inicial o foto */}
            <div className="prof-avatar">
              {perfil?.foto_url
                ? <img src={perfil.foto_url} alt="Foto de perfil" />
                : perfil?.nombre?.charAt(0).toUpperCase()
              }
            </div>

            <div className="prof-nombre">{perfil?.nombre}</div>
            <div className="prof-email">{perfil?.email}</div>

            {/* Badge de rol */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <span className={`prof-badge ${perfil?.is_vendedor ? "" : "comprador"}`}>
                {perfil?.is_vendedor ? "⭐ Vendedor" : "Comprador"}
              </span>
            </div>

            <div className="prof-divider" />

            {/* Fecha de registro */}
            <div className="prof-info-row">
              <div className="prof-info-label">Miembro desde</div>
              <div className="prof-info-value">
                {perfil?.created_at
                  ? new Date(perfil.created_at).toLocaleDateString("es-CO", {
                      year: "month", month: "long", day: "numeric"
                    })
                  : "—"}
              </div>
            </div>

            {/* Carrera — con opción de editar (PROF-02) */}
            <div className="prof-info-row">
              <div className="prof-info-label">Carrera</div>

              {editandoCarrera ? (
                <>
                  <select
                    className="prof-select"
                    value={nuevaCarrera}
                    onChange={(e) => setNuevaCarrera(e.target.value)}
                  >
                    <option value="">Selecciona tu carrera</option>
                    {Object.entries(nombresCarrera).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  <div>
                    <button
                      className="prof-btn-guardar"
                      onClick={handleGuardarCarrera}
                      disabled={guardando}
                    >
                      {guardando ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      className="prof-btn-cancelar"
                      onClick={() => setEditandoCarrera(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="prof-info-value">
                    {nombresCarrera[perfil?.carrera] || "No especificada"}
                  </div>
                  <button
                    className="prof-btn-editar"
                    onClick={() => setEditandoCarrera(true)}
                  >
                    ✎ Editar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── COLUMNA DERECHA: reputación y actividad ── */}
        <div>

          {/* Mensaje de éxito al guardar carrera */}
          {mensajeOk && <div className="prof-msg-ok">✓ {mensajeOk}</div>}

          {/* PROF-05: Sección de reputación */}
          <div className="prof-reputacion-card">
            <div className="prof-section-title">Reputación como vendedor</div>

            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              {/* Número grande de reputación */}
              <div style={{ textAlign: "center" }}>
                <div style={{
                  fontSize: 52,
                  fontFamily: "Playfair Display, serif",
                  color: "#002D72",
                  fontWeight: 600,
                  lineHeight: 1,
                }}>
                  {reputacion > 0 ? reputacion.toFixed(1) : "—"}
                </div>
                <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>
                  de 5.0
                </div>
              </div>

              {/* Estrellas y etiqueta */}
              <div>
                <Estrellas valor={reputacion} />
                <div style={{
                  fontSize: 13,
                  color: etiqueta.color,
                  fontWeight: 600,
                  marginTop: 6,
                }}>
                  {etiqueta.texto}
                </div>
                {reputacion === 0 && (
                  <div style={{ fontSize: 12, color: "#bbb", marginTop: 4 }}>
                    Aún no tienes reseñas de compradores
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tarjeta de actividad rápida */}
          <div className="prof-card">
            <div className="prof-section-title">Mi actividad</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { label: "Productos publicados", valor: "—", icono: "📦" },
                { label: "Ventas realizadas",    valor: "—", icono: "✅" },
                { label: "Compras realizadas",   valor: "—", icono: "🛒" },
                { label: "Reseñas recibidas",    valor: "—", icono: "⭐" },
              ].map((item) => (
                <div key={item.label} style={{
                  background: "#f8f9fb",
                  borderRadius: 8,
                  padding: "16px 20px",
                  border: "1px solid #eee",
                }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{item.icono}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#002D72" }}>
                    {item.valor}
                  </div>
                  <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 12, color: "#ccc", marginTop: 16, textAlign: "center" }}>
              Los datos de actividad se cargarán con el módulo de Productos
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Estilos para estados de carga ────────────────────────────
const estilos = {
  centrado: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#f0f4f8",
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid #e0e0e0",
    borderTop: "3px solid #002D72",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};
