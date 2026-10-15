import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/common/Toast";
import ChatBotAvatar from "../components/ChatBotAvatar";
import { Kicker, DisplayTitle, Lead } from "../components/common/editorial";
import { triggerOnboardingForUser } from "../components/common/BotOnboardingModal";

function formatCuil(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
}

function isValidCuil(value) {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{11}$/.test(digits)) return false;

  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((total, weight, index) => total + Number(digits[index]) * weight, 0);
  const checkDigit = 11 - (sum % 11);
  const expected = checkDigit === 11 ? [0] : checkDigit === 10 ? [4, 9] : [checkDigit];
  return expected.includes(Number(digits[10]));
}

/**
 * Contenedor plegable con altura animada. Al cambiar de modo, los campos que
 * no corresponden (nombre, aviso de empleado, "recordarme") se despliegan o se
 * ocultan de forma fluida en lugar de aparecer/desaparecer de golpe.
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
  const { login, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [accountType, setAccountType] = useState("ciudadano"); // "ciudadano" | "empleado"
  const [name, setName] = useState("");
  const [cuil, setCuil] = useState("");
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

  // Envío de formulario estándar (Email + Contraseña)
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
        toast("¡Bienvenido/a de nuevo!", "success");
        navigate(from, { replace: true });
      } else {
        // Dos circuitos:
        // - Empleado → solicitud al backend (queda PENDIENTE de aprobación).
        // - Ciudadano → cuenta local (demo) e inicio de sesión inmediato.
        const rol = accountType === "empleado" ? "ADMINISTRADOR" : "CIUDADANO";
        if (rol === "ADMINISTRADOR" && !isValidCuil(cuil)) {
          toast("Ingresá un CUIL válido de 11 dígitos.", "error");
          setSubmitting(false);
          return;
        }
        const result = await register({
          name,
          email,
          password,
          rol,
          cuil: rol === "ADMINISTRADOR" ? cuil.replace(/\D/g, "") : undefined,
        });
        toast(
          result?.mensaje ||
            (accountType === "empleado"
              ? "Solicitud registrada. La administración revisará tu solicitud."
              : "Cuenta creada. ¡Ya iniciaste sesión!"),
          "success"
        );
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

  function handleRecovery(e) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast("Ingresá un correo electrónico válido.", "error");
      return;
    }
    // El reseteo lo hace el backend (genera y valida un token por mail).
    // No se implementa con EmailJS.
    setRecoveryPending(true);
  }

  return (
    <div className="min-h-[100svh] lg:h-[100svh] flex flex-col bg-paper font-sans lg:overflow-hidden">
      {/* Grilla Principal:
          - Izquierda: Decoración editorial previa + Fotografía de Montañas
          - Derecha: Formulario de acceso (login / solicitud de cuenta)
      */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2">
        {/* 1. Columna Izquierda: Decoración Editorial Previa + Fotografía de Montañas */}
        <div className="relative hidden lg:flex min-h-0 flex-col justify-between overflow-hidden border-r border-line bg-mist/50 dark:bg-slate-900/40 p-10 xl:p-12 select-none">
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
            <DisplayTitle as={1} className="max-w-lg">
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
        <div className="flex min-h-0 flex-col px-6 sm:px-12 xl:px-20 py-6 lg:py-5 bg-paper dark:bg-[#09090b] text-ink dark:text-slate-100">
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
          <div className="w-full max-w-md mx-auto my-auto py-3">
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
              key={recovery ? "recovery" : !isLogin ? `register-${accountType}` : mode}
              className="mb-6 animate-form-in"
            >
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink dark:text-white m-0">
                {recovery
                  ? "Recuperá tu contraseña"
                  : isLogin
                  ? "Iniciá sesión en tu cuenta"
                  : accountType === "empleado"
                  ? "Solicitá tu cuenta de empleado"
                  : "Creá tu cuenta de ciudadano"}
              </h1>
              <p className="text-xs sm:text-sm text-muted m-0 mt-1.5">
                {recovery
                  ? "Ingresá tu correo para recibir un enlace de restablecimiento seguro."
                  : isLogin
                  ? "Ingresá a tu cuenta para continuar tus trámites y consultas."
                  : accountType === "empleado"
                  ? "Completá tus datos para solicitar el acceso. La administración revisará tu solicitud."
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
                  <div className="p-5 rounded-2xl border border-line bg-mist/50 dark:bg-slate-900/60 text-center space-y-4 animate-scale-in">
                    <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 grid place-items-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-ink dark:text-white m-0">
                        Pendiente de backend
                      </h3>
                      <p className="text-xs text-muted m-0 leading-relaxed">
                        La recuperación de contraseña la gestiona el backend: genera un
                        enlace seguro y lo envía por correo a{" "}
                        <strong className="text-ink dark:text-white">{email}</strong>. Va a
                        estar disponible cuando se habilite el endpoint.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-line/60">
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
                <form onSubmit={handleSubmit} className="flex flex-col">
                  {/* Selector de tipo de cuenta: sólo en registro. */}
                  <Collapse open={!isLogin}>
                    <div>
                      <label className="block text-sm font-medium text-muted mb-1.5">
                        Tipo de cuenta
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setAccountType("ciudadano")}
                          aria-pressed={accountType === "ciudadano"}
                          className={`flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-all cursor-pointer ${
                            accountType === "ciudadano"
                              ? "border-brand bg-brand/5 ring-1 ring-brand/20"
                              : "border-line bg-card hover:border-brand/40"
                          }`}
                        >
                          <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                            <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Ciudadano
                          </span>
                          <span className="text-[11px] text-muted">Acceso inmediato</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAccountType("empleado")}
                          aria-pressed={accountType === "empleado"}
                          className={`flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-all cursor-pointer ${
                            accountType === "empleado"
                              ? "border-brand bg-brand/5 ring-1 ring-brand/20"
                              : "border-line bg-card hover:border-brand/40"
                          }`}
                        >
                          <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Empleado
                          </span>
                          <span className="text-[11px] text-muted">Requiere aprobación</span>
                        </button>
                      </div>
                    </div>
                  </Collapse>

                  <Collapse open={!isLogin && accountType === "empleado"}>
                    <div>
                      <label htmlFor="employee-cuil" className="block text-sm font-medium text-muted mb-1.5">
                        CUIL
                      </label>
                      <input
                        id="employee-cuil"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={13}
                        required={!isLogin && accountType === "empleado"}
                        value={cuil}
                        onChange={(e) => setCuil(formatCuil(e.target.value))}
                        placeholder="20-12345678-6"
                        aria-describedby="employee-cuil-hint"
                        className="w-full px-4 py-2.5 rounded-xl border border-line bg-card text-sm text-ink placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                      />
                      <p id="employee-cuil-hint" className="mt-1 text-[11px] text-muted">
                        Ingresá los 11 dígitos tal como figuran en tu constancia.
                      </p>
                    </div>
                  </Collapse>

                  {/* Nombre: sólo en registro. Se despliega con altura animada. */}
                  <Collapse open={!isLogin}>
                    <div>
                      <label className="block text-sm font-medium text-muted mb-1.5">
                        Nombre completo
                      </label>
                      <input
                        type="text"
                        required={!isLogin}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        placeholder="Ej: Juan Carlos Pérez"
                        className="w-full px-4 py-3 rounded-xl border border-line bg-card text-sm text-ink placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                      />
                    </div>
                  </Collapse>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-muted mb-1.5">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tucorreo@ejemplo.com"
                      autoComplete="email"
                      className="w-full px-4 py-3 rounded-xl border border-line bg-card text-sm text-ink placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-muted mb-1.5">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
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

                  {/* Aviso de solicitud de empleado: sólo en registro + tipo empleado. */}
                  <Collapse open={!isLogin && accountType === "empleado"}>
                    <div className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300 m-0">
                        <strong className="font-semibold">Solicitud sujeta a aprobación.</strong>{" "}
                        La administración revisará tu solicitud y vas a poder iniciar sesión
                        una vez que sea aprobada.
                      </p>
                    </div>
                  </Collapse>

                  {/* Aviso de cuenta de ciudadano: sólo en registro + tipo ciudadano. */}
                  <Collapse open={!isLogin && accountType === "ciudadano"}>
                    <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-300 m-0">
                        <strong className="font-semibold">Acceso inmediato.</strong> Tu cuenta
                        se crea en este dispositivo y entrás al instante; después vas a poder
                        iniciar sesión con tu correo y contraseña.
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

          <div className="w-full max-w-md mx-auto text-center text-[11px] text-muted pt-4">
            ChatAP Formosa © 2026 · Subsecretaría de Recursos Humanos
          </div>
        </div>
      </div>

    </div>
  );
}
