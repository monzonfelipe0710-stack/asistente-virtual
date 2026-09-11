import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/common/Toast";
import ChatBotAvatar from "../components/ChatBotAvatar";
import { Kicker, DisplayTitle, Lead } from "../components/common/editorial";
import { employeeDepartments } from "../data/mockEmployeeApprovals";
import Footer from "../components/common/Footer";
import { getGoogleClientId, saveGoogleClientId, startGoogleOAuth } from "../lib/googleAuth";

export default function LoginRegisterPage() {
  const { login, loginWithGoogle, register, requestPasswordReset } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Solicitud de empleado
  const [wantsEmployee, setWantsEmployee] = useState(false);
  const [cuil, setCuil] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [reason, setReason] = useState("");

  // Estado de carga y recuperación
  const [submitting, setSubmitting] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const [recoveryLink, setRecoveryLink] = useState("");
  const [recoveryEmailed, setRecoveryEmailed] = useState(false);
  const [recoveryWarning, setRecoveryWarning] = useState("");

  // Google OAuth Config y Modal
  const [googleClientId, setGoogleClientIdState] = useState(() => getGoogleClientId());
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [inputClientId, setInputClientId] = useState(() => getGoogleClientId());
  const [showClientIdInput, setShowClientIdInput] = useState(false);

  const from = location.state?.from?.pathname || "/";
  const isLogin = mode === "login";

  // Cuentas de demostración de Google para prueba inmediata
  const DEMO_GOOGLE_ACCOUNTS = [
    {
      name: "Juan Carlos Pérez",
      email: "juan.perez@gmail.com",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
    },
    {
      name: "María Elena Gómez",
      email: "m.gomez@gmail.com",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
    },
  ];

  // Disparador principal del botón "Continue with Google"
  function handleContinueWithGoogle() {
    const activeClientId = googleClientId || getGoogleClientId();

    if (activeClientId && activeClientId.trim()) {
      // Flujo real con ventana emergente de Google
      setSubmitting(true);
      startGoogleOAuth({
        clientId: activeClientId.trim(),
        onSuccess: async (googleProfile) => {
          try {
            await loginWithGoogle(googleProfile);
            toast(`¡Bienvenido/a, ${googleProfile.name}! Sesión iniciada con Google.`, "success");
            navigate(from, { replace: true });
          } catch (err) {
            toast(err.message || "Error al registrar la sesión con Google.", "error");
          } finally {
            setSubmitting(false);
          }
        },
        onError: (err) => {
          setSubmitting(false);
          toast(err.message || "No se pudo completar la autenticación con Google.", "error");
          // Si el Client ID falla, abre el modal de configuración para que pueda ajustarlo
          setShowGoogleModal(true);
        },
      });
    } else {
      // Si aún no está configurado el Client ID en .env ni en localStorage,
      // abre el asistente interactivo de Google para configurarlo o probarlo al instante
      setShowGoogleModal(true);
    }
  }

  // Guardar nuevo Client ID en vivo
  function handleSaveClientId(e) {
    e.preventDefault();
    if (!inputClientId.trim()) {
      toast("Ingresá un Google Client ID válido.", "error");
      return;
    }
    saveGoogleClientId(inputClientId.trim());
    setGoogleClientIdState(inputClientId.trim());
    toast("Google Client ID guardado con éxito.", "success");
    setShowGoogleModal(false);
    // Ejecuta de inmediato la ventana real de Google
    setTimeout(() => {
      handleContinueWithGoogle();
    }, 200);
  }

  // Acceso rápido con cuenta de prueba
  async function handleDemoGoogleSelect(account) {
    setSubmitting(true);
    try {
      await loginWithGoogle(account);
      setShowGoogleModal(false);
      toast(`¡Bienvenido/a, ${account.name}! Acceso con Google confirmado.`, "success");
      navigate(from, { replace: true });
    } catch (err) {
      toast(err.message || "Error al conectar con Google.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  // Envío de formulario estándar (Email + Contraseña)
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
        toast("¡Bienvenido/a de nuevo!", "success");
      } else {
        await register({
          name,
          email,
          password,
          requestsEmployeeAccess: wantsEmployee,
          cuil,
          phone,
          department,
          position,
          reason,
        });
        toast(
          wantsEmployee
            ? "¡Solicitud enviada! Un Superadmin revisará tus datos para el panel interno."
            : "¡Cuenta creada con éxito!",
          "success"
        );
      }
      navigate(from, { replace: true });
    } catch (err) {
      toast(err.message || "Ocurrió un error.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function openRecovery() {
    setRecoverySent(false);
    setRecoveryLink("");
    setRecoveryEmailed(false);
    setRecoveryWarning("");
    setRecovery(true);
  }

  async function handleRecovery(e) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast("Ingresá un correo electrónico válido.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const result = await requestPasswordReset(email);
      setRecoveryLink(result?.link || "");
      setRecoveryEmailed(Boolean(result?.emailed));
      setRecoveryWarning(result?.emailError || "");
      setRecoverySent(true);
      if (result?.emailed) {
        toast("¡Correo de recuperación enviado con éxito por EmailJS!", "success");
      } else if (result?.emailError) {
        toast("Aviso de EmailJS: " + result.emailError, "warning");
      }
    } catch (err) {
      toast(err.message || "Ocurrió un error al procesar la solicitud.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyRecoveryLink() {
    if (!recoveryLink) return;
    try {
      await navigator.clipboard.writeText(recoveryLink);
      toast("Enlace de recuperación copiado al portapapeles.", "success");
    } catch {
      toast("No se pudo copiar automáticamente. Copialo manualmente.", "error");
    }
  }

  return (
    <div className="min-h-[100svh] flex flex-col justify-between bg-paper font-sans">
      {/* Grilla Principal: 
          - Izquierda: Decoración editorial previa + Fotografía de Montañas
          - Derecha: Formulario implementando exactamente la foto del usuario con Google Auth
      */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        {/* 1. Columna Izquierda: Decoración Editorial Previa + Fotografía de Montañas */}
        <div className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-line bg-mist/50 dark:bg-slate-900/40 p-12 xl:p-16 select-none">
          {/* Cabecera institucional */}
          <div className="relative z-10 flex items-start justify-between">
            <span className="inline-flex items-center gap-3">
              <span
                className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-deep text-paper shadow-md"
                aria-hidden="true"
              >
                <ChatBotAvatar size={26} />
              </span>
              <span className="text-lg font-extrabold tracking-tight text-ink uppercase">
                ChatAP
              </span>
            </span>
            <Kicker className="text-right">Acceso ciudadano</Kicker>
          </div>

          {/* Bloque editorial principal */}
          <div className="relative z-10 my-8">
            <DisplayTitle as={1} className="max-w-xl">
              HABLÁ CON EL ESTADO.
            </DisplayTitle>
            <Lead className="max-w-md mt-6">
              Entrá para seguir tus conversaciones, consultar tus trámites y recibir tus
              documentos. Todo en Formosa. Todo en línea.
            </Lead>
          </div>

          {/* Marco escénico con la fotografía de paisaje montañoso */}
          <div className="relative z-10 w-full overflow-hidden rounded-2xl border border-line bg-card shadow-lg group">
            <div className="aspect-[21/10] w-full overflow-hidden relative">
              <img
                src="/assets/auth-landscape.jpg"
                alt="Paisaje montañoso en niebla - Gobierno de Formosa"
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white">
                <span className="font-semibold tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Subsecretaría de Recursos Humanos
                </span>
                <span className="text-[11px] text-white/80">Gobierno de Formosa</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Columna Derecha: Formulario implementando la estructura de la foto */}
        <div className="flex flex-col justify-between px-6 sm:px-12 xl:px-20 py-10 lg:py-14 bg-paper dark:bg-[#09090b] text-ink dark:text-slate-100">
          {/* Barra superior con navegación de retorno y toggle de modo */}
          <div className="flex items-center justify-between w-full max-w-md mx-auto">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-medium text-muted hover:text-ink transition-colors no-underline group"
            >
              <svg
                className="w-4 h-4 transition-transform group-hover:-translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver al inicio
            </Link>

            {/* Alternador de pestañas */}
            <div className="flex items-center gap-1 p-0.5 rounded-full bg-mist dark:bg-neutral-900 border border-line dark:border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setRecovery(false);
                }}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  isLogin && !recovery
                    ? "bg-brand-deep text-white dark:bg-white dark:text-black font-semibold shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setRecovery(false);
                }}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  !isLogin && !recovery
                    ? "bg-brand-deep text-white dark:bg-white dark:text-black font-semibold shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                Registrarme
              </button>
            </div>
          </div>

          {/* Tarjeta Central del Formulario */}
          <div className="w-full max-w-md mx-auto my-auto py-6">
            {/* Logo en móvil */}
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-deep text-white">
                <ChatBotAvatar size={22} />
              </span>
              <span className="text-base font-bold tracking-tight uppercase">
                ChatAP · Formosa
              </span>
            </div>

            {/* Encabezado del Formulario (con la tipografía y textos de la foto) */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink dark:text-white m-0">
                {recovery
                  ? "Recuperá tu contraseña"
                  : isLogin
                  ? "Sign in to your account"
                  : "Create your account"}
              </h1>
              <p className="text-xs sm:text-sm text-muted m-0 mt-1.5">
                {recovery
                  ? "Ingresá tu correo para recibir un enlace de restablecimiento seguro."
                  : isLogin
                  ? "Ingresá a tu cuenta para continuar tus trámites y consultas."
                  : "Creá tu cuenta ciudadana para gestionar expedientes y formularios."}
              </p>
            </div>

            {recovery ? (
              /* Flujo de Recuperación */
              <div className="space-y-4">
                {!recoverySent ? (
                  <form onSubmit={handleRecovery} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                        Email address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tucorreo@ejemplo.com"
                        className="w-full px-4 py-3 rounded-xl border border-line bg-card text-sm text-ink placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 rounded-full bg-brand-deep text-white dark:bg-white dark:text-black font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? "Enviando enlace..." : "Enviar enlace de recuperación"}
                    </button>
                  </form>
                ) : (
                  <div className="p-5 rounded-2xl border border-line bg-mist/50 dark:bg-slate-900/60 text-center space-y-4">
                    <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 grid place-items-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-ink dark:text-white m-0">
                        {recoveryEmailed
                          ? "¡Correo enviado con EmailJS!"
                          : "Enlace de recuperación generado"}
                      </h3>
                      <p className="text-xs text-muted m-0 leading-relaxed">
                        {recoveryEmailed ? (
                          <>
                            Enviamos el enlace a{" "}
                            <strong className="text-ink dark:text-white">{email}</strong>.
                            Revisá tu bandeja de entrada o spam para continuar.
                          </>
                        ) : (
                          <>
                            El enlace de restablecimiento para{" "}
                            <strong className="text-ink dark:text-white">{email}</strong> está
                            listo para ser utilizado.
                          </>
                        )}
                      </p>
                    </div>

                    {recoveryWarning && (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-600 dark:text-amber-400">
                        Aviso del servicio: {recoveryWarning}
                      </div>
                    )}

                    {recoveryLink && (
                      <div className="space-y-2 pt-1">
                        <Link
                          to={recoveryLink.replace(/^https?:\/\/[^/]+/, "")}
                          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-deep text-white dark:bg-white dark:text-black font-semibold text-xs hover:opacity-90 active:scale-[0.98] transition-all no-underline shadow-sm"
                        >
                          Restablecer contraseña ahora →
                        </Link>
                        <button
                          type="button"
                          onClick={copyRecoveryLink}
                          className="w-full py-2.5 text-xs font-medium rounded-xl bg-card border border-line text-ink hover:bg-mist dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          Copiar enlace de recuperación
                        </button>
                      </div>
                    )}

                    <div className="pt-2 border-t border-line/60">
                      <button
                        type="button"
                        onClick={() => {
                          setRecoverySent(false);
                          setRecoveryLink("");
                        }}
                        className="text-xs text-brand hover:underline font-medium cursor-pointer bg-transparent border-none"
                      >
                        Enviar a otro correo
                      </button>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setRecovery(false)}
                  className="w-full text-center text-xs text-muted hover:text-ink transition-colors cursor-pointer bg-transparent border-none"
                >
                  ← Volver a iniciar sesión
                </button>
              </div>
            ) : (
              <>
                {/* Formulario Principal de Login o Registro (estructura exacta de la foto) */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1.5">
                        Full name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Juan Carlos Pérez"
                        className="w-full px-4 py-3 rounded-xl border border-line bg-card text-sm text-ink placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      autoComplete="email"
                      className="w-full px-4 py-3 rounded-xl border border-line bg-card text-sm text-ink placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={isLogin ? "••••••••" : "Mínimo 6 caracteres"}
                        autoComplete={isLogin ? "current-password" : "new-password"}
                        className="w-full pl-4 pr-10 py-3 rounded-xl border border-line bg-card text-sm text-ink placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer p-1"
                      >
                        {showPassword ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Fila de Remember me & Forgot your password (idéntica a la imagen) */}
                  {isLogin && (
                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-muted hover:text-ink transition-colors">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded border-line bg-card text-brand-deep cursor-pointer accent-brand-deep"
                        />
                        <span>Remember me</span>
                      </label>

                      <button
                        type="button"
                        onClick={openRecovery}
                        className="text-muted hover:text-ink transition-colors cursor-pointer bg-transparent border-none p-0"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  )}

                  {/* Opción para solicitar acceso de empleado público al registrarse */}
                  {!isLogin && (
                    <div className="pt-2">
                      <label className="flex items-start gap-2.5 p-3 rounded-xl border border-line bg-mist/50 dark:bg-slate-900/40 cursor-pointer hover:border-brand/40 transition-colors">
                        <input
                          type="checkbox"
                          checked={wantsEmployee}
                          onChange={(e) => setWantsEmployee(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded border-line bg-card text-brand-deep cursor-pointer accent-brand-deep"
                        />
                        <div className="text-xs">
                          <span className="font-semibold text-ink block">
                            Soy agente público y solicito acceso al panel de administración
                          </span>
                          <span className="text-muted block mt-0.5">
                            Un Superadmin revisará tus datos antes de activarte.
                          </span>
                        </div>
                      </label>

                      {wantsEmployee && (
                        <div className="mt-3 p-3 rounded-xl border border-line bg-card space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="CUIL (20-12345678-3)"
                              value={cuil}
                              onChange={(e) => setCuil(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-paper text-ink placeholder-faint focus:outline-none focus:border-brand"
                            />
                            <input
                              type="tel"
                              placeholder="Teléfono"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-paper text-ink placeholder-faint focus:outline-none focus:border-brand"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={department}
                              onChange={(e) => setDepartment(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-paper text-ink focus:outline-none focus:border-brand cursor-pointer"
                            >
                              <option value="">Dependencia...</option>
                              {employeeDepartments.map((d) => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder="Puesto / Función"
                              value={position}
                              onChange={(e) => setPosition(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-paper text-ink placeholder-faint focus:outline-none focus:border-brand"
                            />
                          </div>
                          <textarea
                            rows={2}
                            placeholder="Motivo de la solicitud (opcional)..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-paper text-ink placeholder-faint focus:outline-none focus:border-brand resize-none"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Botón Principal (Sign in / Create account - estilo exacto a la imagen) */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 mt-2 rounded-full bg-brand-deep text-white dark:bg-white dark:text-black font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    {submitting
                      ? "Procesando..."
                      : isLogin
                      ? "Sign in"
                      : "Create account"}
                  </button>
                </form>

                {/* Divisor "or continue with" (exacto a la imagen) */}
                <div className="relative my-6 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-line" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-paper dark:bg-[#09090b] px-3 text-muted font-medium tracking-wider">
                      or continue with
                    </span>
                  </div>
                </div>

                {/* Botón "Continue with Google" */}
                <div>
                  <button
                    type="button"
                    onClick={handleContinueWithGoogle}
                    disabled={submitting}
                    className="w-full py-3 px-4 rounded-full border border-line bg-card hover:bg-mist/70 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-ink dark:text-white text-sm font-medium flex items-center justify-center gap-3 transition-colors cursor-pointer group shadow-sm active:scale-[0.99]"
                  >
                    {/* Logo multicolor oficial SVG de Google */}
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </div>

                {/* Alternador inferior */}
                <div className="mt-8 text-center text-xs text-muted">
                  {isLogin ? (
                    <span>
                      ¿No tenés una cuenta?{" "}
                      <button
                        type="button"
                        onClick={() => setMode("register")}
                        className="font-semibold text-brand hover:underline cursor-pointer bg-transparent border-none p-0 ml-1"
                      >
                        Registrate gratis
                      </button>
                    </span>
                  ) : (
                    <span>
                      ¿Ya tenés una cuenta registrada?{" "}
                      <button
                        type="button"
                        onClick={() => setMode("login")}
                        className="font-semibold text-brand hover:underline cursor-pointer bg-transparent border-none p-0 ml-1"
                      >
                        Iniciá sesión
                      </button>
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="w-full max-w-md mx-auto text-center text-[11px] text-muted pt-4">
            ChatAP Formosa © 2026 · Subsecretaría de Recursos Humanos
          </div>
        </div>
      </div>

      {/* 3. Footer Completo (como lo teníamos antes) */}
      <Footer />

      {/* 4. Modal / Asistente de Autenticación con Google */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-fade-in">
          <div
            className="w-full max-w-md rounded-2xl bg-card border border-line p-6 shadow-2xl relative text-ink"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-sm font-bold">Autenticación con Google</span>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="text-muted hover:text-ink p-1 rounded-md cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Explicación clara de cómo funciona y qué se necesita para que sea 100% real */}
            <div className="mt-4 p-3.5 rounded-xl bg-mist/60 dark:bg-slate-900/60 border border-line text-xs space-y-2">
              <p className="font-semibold text-ink m-0 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                ¿Cómo funciona el inicio con Google real?
              </p>
              <p className="text-muted m-0 leading-relaxed">
                Para que la ventana de Google se abra con tu aplicación en producción, se requiere un <strong>Google Client ID</strong> obtenido en la consola de Google Cloud (gratuito).
              </p>
            </div>

            {/* Opciones: 1. Probar rápido / 2. Configurar Client ID real */}
            <div className="mt-4 space-y-3">
              <div>
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-2">
                  1. Acceso de prueba inmediato:
                </span>
                <div className="space-y-2">
                  {DEMO_GOOGLE_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleDemoGoogleSelect(acc)}
                      disabled={submitting}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-line bg-card hover:bg-mist/70 text-left transition-colors cursor-pointer group"
                    >
                      <img
                        src={acc.avatar}
                        alt={acc.name}
                        className="w-8 h-8 rounded-full object-cover border border-line shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-ink m-0 truncate group-hover:text-brand transition-colors">
                          {acc.name}
                        </p>
                        <p className="text-[11px] text-muted m-0 truncate font-mono">
                          {acc.email}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted px-2 py-0.5 rounded bg-mist">
                        Entrar
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-line">
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-2">
                  2. Conectar tu propio Google Client ID real:
                </span>

                {!showClientIdInput ? (
                  <button
                    type="button"
                    onClick={() => setShowClientIdInput(true)}
                    className="w-full py-2 px-3 rounded-xl border border-dashed border-line hover:border-brand text-xs font-medium text-muted hover:text-ink transition-colors cursor-pointer text-center"
                  >
                    + {googleClientId ? "Modificar Google Client ID" : "Configurar Google Client ID ahora"}
                  </button>
                ) : (
                  <form onSubmit={handleSaveClientId} className="space-y-2.5 animate-fade-in">
                    <input
                      type="text"
                      placeholder="Ej: 1234567890-abcdef.apps.googleusercontent.com"
                      value={inputClientId}
                      onChange={(e) => setInputClientId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-card text-ink placeholder-faint focus:outline-none focus:border-brand font-mono"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowClientIdInput(false)}
                        className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-line text-muted hover:text-ink"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-brand-deep text-white hover:bg-brand-dark"
                      >
                        Guardar y Probar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <div className="mt-5 text-center">
              <span className="text-[10px] text-muted leading-tight">
                Integración con Google Identity Services (GIS SDK OAuth 2.0).
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}