import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/common/Toast";
import ChatBotAvatar from "../components/ChatBotAvatar";
import { Kicker, DisplayTitle, Lead } from "../components/common/editorial";
import { triggerOnboardingForUser } from "../components/common/BotOnboardingModal";
import { promptSaveCredentials } from "../lib/credentialManager";
import { apiErrorMessage } from "../lib/api";

function formatDni(value) {
  return value.replace(/\D/g, "").slice(0, 8);
}

/**
 * Opciones de género del registro. El valor es el texto visible; el backend
 * recibe el código equivalente (ver lib/genero.js).
 */
const GENERO_OPCIONES = [
  {
    valor: "Femenino",
    icono: (
      <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="5" strokeWidth={2} />
        <path strokeLinecap="round" strokeWidth={2} d="M12 13v8m-3-3h6" />
      </svg>
    ),
  },
  {
    valor: "Masculino",
    icono: (
      <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="10" cy="14" r="5" strokeWidth={2} />
        <path strokeLinecap="round" strokeWidth={2} d="M14 10l6-6m0 0h-5m5 0v5" />
      </svg>
    ),
  },
  {
    valor: "Otro",
    icono: (
      <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v18m-9-9h18" />
      </svg>
    ),
  },
  {
    valor: "Prefiero no decirlo",
    icono: (
      <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 1116 0 8 8 0 01-16 0zm5-3h6m-6 6h6" />
      </svg>
    ),
  },
];

/**
 * Contenedor plegable con altura animada. Al cambiar de modo, los campos que
 * no corresponden (DNI, género, "recordarme") se despliegan o se ocultan de
 * forma fluida en lugar de aparecer/desaparecer de golpe.
 */
function Collapse({ open, children, className = "" }) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity,margin] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        open ? "grid-rows-[1fr] opacity-100 mb-4" : "grid-rows-[0fr] opacity-0 mb-0"
      } ${className}`}
      aria-hidden={!open}
    >
      <div inert={!open} className={`overflow-hidden min-h-0 ${open ? "" : "pointer-events-none"}`}>
        {children}
      </div>
    </div>
  );
}

export default function LoginRegisterPage() {
  const { login, register, requestPasswordReset } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [dni, setDni] = useState("");
  const [gender, setGender] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Estado de carga y recuperación
  const [submitting, setSubmitting] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [recoveryPending, setRecoveryPending] = useState(false);

  const from = location.state?.from?.pathname || "/";
  const isLogin = mode === "login";
  const requiresNameAndLastName = gender === "Otro" || gender === "Prefiero no decirlo";

  // Envío de formulario estándar (Email + Contraseña)
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
        await promptSaveCredentials({
          username: email,
          password,
        });
        toast("¡Bienvenido/a de nuevo!", "success");
        navigate(from, { replace: true });
      } else {
        if (requiresNameAndLastName) {
          if (!nombre.trim() || !apellido.trim()) {
            toast("Ingresá tu nombre y apellido para continuar.", "error");
            setSubmitting(false);
            return;
          }
        }
        // Registro común de ciudadano: el backend valida los datos contra el
        // padrón y la cuenta queda habilitada al instante.
        const result = await register({
          dni,
          gender,
          email,
          password,
          nombre: nombre.trim(),
          apellido: apellido.trim(),
        });
        await promptSaveCredentials({
          username: email,
          password,
          name: result?.user?.name || `${nombre.trim()} ${apellido.trim()}`.trim(),
        });
        toast(result?.mensaje || "Cuenta creada. ¡Ya iniciaste sesión!", "success");
        if (result?.autoLogin) {
          if (result.user?.id) triggerOnboardingForUser(result.user.id);
          navigate(from, { replace: true });
        } else {
          setMode("login");
        }
      }
    } catch (err) {
      toast(err.message || "Ocurrió un error.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function goTo(nextMode) {
    setMode(nextMode);
    setRecovery(false);
  }

  function openRecovery() {
    setRecoveryPending(false);
    setRecovery(true);
  }

  async function handleRecovery(e) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast("Ingresá un correo electrónico válido.", "error");
      return;
    }
    // El reseteo lo hace el backend (genera y valida un token por mail).
    try {
      await requestPasswordReset(email);
      setRecoveryPending(true);
    } catch (err) {
      toast(apiErrorMessage(err, "No se pudo enviar el enlace de recuperación."), "error");
    }
  }

  return (
    <div className="min-h-[100svh] flex flex-col bg-paper font-sans">
      {/* Grilla Principal:
          - Izquierda: Decoración editorial previa + Fotografía de Montañas
          - Derecha: Formulario de acceso (login / solicitud de cuenta)
      */}
      <div className="flex-1 grid grid-cols-1 items-start lg:grid-cols-2">
        {/* 1. Columna Izquierda: Decoración Editorial Previa + Fotografía de Montañas */}
        <div className="relative hidden lg:sticky lg:top-0 lg:flex lg:h-[100svh] lg:self-start min-h-0 flex-col justify-between overflow-hidden border-r border-line bg-mist/50 dark:bg-slate-900/40 p-10 xl:p-12 select-none">
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
            <Kicker className="text-right">Acceso al sistema</Kicker>
          </div>

          {/* Bloque editorial principal */}
          <div className="relative z-10 my-8">
            <DisplayTitle as={1} className="auth-display-title max-w-lg">
              Trámites simples, <span className="text-brand">respuestas al instante</span>.
            </DisplayTitle>
            <Lead className="max-w-sm mt-5">
              Hablá con ChatAP cuando lo necesites.
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

        {/* 2. Columna Derecha: Formulario */}
        <main
          id="contenido"
          aria-label="Inicio de sesión o registro"
          className="flex flex-col px-6 sm:px-12 xl:px-20 py-6 lg:min-h-[100svh] lg:py-5 bg-paper dark:bg-[#09090b] text-ink dark:text-slate-100"
        >
          {/* Barra superior con navegación de retorno y toggle de modo */}
          <div className="flex items-center justify-between w-full max-w-md mx-auto shrink-0">
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
                onClick={() => goTo("login")}
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
                onClick={() => goTo("register")}
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
          <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center py-3 px-1 sm:px-0">
            {/* Logo en móvil */}
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-deep text-white">
                <ChatBotAvatar size={22} />
              </span>
              <span className="text-base font-bold tracking-tight uppercase">
                ChatAP · Formosa
              </span>
            </div>

            {/* Encabezado del Formulario */}
            <div
              key={recovery ? "recovery" : mode}
              className="mb-6 animate-form-in"
            >
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink dark:text-white m-0">
                {recovery
                  ? "Recuperá tu contraseña"
                  : isLogin
                  ? "Iniciá sesión en tu cuenta"
                  : "Creá tu cuenta"}
              </h1>
              <p className="text-xs sm:text-sm text-muted m-0 mt-1.5">
                {recovery
                  ? "Ingresá tu correo para recibir un enlace de restablecimiento seguro."
                  : isLogin
                  ? "Ingresá a tu cuenta para continuar tus trámites y consultas."
                  : "Completá tus datos para empezar a usar ChatAP. Tu cuenta se habilita al instante."}
              </p>
            </div>

            {recovery ? (
              /* Flujo de Recuperación */
              <div className="space-y-4 animate-form-in">
                {!recoveryPending ? (
                  <form onSubmit={handleRecovery} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-muted uppercase tracking-wider mb-1.5">
                        Correo electrónico
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
                      className="w-full py-3.5 rounded-full bg-brand-deep text-white dark:bg-white dark:text-black font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      Enviar enlace de recuperación
                    </button>
                  </form>
                ) : (
                  <div className="p-5 rounded-2xl border border-sky-200/80 dark:border-sky-900/70 bg-sky-50/80 dark:bg-slate-900/60 text-center space-y-4 animate-scale-in shadow-sm">
                    <div className="w-14 h-14 mx-auto rounded-full bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 grid place-items-center ring-4 ring-white/70 dark:ring-slate-800/70">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.75 6.75A2.25 2.25 0 016 4.5h12a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0118 19.5H6a2.25 2.25 0 01-2.25-2.25V6.75z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m4.5 6 7.5 6 7.5-6" />
                      </svg>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-ink dark:text-white m-0">
                        ¡Revisá tu correo!
                      </h3>
                      <p className="text-sm text-muted m-0 leading-relaxed">
                        Si hay una cuenta asociada a{" "}
                        <strong className="break-all text-ink dark:text-white">{email}</strong>,
                        te enviaremos un enlace para crear una contraseña nueva.
                      </p>
                      <p className="text-xs text-muted m-0 leading-relaxed">
                        Dale una mirada a tu bandeja de entrada y, si no lo encontrás,
                        revisá también la carpeta de correo no deseado. Por tu seguridad,
                        no podemos confirmar si una dirección está registrada.
                      </p>
                    </div>

                    <a
                      href="https://mail.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                    >
                      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm-.4 3.25-7.1 5.32a.83.83 0 01-1 0L4.4 7.25a.5.5 0 01.6-.8l7 5.25 7-5.25a.5.5 0 01.6.8z" />
                      </svg>
                      Abrir Gmail y buscar el mensaje
                    </a>

                    <div className="pt-3 border-t border-line/60">
                      <button
                        type="button"
                        onClick={() => setRecoveryPending(false)}
                        className="text-xs text-brand hover:underline font-medium cursor-pointer bg-transparent border-none"
                      >
                        Probar con otro correo
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
                {/* Formulario Principal de Login o Solicitud de cuenta */}
                <form
                  id="auth-form"
                  name="authForm"
                  method="POST"
                  action="/api/auth/login"
                  onSubmit={handleSubmit}
                  className="flex flex-col"
                  autoComplete="on"
                >
                  {/* DNI: sólo en registro. Se despliega con altura animada. */}
                  <Collapse open={!isLogin}>
                    <div>
                      <label htmlFor="register-dni" className="block text-sm font-medium text-muted mb-1.5">
                        DNI
                      </label>
                      <input
                        id="register-dni"
                        name="dni"
                        type="text"
                        inputMode="numeric"
                        required={!isLogin}
                        value={dni}
                        onChange={(e) => setDni(formatDni(e.target.value))}
                        autoComplete="off"
                        maxLength={8}
                        placeholder="Ej: 30123456"
                        aria-describedby="register-dni-hint"
                        className="w-full px-4 py-3 rounded-xl border border-line bg-card text-sm text-ink placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                      />
                      <p id="register-dni-hint" className="mt-1 text-[11px] text-muted">
                        Tu DNI se usa para identificarte e iniciar sesión.
                      </p>
                    </div>
                  </Collapse>

                  {/* Género: sólo en registro. */}
                  <Collapse open={!isLogin}>
                    <div>
                      <label id="register-gender-label" className="block text-sm font-medium text-muted mb-1.5">
                        Género
                      </label>
                      <div
                        role="radiogroup"
                        aria-labelledby="register-gender-label"
                        aria-required="true"
                        className="grid grid-cols-2 gap-2"
                      >
                        {GENERO_OPCIONES.map((opcion) => (
                          <button
                            key={opcion.valor}
                            type="button"
                            role="radio"
                            aria-checked={gender === opcion.valor}
                            onClick={() => setGender(opcion.valor)}
                            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-center text-sm font-semibold leading-tight transition-all cursor-pointer ${
                              gender === opcion.valor
                                ? "border-brand bg-brand/5 ring-1 ring-brand/20 text-ink"
                                : "border-line bg-card hover:border-brand/40 text-muted"
                            }`}
                          >
                            {opcion.icono}
                            {opcion.valor}
                          </button>
                        ))}
                      </div>
                      <p id="register-gender-hint" className="mt-1 text-[11px] text-muted">
                        {requiresNameAndLastName
                          ? "Para esta opción necesitamos tu nombre y apellido para verificar tu identidad con el padrón."
                          : "Campo obligatorio. Tus datos se validan contra el padrón de turnos."}
                      </p>
                    </div>
                  </Collapse>

                  {/* Nombre y Apellido: se solicitan para las opciones que el backend agrupa bajo el código X. */}
                  <Collapse open={!isLogin && requiresNameAndLastName}>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="register-nombre" className="block text-sm font-medium text-muted mb-1.5">
                            Nombre
                          </label>
                          <input
                            id="register-nombre"
                            name="given-name"
                            type="text"
                            required={!isLogin && requiresNameAndLastName}
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ej: Alex"
                            autoComplete="given-name"
                            className="w-full px-4 py-3 rounded-xl border border-line bg-card text-sm text-ink placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                          />
                        </div>
                        <div>
                          <label htmlFor="register-apellido" className="block text-sm font-medium text-muted mb-1.5">
                            Apellido
                          </label>
                          <input
                            id="register-apellido"
                            name="family-name"
                            type="text"
                            required={!isLogin && requiresNameAndLastName}
                            value={apellido}
                            onChange={(e) => setApellido(e.target.value)}
                            placeholder="Ej: Gómez"
                            autoComplete="family-name"
                            className="w-full px-4 py-3 rounded-xl border border-line bg-card text-sm text-ink placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-muted m-0">
                        Ingresá tus datos tal como figuran en el padrón. Se utilizarán únicamente para verificar tu identidad.
                      </p>
                    </div>
                  </Collapse>

                  <div className="mb-4">
                    <label htmlFor="auth-email" className="block text-sm font-medium text-muted mb-1.5">
                      {isLogin ? "DNI o correo electrónico" : "Correo electrónico (Gmail)"}
                    </label>
                    <input
                      id="auth-email"
                      name="username"
                      type={isLogin ? "text" : "email"}
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={isLogin ? "30123456 o tucorreo@gmail.com" : "tucorreo@gmail.com"}
                      autoComplete={isLogin ? "username" : "email"}
                      className="w-full px-4 py-3 rounded-xl border border-line bg-card text-sm text-ink placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="auth-password" className="block text-sm font-medium text-muted mb-1.5">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="auth-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={isLogin ? "••••••••" : "Mínimo 8 caracteres"}
                        autoComplete={isLogin ? "current-password" : "new-password"}
                        className="w-full pl-4 pr-10 py-3 rounded-xl border border-line bg-card text-sm text-ink placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        aria-pressed={showPassword}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer p-2"
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

                  {/* Aviso de cuenta de ciudadano: sólo en registro. */}
                  <Collapse open={!isLogin}>
                    <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-300 m-0">
                        <strong className="font-semibold">Acceso inmediato.</strong> Validamos
                        tus datos contra el padrón y tu cuenta queda habilitada al instante.
                      </p>
                    </div>
                  </Collapse>

                  {/* Recordarme & recuperación: sólo en login. */}
                  <Collapse open={isLogin}>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-muted hover:text-ink transition-colors">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded border-line bg-card text-brand-deep cursor-pointer accent-brand-deep"
                        />
                        <span>Recordarme</span>
                      </label>

                      <button
                        type="button"
                        onClick={openRecovery}
                        className="text-muted hover:text-ink transition-colors cursor-pointer bg-transparent border-none p-0"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  </Collapse>

                  {/* Botón Principal */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 mt-2 rounded-full bg-brand-deep text-white dark:bg-white dark:text-black font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    {submitting
                      ? "Procesando..."
                      : isLogin
                      ? "Iniciar sesión"
                      : "Crear cuenta"}
                  </button>
                </form>

                {/* Alternador inferior */}
                <div className="mt-8 text-center text-xs text-muted">
                  {isLogin ? (
                    <span>
                      ¿No tenés una cuenta?{" "}
                      <button
                        type="button"
                        onClick={() => goTo("register")}
                        className="font-semibold text-brand hover:underline cursor-pointer bg-transparent border-none p-0 ml-1"
                      >
                        Creá tu cuenta
                      </button>
                    </span>
                  ) : (
                    <span>
                      ¿Ya tenés una cuenta registrada?{" "}
                      <button
                        type="button"
                        onClick={() => goTo("login")}
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

          <div className="w-full max-w-md mx-auto text-center text-[11px] text-muted pt-4 pb-4 mt-auto">
            ChatAP Formosa © 2026 · Subsecretaría de Recursos Humanos
          </div>
        </main>
      </div>

    </div>
  );
}
