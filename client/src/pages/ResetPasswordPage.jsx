import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/common/Toast";
import ChatBotAvatar from "../components/ChatBotAvatar";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const { validateResetToken, resetPassword } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const valid = validateResetToken(token);

  async function handleSubmit(e) {
    e.preventDefault();
    if (pw !== pw2) {
      toast("Las contraseñas no coinciden.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, pw);
      setDone(true);
      toast("Contraseña actualizada.", "success");
    } catch (err) {
      toast(err.message || "Ocurrió un error.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-paper">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-4">
            <ChatBotAvatar size={64} reaction={done ? "happy" : "idle"} static />
          </div>
          <h1 className="text-2xl font-bold text-ink m-0 animate-type-in">
            {!valid.ok
              ? "Enlace no válido"
              : done
                ? "¡Listo!"
                : "Nueva contraseña"}
          </h1>
          <p className="text-muted text-sm mt-1 m-0 animate-type-in" style={{ animationDelay: "80ms" }}>
            {!valid.ok
              ? "Ese enlace venció o ya fue usado."
              : done
                ? "Ya podés iniciar sesión con tu nueva contraseña."
                : "Elegí una contraseña de al menos 6 caracteres."}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-mist p-6 sm:p-8 shadow-soft">
          {!valid.ok ? (
            <div className="text-center space-y-4 animate-form-in">
              <div className="w-12 h-12 mx-auto rounded-xl grid place-items-center bg-bad/10 text-bad">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <p className="text-sm text-muted m-0">
                Pedí un enlace nuevo desde <span className="font-semibold text-ink">“Olvidé mi contraseña”</span> en el inicio de sesión.
              </p>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full py-3 rounded-xl bg-brand-deep text-paper text-sm font-semibold transition-all duration-200 hover:bg-brand-dark active:scale-[0.98] cursor-pointer"
              >
                Ir a iniciar sesión
              </button>
            </div>
          ) : done ? (
            <div className="text-center space-y-4 animate-form-in">
              <div className="w-12 h-12 mx-auto rounded-xl grid place-items-center bg-ok/10 text-ok">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full py-3 rounded-xl bg-brand-deep text-paper text-sm font-semibold transition-all duration-200 hover:bg-brand-dark active:scale-[0.98] cursor-pointer"
              >
                Iniciar sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 animate-form-in">
              <label className="block">
                <span className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">
                  Nueva contraseña
                </span>
                <input
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-line bg-paper text-sm text-ink placeholder:text-faint transition-colors duration-200 focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">
                  Repetir contraseña
                </span>
                <input
                  type="password"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  placeholder="Repetí la contraseña"
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-line bg-paper text-sm text-ink placeholder:text-faint transition-colors duration-200 focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none"
                />
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-brand-deep text-paper text-sm font-semibold transition-all duration-200 hover:bg-brand-dark active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:active:scale-100"
              >
                {submitting ? "Guardando…" : "Guardar nueva contraseña"}
              </button>
            </form>
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
