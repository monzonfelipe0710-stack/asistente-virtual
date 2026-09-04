import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/common/Toast";
import ChatBotAvatar from "../components/ChatBotAvatar";

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
  const { login, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("login");
  const [phase, setPhase] = useState("enter");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || "/";
  const isLogin = mode === "login";

  function switchMode(next) {
    if (next === mode) return;
    setPhase("leave");
    setTimeout(() => {
      setName("");
      setEmail("");
      setPassword("");
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
        await register({ name, email, password });
        toast("¡Cuenta creada con éxito!", "success");
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-paper">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
          <div
            className="mb-4 transition-all duration-500 ease-out"
            style={{
              transform: mode === "register" ? "scale(1.06)" : "scale(1)",
              opacity: phase === "leave" ? 0.5 : 1,
            }}
          >
            <ChatBotAvatar size={64} reaction={mode === "register" ? "happy" : "idle"} static />
          </div>
          <h1 key={`${mode}-${phase}`} className={`text-2xl font-bold text-ink m-0 ${headerAnim}`}>
            {isLogin ? "Bienvenido de nuevo" : "Creá tu cuenta"}
          </h1>
          <p
            key={`${mode}-${phase}-sub`}
            className={`text-muted text-sm mt-1 m-0 ${phase === "leave" ? "animate-type-out" : "animate-type-in"}`}
            style={{ animationDelay: phase === "leave" ? "0ms" : "80ms" }}
          >
            {isLogin
              ? "Iniciá sesión para continuar tus trámites."
              : "Guardá tu historial de consultas y continuá donde lo dejaste."}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-mist p-6 sm:p-8 shadow-soft">
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
            <Field
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? "Tu contraseña" : "Mínimo 6 caracteres"}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-brand-deep text-paper text-sm font-semibold transition-all duration-300 hover:bg-brand-dark active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:active:scale-100"
            >
              {submitting
                ? "Procesando…"
                : isLogin
                ? "Iniciar sesión"
                : "Crear cuenta"}
            </button>
          </form>
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
