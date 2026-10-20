import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import ProfileLayout from "../components/profile/ProfileLayout";

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-paper">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full text-center animate-scale-in">
            <div className="w-14 h-14 mx-auto rounded-2xl grid place-items-center bg-brand-deep/10 text-brand-deep mb-6">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="kicker m-0">[ Mi perfil ]</p>
            <h2 className="display-3 text-ink m-0 mt-4">SESIÓN REQUERIDA.</h2>
            <p className="text-sm text-muted font-medium mt-4 mb-8">
              Iniciá sesión para ver tu perfil, tus trámites y tus conversaciones.
            </p>
            <button onClick={() => navigate("/login")} className="btn-primary">
              Iniciar sesión
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <Navbar />
      <ProfileLayout />
      <Footer />
    </div>
  );
}