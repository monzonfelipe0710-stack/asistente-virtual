import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/common/Toast";
import PasswordField from "../components/common/PasswordField";
import ChatBotAvatar from "../components/ChatBotAvatar";
import ImageStage from "../components/common/ImageStage";
import { Kicker, DisplayTitle, Lead } from "../components/common/editorial";
import { employeeDepartments } from "../data/mockEmployeeApprovals";
import Footer from "../components/common/Footer";

function Field({ label, type = "text", value, onChange, placeholder, autoComplete, required = true, animate = false }) {
  return (
    <label className={`block ${animate ? "animate-field-in" : ""}`}>
      <span className="block text-xs font-semibold uppercase tracking-wide text-muted mb-2">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="w-full px-4 py-3.5 rounded-xl border border-line bg-paper text-[15px] text-ink placeholder:text-faint transition-colors duration-200 focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none"
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

  const title = recovery
    ? "RECUPERÁ TU ACCESO."
    : isLogin
    ? "HOLA. DE NUEVO."
    : "CREÁ TU CUENTA.";

  const subtitle = recovery
    ? "Te enviamos un enlace a tu correo para crear una nueva."
    : isLogin
    ? "Iniciá sesión para continuar tus trámites."
    : "Guardá tu historial de consultas y continuá donde lo dejaste.";

  return (
    <div className="min-h-[100svh] grid grid-cols-1 lg:grid-cols-2 bg-paper">
      {/* Panel editorial */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-line bg-mist/50 p-12 xl:p-16">
        <div className="relative z-10 flex items-start justify-between">
          <span className="inline-flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-deep text-paper" aria-hidden="true">
              <ChatBotAvatar size={26} />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-ink uppercase">
              ChatAP
            </span>
          </span>
          <Kicker className="text-right">Acceso ciudadano</Kicker>
        </div>

        <div>
          <DisplayTitle as={1} className="max-w-xl">
            HABLÁ CON EL ESTADO.
          </DisplayTitle>
          <Lead className="max-w-md mt-6">
            Entrá para seguir tus conversaciones, consultar tus trámites y recibir tus
            documentos. Todo en Formosa. Todo en línea.
          </Lead>
        </div>

        <ImageStage
          kind="portico"
          accent
          aspect="aspect-[21/10] w-full"
          tint="text-ink/70"
          label="Subsecretaría de Recursos Humanos"
        />
      </div>

      {/* Columna del formulario */}
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-deep text-paper" aria-hidden="true">
              <ChatBotAvatar size={22} />
            </span>
            <span className="text-base font-extrabold tracking-tight text-ink uppercase">
              ChatAP
            </span>
          </div>

          <div key={`${recovery ? "recovery" : mode}-${phase}`} className={`${headerAnim}`}>
            <Kicker>{recovery ? "Seguridad" : isLogin ? "Bienvenido" : "Nueva cuenta"}</Kicker>
            <h1 className="display-3 text-ink mt-4 mb-0">
              {title}
            </h1>
            <p
              className={`text-muted text-[15px] mt-3 m-0 ${phase === "leave" ? "animate-type-out" : "animate-type-in"}`}
              style={{ animationDelay: phase === "leave" ? "0ms" : "120ms" }}
            >
              {subtitle}
            </p>
          </div>

          <div key={recovery ? "recovery-card" : `card-${mode}`} className={`mt-10 ${formAnim}`}>
            {recovery ? (
              <div>
                {!recoverySent ? (
                  <form onSubmit={handleRecovery} className="space-y-5">
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
                      className="w-full py-3.5 rounded-full bg-brand-deep text-[#ffffff] text-sm font-semibold transition duration-200 hover:bg-brand-dark active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:active:scale-100"
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
                            className="flex-1 py-2 border border-line text-xs font-semibold text-muted hover:text-ink hover:bg-mist transition-colors cursor-pointer"
                          >
                            Copiar enlace
                          </button>
                          <a
                            href={recoveryLink}
                            className="flex-1 py-2 bg-brand-deep text-[#ffffff] text-xs font-semibold text-center no-underline hover:bg-brand-dark transition-colors"
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
                  className="w-full mt-6 py-2 text-sm font-medium text-muted hover:text-ink transition-colors cursor-pointer bg-transparent border-none"
                >
                  ← Volver a iniciar sesión
                </button>
              </div>
            ) : (
              <>
                {/* Pestañas con indicador deslizante */}
                <div className="relative grid grid-cols-2 mb-8 border border-line bg-mist p-0.5">
                  <span
                    className="auth-tab-slider absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] bg-brand-deep"
                    style={{ left: isLogin ? "2px" : "calc(50% + 0px)" }}
                  />
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className={`relative z-10 py-2.5 text-sm font-semibold transition-colors duration-300 cursor-pointer ${
                      isLogin ? "text-[#ffffff]" : "text-muted hover:text-ink"
                    }`}
                  >
                    Iniciar sesión
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className={`relative z-10 py-2.5 text-sm font-semibold transition-colors duration-300 cursor-pointer ${
                      !isLogin ? "text-[#ffffff]" : "text-muted hover:text-ink"
                    }`}
                  >
                    Registrarme
                  </button>
                </div>

                {/* Formulario con transición de salida + entrada encadenada */}
                <form
                  key={`${mode}-${phase}`}
                  onSubmit={handleSubmit}
                  className={`space-y-5 ${formAnim}`}
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
                    autoComplete="email"
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
                    <label className="flex items-start gap-2.5 rounded-xl border border-line bg-paper px-3.5 py-3 cursor-pointer hover:border-brand/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={wantsEmployee}
                        onChange={(e) => setWantsEmployee(e.target.checked)}
                        className="mt-0.5 w-4 h-4 shrink-0 cursor-pointer"
                        style={{ accentColor: "var(--color-brand-deep)" }}
                      />
                      <span>
                        <span className="block text-sm font-semibold text-ink">Soy empleado y solicito acceso al panel de administración</span>
                        <span className="block text-xs text-muted mt-0.5">Un Superadmin revisará tus datos antes de activarte.</span>
                      </span>
                    </label>
                  )}
                  {!isLogin && wantsEmployee && (
                    <div className="space-y-5 animate-field-in">
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
                          <span className="block text-xs font-semibold uppercase tracking-wide text-muted mb-2">
                            Dependencia
                          </span>
                          <select
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full px-4 py-3.5 rounded-xl border border-line bg-paper text-[15px] text-ink transition-colors duration-200 focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none cursor-pointer"
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
                        <span className="block text-xs font-semibold uppercase tracking-wide text-muted mb-2">
                          Motivo (opcional)
                        </span>
                        <textarea
                          rows={2}
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Contanos brevemente por qué solicitás el acceso"
                          className="w-full px-4 py-3.5 rounded-xl border border-line bg-paper text-[15px] text-ink placeholder:text-faint transition-colors duration-200 focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none resize-none"
                        />
                      </label>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-full bg-brand-deep text-[#ffffff] text-sm font-semibold transition duration-200 hover:bg-brand-dark active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:active:scale-100"
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

          <div className="text-center mt-8">
            <Link to="/" className="text-sm text-muted hover:text-brand-deep transition-colors no-underline">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}