import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/common/Toast";
import PasswordField from "../components/common/PasswordField";
import ChatBotAvatar from "../components/ChatBotAvatar";
import { employeeDepartments } from "../data/mockEmployeeApprovals";

function Field({ label, type = "text", value, onChange, placeholder, autoComplete, required = true, animate = false }) {
  return (
    <label className={`block ${animate ? "animate-field-in" : ""}`}>
      <span className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="w-full px-4 py-3 rounded-xl border border-line bg-paper text-sm text-ink placeholder:text-faint transition-colors duration-200 focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none"
      />
    </label>
  );
}

const OUT_MS = 300;

export default function LoginRegisterPage() {
  const { login, register, requestPasswordReset } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("login");
  const [phase, setPhase] = useState("enter");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [wantsEmployee, setWantsEmployee] = useState(false);
  const [cuil, setCuil] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const [recoveryLink, setRecoveryLink] = useState("");
  const [recoveryEmailed, setRecoveryEmailed] = useState(false);
  const [recoveryWarning, setRecoveryWarning] = useState("");

  const from = location.state?.from?.pathname || "/";
  const isLogin = mode === "login";

  function switchMode(next) {
    if (next === mode) return;
    setPhase("leave");
    setTimeout(() => {
      setName("");
      setEmail("");
      setPassword("");
      setWantsEmployee(false);
      setCuil("");
      setPhone("");
      setDepartment("");
      setPosition("");
      setReason("");
      setMode(next);
      setPhase("enter");
    }, OUT_MS);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
        toast("¡Bienvenido de nuevo!", "success");
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
            ? "¡Solicitud enviada! Un Superadmin revisará tus datos."
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

  const headerAnim = phase === "leave" ? "animate-type-out" : "animate-type-in";
  const formAnim = phase === "leave" ? "animate-form-out" : "animate-form-in";

  function openRecovery() {
    setRecoverySent(false);
    setRecoveryLink("");
    setRecoveryEmailed(false);
    setRecoveryWarning("");
    setRecovery(true);
  }

  async function handleRecovery(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await requestPasswordReset(email);
      setRecoveryLink(result?.link || "");
      setRecoveryEmailed(!!result?.emailed);
      setRecoveryWarning(result?.emailError || "");
      setRecoverySent(true);
    } catch (err) {
      toast(err.message || "Ocurrió un error.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyRecoveryLink() {
    if (!recoveryLink) return;
    try {
      await navigator.clipboard.writeText(recoveryLink);
      toast("Enlace copiado.", "success");
    } catch {
      toast("No se pudo copiar. Copialo manualmente.", "error");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-paper">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
          <div
            className="mb-4 transition duration-300 ease-out"
            style={{
              transform: mode === "register" ? "scale(1.06)" : "scale(1)",
              opacity: phase === "leave" ? 0.5 : 1,
            }}
          >
            <ChatBotAvatar size={64} reaction={mode === "register" ? "happy" : "idle"} />
          </div>
          <h1 key={`${recovery ? "recovery" : mode}-${phase}`} className={`text-2xl font-bold text-ink m-0 ${headerAnim}`}>
            {recovery ? "Recuperar contraseña" : isLogin ? "Bienvenido de nuevo" : "Creá tu cuenta"}
          </h1>
          <p
            key={`${recovery ? "recovery" : mode}-${phase}-sub`}
            className={`text-muted text-sm mt-1 m-0 ${phase === "leave" ? "animate-type-out" : "animate-type-in"}`}
            style={{ animationDelay: phase === "leave" ? "0ms" : "80ms" }}
          >
            {recovery
              ? "Te enviamos un enlace a tu correo para crear una nueva."
              : isLogin
              ? "Iniciá sesión para continuar tus trámites."
              : "Guardá tu historial de consultas y continuá donde lo dejaste."}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-mist p-6 sm:p-8 shadow-soft">
          {recovery ? (
            /* Recuperación de contraseña */
            <div className="animate-form-in">
              {!recoverySent ? (
                <form onSubmit={handleRecovery} className="space-y-4">
                  <Field
                    label="Correo electrónico"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    autoComplete="email"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-brand-deep text-paper text-sm font-semibold transition duration-200 hover:bg-brand-dark active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:active:scale-100"
                  >
                    {submitting ? "Enviando…" : "Enviar enlace"}
                  </button>
                </form>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 mx-auto rounded-xl grid place-items-center bg-ok/10 text-ok">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {recoveryEmailed ? (
                    <p className="text-sm text-muted m-0">
                      ¡Listo! Te enviamos el enlace a <span className="font-semibold text-ink">{email}</span>.
                      Revisá tu Gmail, es válido por 1 hora.
                    </p>
                  ) : (
                    <p className="text-sm text-muted m-0">
                      Si existe una cuenta con ese correo, generamos un enlace válido por 1 hora.
                    </p>
                  )}
                  {!recoveryEmailed && recoveryWarning && (
                    <div className="rounded-xl border border-warn/40 bg-warn/10 p-3 text-left">
                      <p className="text-xs font-semibold text-warn m-0">
                        No se pudo enviar el mail automáticamente
                      </p>
                      <p className="font-mono text-[11px] text-muted break-all m-0 mt-1">{recoveryWarning}</p>
                    </div>
                  )}
                  {!recoveryEmailed && recoveryLink && (
                    <div className="rounded-xl border border-line bg-paper p-3 text-left space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted m-0">
                        Enlace de demostración (en producción llega por Gmail)
                      </p>
                      <p className="font-mono text-xs text-ink break-all m-0">{recoveryLink}</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={copyRecoveryLink}
                          className="flex-1 py-2 rounded-lg border border-line text-xs font-semibold text-muted hover:text-ink hover:bg-mist transition-colors cursor-pointer"
                        >
                          Copiar enlace
                        </button>
                        <a
                          href={recoveryLink}
                          className="flex-1 py-2 rounded-lg bg-brand-deep text-paper text-xs font-semibold text-center no-underline hover:bg-brand-dark transition-colors"
                        >
                          Probar ahora
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => setRecovery(false)}
                className="w-full mt-4 py-2 text-sm font-medium text-muted hover:text-ink transition-colors cursor-pointer bg-transparent border-none"
              >
                ← Volver a iniciar sesión
              </button>
            </div>
          ) : (
          <>
          {/* Pestañas con indicador deslizante */}
          <div className="relative grid grid-cols-2 mb-6 rounded-xl bg-paper p-1 border border-line">
            <span
              className="auth-tab-slider absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-brand-deep shadow-sm"
              style={{ left: isLogin ? "4px" : "calc(50% + 0px)" }}
            />
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`relative z-10 py-2 rounded-lg text-sm font-semibold transition-colors duration-300 cursor-pointer ${
                isLogin ? "text-paper" : "text-muted hover:text-ink"
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`relative z-10 py-2 rounded-lg text-sm font-semibold transition-colors duration-300 cursor-pointer ${
                !isLogin ? "text-paper" : "text-muted hover:text-ink"
              }`}
            >
              Registrarme
            </button>
          </div>

          {/* Formulario con transición de salida + entrada encadenada */}
          <form
            key={`${mode}-${phase}`}
            onSubmit={handleSubmit}
            className={`space-y-4 ${formAnim}`}
          >
            {!isLogin && (
              <Field
                label="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                autoComplete="name"
                animate={phase === "enter"}
              />
            )}
            <Field
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              autoComplete={isLogin ? "email" : "email"}
            />
            <PasswordField
              label="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? "Tu contraseña" : "Mínimo 6 caracteres"}
              autoComplete={isLogin ? "current-password" : "new-password"}
              animate={phase === "enter"}
            />
            {!isLogin && (
              <label className="flex items-start gap-2.5 rounded-xl border border-line bg-paper px-3.5 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantsEmployee}
                  onChange={(e) => setWantsEmployee(e.target.checked)}
                  className="mt-0.5 w-4 h-4 shrink-0 cursor-pointer"
                  style={{ accentColor: "var(--color-brand-deep)" }}
                />
                <span>
                  <span className="block text-sm font-semibold text-ink">Soy empleado y solicito acceso interno</span>
                  <span className="block text-xs text-muted mt-0.5">Un Superadmin revisará tus datos antes de activarte.</span>
                </span>
              </label>
            )}
            {!isLogin && wantsEmployee && (
              <div className="space-y-4 animate-field-in">
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="CUIL"
                    value={cuil}
                    onChange={(e) => setCuil(e.target.value)}
                    placeholder="20-12345678-3"
                    autoComplete="off"
                    animate={false}
                  />
                  <Field
                    label="Teléfono"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="3704 55-0000"
                    autoComplete="tel"
                    animate={false}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">
                      Dependencia
                    </span>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-line bg-paper text-sm text-ink transition-colors duration-200 focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none cursor-pointer"
                    >
                      <option value="">Seleccionar…</option>
                      {employeeDepartments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </label>
                  <Field
                    label="Puesto solicitado"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Ej: Administrativo"
                    autoComplete="off"
                    animate={false}
                  />
                </div>
                <label className="block">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">
                    Motivo (opcional)
                  </span>
                  <textarea
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Contanos brevemente por qué solicitás el acceso"
                    className="w-full px-4 py-3 rounded-xl border border-line bg-paper text-sm text-ink placeholder:text-faint transition-colors duration-200 focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none resize-none"
                  />
                </label>
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-brand-deep text-paper text-sm font-semibold transition duration-200 hover:bg-brand-dark active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:active:scale-100"
            >
              {submitting
                ? "Procesando…"
                : isLogin
                ? "Iniciar sesión"
                : "Crear cuenta"}
            </button>
            {isLogin && (
              <button
                type="button"
                onClick={openRecovery}
                className="w-full py-1 text-[13px] font-medium text-muted hover:text-brand-deep transition-colors cursor-pointer bg-transparent border-none"
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </form>
          </>
          )}
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-muted hover:text-brand-deep transition-colors no-underline">
            ← Volver al chat
          </Link>
        </div>
      </div>
    </div>
  );
}
