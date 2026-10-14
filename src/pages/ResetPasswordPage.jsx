import { Link, useSearchParams, useNavigate } from "react-router-dom";
import ChatBotAvatar from "../components/ChatBotAvatar";
import Footer from "../components/common/Footer";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();

  // El reseteo lo gestiona el backend: genera el token, lo manda por mail y lo
  // valida. Acá solo se muestra la UI; se conectará al endpoint cuando exista.
  const hasToken = Boolean(token);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-paper">
      <div className="flex-1 flex items-center justify-center px-4 py-10">
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
                ? "Este flujo estará disponible próximamente."
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
              <div className="text-center space-y-4 animate-form-in">
                <div className="w-12 h-12 mx-auto rounded-xl grid place-items-center bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-muted m-0">
                  <span className="font-semibold text-ink">Pendiente de backend.</span> El
                  restablecimiento lo hace el backend: valida este enlace y recién ahí
                  permite definir la nueva contraseña. La pantalla se conecta cuando exista
                  el endpoint.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full py-3 rounded-xl bg-brand-deep text-paper text-sm font-semibold transition-all duration-200 hover:bg-brand-dark active:scale-[0.98] cursor-pointer"
                >
                  Volver a iniciar sesión
                </button>
              </div>
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
      </div>
      <Footer />
    </div>
  );
}
