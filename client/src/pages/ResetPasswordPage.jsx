import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import ChatBotAvatar from "../components/ChatBotAvatar";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/common/Toast";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const toast = useToast();
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [restaurando, setRestaurando] = useState(false);
  const [errorReset, setErrorReset] = useState("");

  const hasToken = Boolean(token);

  async function handleReset(e) {
    e.preventDefault();
    if (nuevaPassword.length < 8) {
      setErrorReset("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      setErrorReset("Las contraseñas no coinciden.");
      return;
    }
    setErrorReset("");
    setRestaurando(true);
    try {
      await resetPassword(token, nuevaPassword);
      toast("Contraseña actualizada. Ya podés iniciar sesión.", "success");
      navigate("/login", { replace: true });
    } catch (err) {
      setErrorReset(err?.message || "No se pudo restablecer la contraseña.");
      setRestaurando(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-paper">
      <main
        id="contenido"
        aria-label="Restablecer contraseña"
        className="flex-1 flex items-center justify-center px-4 py-10"
      >
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-4">
              <ChatBotAvatar size={64} reaction={hasToken ? "idle" : "worried"} />
            </div>
            <h1 className="text-2xl font-bold text-ink m-0 animate-type-in">
              {hasToken ? "Restablecer contraseña" : "Enlace no válido"}
            </h1>
            <p
              className="text-muted text-sm mt-1 m-0 animate-type-in"
              style={{ animationDelay: "80ms" }}
            >
              {hasToken
                ? "Ingresá tu nueva contraseña para restablecer el acceso."
                : "Ese enlace venció o no es válido."}
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-mist p-6 sm:p-8 shadow-soft">
            {!hasToken ? (
              <div className="text-center space-y-4 animate-form-in">
                <div className="w-12 h-12 mx-auto rounded-xl grid place-items-center bg-bad/10 text-bad">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-muted m-0">
                  Pedí un enlace nuevo desde{" "}
                  <span className="font-semibold text-ink">“Olvidé mi contraseña”</span>{" "}
                  en el inicio de sesión.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full py-3 rounded-xl bg-brand-deep text-paper text-sm font-semibold transition-all duration-200 hover:bg-brand-dark active:scale-[0.98] cursor-pointer"
                >
                  Ir a iniciar sesión
                </button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="text-center space-y-4 animate-form-in">
                <div className="w-12 h-12 mx-auto rounded-xl grid place-items-center bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink dark:text-white m-0">Restablecer contraseña</h2>
                  <p className="text-sm text-muted mt-2 m-0">
                    Ingresá tu nueva contraseña. El backend ya validó el enlace de
                    recuperación antes de permitir el cambio.
                  </p>
                </div>
                <div className="space-y-3 text-left">
                  <div>
                    <label htmlFor="reset-password-nueva" className="block text-sm font-medium text-muted mb-1.5">
                      Nueva contraseña
                    </label>
                    <input
                      id="reset-password-nueva"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={nuevaPassword}
                      onChange={(e) => setNuevaPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full px-4 py-3 rounded-xl border border-line bg-card text-sm text-ink placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="reset-password-confirmar" className="block text-sm font-medium text-muted mb-1.5">
                      Confirmar nueva contraseña
                    </label>
                    <input
                      id="reset-password-confirmar"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={confirmarPassword}
                      onChange={(e) => setConfirmarPassword(e.target.value)}
                      placeholder="Repetí la nueva contraseña"
                      className="w-full px-4 py-3 rounded-xl border border-line bg-card text-sm text-ink placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                    />
                  </div>
                </div>
                {errorReset && <p className="text-sm text-bad m-0">{errorReset}</p>}
                <button
                  type="submit"
                  disabled={restaurando}
                  className="w-full py-3 rounded-xl bg-brand-deep text-paper text-sm font-semibold transition-all duration-200 hover:bg-brand-dark active:scale-[0.98] cursor-pointer disabled:opacity-60"
                >
                  {restaurando ? "Guardando…" : "Establecer nueva contraseña"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full py-3 rounded-xl border border-line text-sm font-semibold text-muted hover:text-ink transition-all duration-200 cursor-pointer"
                >
                  Volver a iniciar sesión
                </button>
              </form>
            )}
          </div>

          <div className="text-center mt-6">
            <Link
              to="/"
              className="text-sm text-muted hover:text-brand-deep transition-colors no-underline"
            >
              ← Volver al chat
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
