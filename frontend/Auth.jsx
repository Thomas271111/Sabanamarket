import { useState } from "react";

// ============================================================
// AUTH-01: Validación de dominio institucional
// Solo se permite el correo @unisabana.edu.co
// ============================================================
const esCorreoValido = (email) => email.endsWith("@unisabana.edu.co");

// ============================================================
// AUTH-02: Componente principal de Login / Registro
// Branding oficial Universidad de La Sabana
// Azul profundo #002D72, tipografía serif institucional
// ============================================================
export default function Auth() {
  const [modo, setModo] = useState("login"); // "login" | "registro"

  const [formRegistro, setFormRegistro] = useState({
    nombre: "",
    email: "",
    carrera: "",
    password: "",
    confirmarPassword: "",
  });

  const [formLogin, setFormLogin] = useState({
    email: "",
    password: "",
  });

  const [mensajes, setMensajes] = useState({});
  const [verPassword, setVerPassword] = useState(false);
  const [cargando, setCargando] = useState(false); // Controla el estado de carga del botón

  // ✅ URL base del backend — cámbiala si tu servidor corre en otro puerto
  const API_URL = "http://localhost:3001/api";

  // ----------------------------------------------------------------
  // Maneja los cambios en los campos del formulario de REGISTRO
  // ----------------------------------------------------------------
  const handleCambioRegistro = (e) => {
    const { name, value } = e.target;
    setFormRegistro((prev) => ({ ...prev, [name]: value }));

    // AUTH-01: Valida el correo en tiempo real
    if (name === "email") {
      if (value === "") {
        setMensajes((prev) => ({ ...prev, email: "" }));
      } else if (esCorreoValido(value)) {
        setMensajes((prev) => ({ ...prev, email: "ok" }));
      } else {
        setMensajes((prev) => ({ ...prev, email: "Solo se permiten correos @unisabana.edu.co" }));
      }
    }

    // Valida longitud mínima de contraseña (8 caracteres)
    if (name === "password") {
      if (value.length > 0 && value.length < 8) {
        setMensajes((prev) => ({ ...prev, password: "La contraseña debe tener al menos 8 caracteres" }));
      } else {
        setMensajes((prev) => ({ ...prev, password: "" }));
      }
    }

    if (name === "confirmarPassword" || name === "password") {
      const pass = name === "password" ? value : formRegistro.password;
      const confirm = name === "confirmarPassword" ? value : formRegistro.confirmarPassword;
      if (confirm && pass !== confirm) {
        setMensajes((prev) => ({ ...prev, confirmar: "Las contraseñas no coinciden" }));
      } else {
        setMensajes((prev) => ({ ...prev, confirmar: "" }));
      }
    }
  };

  const handleCambioLogin = (e) => {
    const { name, value } = e.target;
    setFormLogin((prev) => ({ ...prev, [name]: value }));
  };

  // ----------------------------------------------------------------
  // AUTH-04: Registro — llama al backend real
  // POST /api/auth/register
  // ----------------------------------------------------------------
  const handleRegistro = async (e) => {
    e.preventDefault();

    // Validaciones en el frontend antes de llamar al backend
    if (!esCorreoValido(formRegistro.email)) {
      setMensajes((prev) => ({ ...prev, email: "Solo se permiten correos @unisabana.edu.co" }));
      return;
    }
    if (formRegistro.password !== formRegistro.confirmarPassword) {
      setMensajes((prev) => ({ ...prev, confirmar: "Las contraseñas no coinciden" }));
      return;
    }
    if (!formRegistro.nombre || !formRegistro.password) {
      setMensajes({ general: "Por favor completa todos los campos obligatorios" });
      return;
    }
    if (formRegistro.password.length < 8) {
      setMensajes((prev) => ({ ...prev, password: "La contraseña debe tener al menos 8 caracteres" }));
      return;
    }

    // Activamos el estado de carga para deshabilitar el botón
    setCargando(true);
    setMensajes({});

    try {
      // Llamada real al backend (AUTH-04)
      const respuesta = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Le decimos al backend que mandamos JSON
        },
        body: JSON.stringify({
          nombre: formRegistro.nombre,
          email: formRegistro.email,
          password: formRegistro.password,
          carrera: formRegistro.carrera,
        }),
      });

      // Convertimos la respuesta a JSON
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        // El backend nos devolvió un error (ej: email ya existe → 409)
        setMensajes({ general: datos.error || "Error al registrarse" });
        return;
      }

      // ✅ Registro exitoso
      setMensajes({ exito: "¡Cuenta creada! Ya puedes iniciar sesión." });

      // Limpiamos el formulario y cambiamos al modo login después de 1.5s
      setTimeout(() => {
        setModo("login");
        setMensajes({});
        setFormRegistro({ nombre: "", email: "", carrera: "", password: "", confirmarPassword: "" });
      }, 1500);

    } catch (error) {
      // Error de red (ej: el backend no está corriendo)
      setMensajes({ general: "No se pudo conectar al servidor. ¿Está corriendo el backend?" });
    } finally {
      // Siempre desactivamos el estado de carga al terminar
      setCargando(false);
    }
  };

  // ----------------------------------------------------------------
  // AUTH-05: Login — llama al backend y guarda el token JWT
  // POST /api/auth/login
  // ----------------------------------------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!formLogin.email || !formLogin.password) {
      setMensajes({ general: "Por favor ingresa tu correo y contraseña" });
      return;
    }

    setCargando(true);
    setMensajes({});

    try {
      // Llamada real al backend (AUTH-05)
      const respuesta = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formLogin.email,
          password: formLogin.password,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        // Credenciales incorrectas u otro error del backend
        setMensajes({ general: datos.error || "Error al iniciar sesión" });
        return;
      }

      // ✅ Login exitoso — guardamos el token en localStorage (AUTH-06)
      // El token se usará en todas las peticiones a rutas protegidas
      localStorage.setItem("token", datos.token);

      // También guardamos datos básicos del usuario para mostrarlos en el perfil
      localStorage.setItem("usuario", JSON.stringify(datos.usuario));

      setMensajes({ exito: `¡Bienvenido, ${datos.usuario.nombre}!` });

      // Redirigir al home después de 1 segundo
      // Cuando tengas react-router: navigate("/home")
      setTimeout(() => {
        window.location.href = "/home";
      }, 1000);

    } catch (error) {
      setMensajes({ general: "No se pudo conectar al servidor. ¿Está corriendo el backend?" });
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&family=Source+Sans+3:wght@300;400;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .auth-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Source Sans 3', sans-serif;
          background-color: #f5f5f3;
        }

        .auth-panel-left {
          display: none;
          width: 52%;
          background-color: #002D72;
          position: relative;
          overflow: hidden;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
        }

        @media (min-width: 900px) {
          .auth-panel-left { display: flex; }
        }

        .auth-deco-circle {
          position: absolute;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
        }

        .auth-panel-left h2 {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 50px;
          font-weight: 400;
          color: #ffffff;
          line-height: 1.15;
          position: relative;
          z-index: 2;
          max-width: 400px;
        }

        .auth-panel-left h2 span { color: #C9A84C; }

        .auth-panel-left p {
          color: rgba(255,255,255,0.65);
          font-size: 15px;
          line-height: 1.7;
          position: relative;
          z-index: 2;
          max-width: 360px;
          margin-top: 18px;
        }

        .auth-tag {
          display: inline-block;
          border: 1px solid rgba(255,255,255,0.25);
          color: rgba(255,255,255,0.75);
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: 2px;
          margin-bottom: 16px;
          position: relative;
          z-index: 2;
        }

        .auth-panel-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 44px;
          background: #ffffff;
          overflow-y: auto;
        }

        .auth-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 32px;
        }

        .auth-logo-icon {
          width: 38px;
          height: 38px;
          background-color: #002D72;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 18px;
          color: white;
          font-weight: 600;
          flex-shrink: 0;
        }

        .auth-logo-name {
          font-family: 'Playfair Display', serif;
          font-size: 14px;
          color: #002D72;
          font-weight: 600;
          line-height: 1.2;
        }

        .auth-logo-sub {
          font-family: 'Source Sans 3', sans-serif;
          font-size: 11px;
          color: #999;
          font-weight: 300;
        }

        .auth-title {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-style: italic;
          color: #002D72;
          font-weight: 400;
          margin-bottom: 4px;
        }

        .auth-subtitle {
          font-size: 14px;
          color: #999;
          margin-bottom: 24px;
        }

        .auth-tabs {
          display: flex;
          border-bottom: 2px solid #ebebeb;
          margin-bottom: 24px;
        }

        .auth-tab {
          background: none;
          border: none;
          padding: 8px 0;
          margin-right: 24px;
          font-size: 14px;
          font-weight: 600;
          color: #bbb;
          cursor: pointer;
          position: relative;
          transition: color 0.2s;
          font-family: 'Source Sans 3', sans-serif;
        }

        .auth-tab.active { color: #002D72; }

        .auth-tab.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0; right: 0;
          height: 2px;
          background: #002D72;
        }

        .auth-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: #666;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .auth-input {
          width: 100%;
          border: 1.5px solid #e0e0e0;
          border-radius: 4px;
          padding: 11px 14px;
          font-size: 14px;
          color: #1a1a1a;
          font-family: 'Source Sans 3', sans-serif;
          transition: border-color 0.2s, background 0.2s;
          outline: none;
          background: #fafafa;
        }

        .auth-input:focus { border-color: #002D72; background: #fff; }
        .auth-input.error { border-color: #e53e3e; background: #fff5f5; }
        .auth-input.success { border-color: #38a169; background: #f0fff4; }

        .auth-field { margin-bottom: 16px; }

        .auth-msg-error { font-size: 12px; color: #e53e3e; margin-top: 4px; }
        .auth-msg-ok { font-size: 12px; color: #38a169; margin-top: 4px; }

        .auth-msg-banner {
          padding: 11px 16px;
          border-radius: 4px;
          font-size: 13px;
          margin-bottom: 18px;
          text-align: center;
        }
        .auth-msg-banner.exito { background: #f0fff4; border: 1px solid #c6f6d5; color: #276749; }
        .auth-msg-banner.error-gen { background: #fff5f5; border: 1px solid #fed7d7; color: #c53030; }

        .auth-btn-primary {
          width: 100%;
          background-color: #002D72;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 13px;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: background-color 0.2s;
          font-family: 'Source Sans 3', sans-serif;
          margin-top: 4px;
        }

        .auth-btn-primary:hover { background-color: #001a4d; }

        .auth-btn-gold {
          width: 100%;
          background-color: #C9A84C;
          color: #002D72;
          border: none;
          border-radius: 4px;
          padding: 13px;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: background-color 0.2s;
          font-family: 'Source Sans 3', sans-serif;
          margin-top: 4px;
        }

        .auth-btn-gold:hover { background-color: #b8943f; }

        .auth-link-switch {
          text-align: center;
          font-size: 13px;
          color: #999;
          margin-top: 16px;
        }

        .auth-link-switch button {
          background: none;
          border: none;
          color: #002D72;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Source Sans 3', sans-serif;
          font-size: 13px;
        }

        .auth-link-switch button:hover { text-decoration: underline; }

        .auth-input-wrap { position: relative; }

        .auth-toggle-pass {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 11px;
          color: #aaa;
          cursor: pointer;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          font-family: 'Source Sans 3', sans-serif;
        }

        .auth-toggle-pass:hover { color: #002D72; }

        .auth-select {
          width: 100%;
          border: 1.5px solid #e0e0e0;
          border-radius: 4px;
          padding: 11px 14px;
          font-size: 14px;
          color: #1a1a1a;
          font-family: 'Source Sans 3', sans-serif;
          background: #fafafa;
          outline: none;
          transition: border-color 0.2s;
          appearance: none;
          cursor: pointer;
        }

        .auth-select:focus { border-color: #002D72; background: #fff; }

        .auth-select-wrap { position: relative; }
        .auth-select-arrow {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #aaa;
          pointer-events: none;
          font-size: 12px;
        }

        .auth-footer-note {
          font-size: 11px;
          color: #ccc;
          text-align: center;
          margin-top: 24px;
          line-height: 1.7;
        }

        .auth-stats {
          display: flex;
          gap: 36px;
          position: relative;
          z-index: 2;
        }

        .auth-stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 26px;
          color: #C9A84C;
          font-weight: 600;
        }

        .auth-stat-label {
          font-size: 12px;
          color: rgba(255,255,255,0.55);
          margin-top: 2px;
        }
      `}</style>

      <div className="auth-root">

        {/* ===================== */}
        {/* PANEL IZQUIERDO       */}
        {/* ===================== */}
        <div className="auth-panel-left">
          <div className="auth-deco-circle" style={{ width: 520, height: 520, top: -160, right: -220 }} />
          <div className="auth-deco-circle" style={{ width: 280, height: 280, bottom: -80, left: -70 }} />
          <div className="auth-deco-circle" style={{ width: 120, height: 120, top: "42%", left: "8%" }} />

          {/* Logo arriba izquierda */}
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 64 }}>
              <div style={{
                width: 34, height: 34, background: "white", borderRadius: 4,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                <span style={{ color: "#002D72", fontFamily: "Playfair Display, serif", fontStyle: "italic", fontSize: 17, fontWeight: 700 }}>U</span>
              </div>
              <div>
                <div style={{ color: "white", fontSize: 13, fontFamily: "Playfair Display, serif", fontWeight: 600, lineHeight: 1.2 }}>
                  Universidad de La Sabana
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>Marketplace estudiantil</div>
              </div>
            </div>

            <span className="auth-tag">Plataforma institucional</span>
            <h2>
              Compra y vende<br />
              dentro de tu<br />
              <span>comunidad</span>
            </h2>
            <p>
              Un espacio seguro y exclusivo para estudiantes de La Sabana.
              Libros, tecnología, apuntes y mucho más de tus propios compañeros.
            </p>
          </div>

          {/* Stats abajo */}
          <div className="auth-stats">
            {[
              { num: "500+", label: "Estudiantes" },
              { num: "1.2K", label: "Productos" },
              { num: "98%", label: "Satisfacción" },
            ].map((s) => (
              <div key={s.label}>
                <div className="auth-stat-num">{s.num}</div>
                <div className="auth-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ===================== */}
        {/* PANEL DERECHO         */}
        {/* ===================== */}
        <div className="auth-panel-right">
          <div style={{ maxWidth: 400, width: "100%", margin: "0 auto" }}>

            {/* Logo mobile */}
            <div className="auth-logo">
              <div className="auth-logo-icon">S</div>
              <div>
                <div className="auth-logo-name">SabanaMarket</div>
                <div className="auth-logo-sub">Universidad de La Sabana</div>
              </div>
            </div>

            <h1 className="auth-title">
              {modo === "login" ? "Bienvenido de vuelta" : "Crea tu cuenta"}
            </h1>
            <p className="auth-subtitle">
              {modo === "login"
                ? "Ingresa con tu correo institucional"
                : "Solo para estudiantes de La Sabana"}
            </p>

            {/* Tabs */}
            <div className="auth-tabs">
              <button
                className={`auth-tab ${modo === "login" ? "active" : ""}`}
                onClick={() => { setModo("login"); setMensajes({}); }}
              >
                Iniciar Sesión
              </button>
              <button
                className={`auth-tab ${modo === "registro" ? "active" : ""}`}
                onClick={() => { setModo("registro"); setMensajes({}); }}
              >
                Registrarse
              </button>
            </div>

            {/* Mensajes globales */}
            {mensajes.exito && (
              <div className="auth-msg-banner exito">✓ {mensajes.exito}</div>
            )}
            {mensajes.general && (
              <div className="auth-msg-banner error-gen">{mensajes.general}</div>
            )}

            {/* ==================== */}
            {/* FORMULARIO LOGIN     */}
            {/* ==================== */}
            {modo === "login" && (
              <form onSubmit={handleLogin}>
                <div className="auth-field">
                  <label className="auth-label">Correo institucional</label>
                  <input
                    type="email"
                    name="email"
                    value={formLogin.email}
                    onChange={handleCambioLogin}
                    placeholder="nombre.apellido@unisabana.edu.co"
                    className="auth-input"
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label">Contraseña</label>
                  <div className="auth-input-wrap">
                    <input
                      type={verPassword ? "text" : "password"}
                      name="password"
                      value={formLogin.password}
                      onChange={handleCambioLogin}
                      placeholder="••••••••"
                      className="auth-input"
                      style={{ paddingRight: 60 }}
                    />
                    <button
                      type="button"
                      className="auth-toggle-pass"
                      onClick={() => setVerPassword(!verPassword)}
                    >
                      {verPassword ? "Ocultar" : "Ver"}
                    </button>
                  </div>
                </div>

                <button type="submit" className="auth-btn-primary" disabled={cargando}>
                  {cargando ? "Ingresando..." : "Ingresar →"}
                </button>

                <div className="auth-link-switch">
                  ¿No tienes cuenta?{" "}
                  <button type="button" onClick={() => setModo("registro")}>
                    Regístrate aquí
                  </button>
                </div>
              </form>
            )}

            {/* ====================== */}
            {/* FORMULARIO REGISTRO   */}
            {/* ====================== */}
            {modo === "registro" && (
              <form onSubmit={handleRegistro}>
                <div className="auth-field">
                  <label className="auth-label">Nombre completo *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formRegistro.nombre}
                    onChange={handleCambioRegistro}
                    placeholder="Ej: Juan Pérez"
                    className="auth-input"
                  />
                </div>

                {/* AUTH-01: Validación correo institucional en tiempo real */}
                <div className="auth-field">
                  <label className="auth-label">Correo institucional *</label>
                  <input
                    type="email"
                    name="email"
                    value={formRegistro.email}
                    onChange={handleCambioRegistro}
                    placeholder="nombre.apellido@unisabana.edu.co"
                    className={`auth-input ${
                      mensajes.email === "ok" ? "success" : mensajes.email ? "error" : ""
                    }`}
                  />
                  {mensajes.email === "ok" && (
                    <p className="auth-msg-ok">✓ Correo institucional válido</p>
                  )}
                  {mensajes.email && mensajes.email !== "ok" && (
                    <p className="auth-msg-error">{mensajes.email}</p>
                  )}
                </div>

                {/* Carrera opcional — PROF-02 */}
                <div className="auth-field">
                  <label className="auth-label">
                    Carrera{" "}
                    <span style={{ color: "#bbb", textTransform: "none", fontWeight: 400, fontSize: 11 }}>
                      (opcional)
                    </span>
                  </label>
                  <div className="auth-select-wrap">
                    <select
                      name="carrera"
                      value={formRegistro.carrera}
                      onChange={handleCambioRegistro}
                      className="auth-select"
                    >
                      <option value="">Selecciona tu carrera</option>
                      <option value="ingenieria_sistemas">Ingeniería de Sistemas</option>
                      <option value="administracion">Administración de Empresas</option>
                      <option value="derecho">Derecho</option>
                      <option value="medicina">Medicina</option>
                      <option value="psicologia">Psicología</option>
                      <option value="comunicacion">Comunicación Social</option>
                      <option value="mercadeo">Mercadeo y Negocios Internacionales</option>
                      <option value="educacion">Educación</option>
                      <option value="otra">Otra</option>
                    </select>
                    <span className="auth-select-arrow">▾</span>
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label">Contraseña *</label>
                  <div className="auth-input-wrap">
                    <input
                      type={verPassword ? "text" : "password"}
                      name="password"
                      value={formRegistro.password}
                      onChange={handleCambioRegistro}
                      placeholder="Mínimo 8 caracteres"
                      className={`auth-input ${mensajes.password ? "error" : formRegistro.password.length >= 8 ? "success" : ""}`}
                      style={{ paddingRight: 60 }}
                    />
                    <button
                      type="button"
                      className="auth-toggle-pass"
                      onClick={() => setVerPassword(!verPassword)}
                    >
                      {verPassword ? "Ocultar" : "Ver"}
                    </button>
                  </div>
                  {/* Mensaje de error si la contraseña es muy corta */}
                  {mensajes.password && (
                    <div style={{
                      marginTop: 8,
                      padding: "8px 12px",
                      background: "#fff5f5",
                      border: "1px solid #fed7d7",
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}>
                      <span style={{ color: "#e53e3e", fontSize: 14 }}>✕</span>
                      <p style={{ fontSize: 12, color: "#c53030", margin: 0 }}>{mensajes.password}</p>
                    </div>
                  )}
                  {/* Indicador visual de longitud */}
                  {formRegistro.password.length > 0 && (
                    <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
                      {[...Array(4)].map((_, i) => {
                        // Colorea las barras según la longitud
                        const longitud = formRegistro.password.length;
                        let color = "#e0e0e0";
                        if (longitud >= 4 && i === 0) color = "#e53e3e";        // Muy débil
                        if (longitud >= 6 && i <= 1) color = "#dd6b20";         // Débil
                        if (longitud >= 8 && i <= 2) color = "#C9A84C";         // Aceptable
                        if (longitud >= 12 && i <= 3) color = "#38a169";        // Fuerte
                        return (
                          <div key={i} style={{
                            flex: 1, height: 4, borderRadius: 2,
                            background: color,
                            transition: "background 0.3s"
                          }} />
                        );
                      })}
                    </div>
                  )}
                  {formRegistro.password.length > 0 && (
                    <p style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>
                      {formRegistro.password.length < 6 && "Muy débil"}
                      {formRegistro.password.length >= 6 && formRegistro.password.length < 8 && "Débil — agrega más caracteres"}
                      {formRegistro.password.length >= 8 && formRegistro.password.length < 12 && "✓ Contraseña aceptable"}
                      {formRegistro.password.length >= 12 && "✓ Contraseña fuerte"}
                    </p>
                  )}
                </div>

                <div className="auth-field">
                  <label className="auth-label">Confirmar contraseña *</label>
                  <input
                    type={verPassword ? "text" : "password"}
                    name="confirmarPassword"
                    value={formRegistro.confirmarPassword}
                    onChange={handleCambioRegistro}
                    placeholder="Repite tu contraseña"
                    className={`auth-input ${mensajes.confirmar ? "error" : ""}`}
                  />
                  {mensajes.confirmar && (
                    <p className="auth-msg-error">{mensajes.confirmar}</p>
                  )}
                </div>

                <button type="submit" className="auth-btn-gold" disabled={cargando}>
                  {cargando ? "Creando cuenta..." : "Crear cuenta"}
                </button>

                <div className="auth-link-switch">
                  ¿Ya tienes cuenta?{" "}
                  <button type="button" onClick={() => setModo("login")}>
                    Inicia sesión
                  </button>
                </div>
              </form>
            )}

            <div className="auth-footer-note">
              Plataforma exclusiva para la comunidad universitaria de La Sabana.<br />
              Al registrarte aceptas los términos y condiciones institucionales.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
