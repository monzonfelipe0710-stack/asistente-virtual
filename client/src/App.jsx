import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ToastProvider } from "./components/common/Toast";
import { AdminProvider } from "./context/AdminContext";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import CiudadanoPage from "./pages/CiudadanoPage";
import HomePage from "./pages/HomePage";
import LoginRegisterPage from "./pages/LoginRegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import BotOnboardingModal from "./components/common/BotOnboardingModal";

const EXIT_MS = 240;

function PageTransition({ children }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [phase, setPhase] = useState("enter");
  const prevKeyRef = useRef(location.key);

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (prevKeyRef.current === location.key) return;
    prevKeyRef.current = location.key;

    if (reduceMotion) {
      setDisplayLocation(location);
      setPhase("enter");
      return;
    }

    setPhase("exit");
    const t = setTimeout(() => {
      setDisplayLocation(location);
      setPhase("enter");
    }, EXIT_MS);
    return () => clearTimeout(t);
  }, [location, reduceMotion]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [displayLocation.key]);

  const animClass =
    phase === "exit" && !reduceMotion ? "animate-page-exit" : "animate-page-enter";

  return (
    <div key={displayLocation.key} className={animClass}>
      <Routes location={displayLocation}>{children}</Routes>
    </div>
  );
}

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper text-muted text-sm uppercase tracking-widest">
      Cargando…
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ChatProvider>
          <AdminProvider>
            <BrowserRouter>
              <BotOnboardingModal />
              <PageTransition>
                <Route path="/" element={<HomePage />} />
                <Route path="/chat" element={<CiudadanoPage />} />
                <Route path="/login" element={<LoginRegisterPage />} />
                <Route path="/restablecer" element={<ResetPasswordPage />} />
                <Route
                  path="/contacto"
                  element={
                    <Suspense fallback={<PageFallback />}>
                      <ContactoPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/soporte"
                  element={
                    <Suspense fallback={<PageFallback />}>
                      <ContactoPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/perfil"
                  element={
                    <Suspense fallback={<PageFallback />}>
                      <ProfilePage />
                    </Suspense>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <Suspense fallback={<PageFallback />}>
                      <AdminLayout />
                    </Suspense>
                  }
                >
                  <Route index element={<Suspense fallback={<PageFallback />}><AdminDashboard /></Suspense>} />
                  <Route path="solicitudes" element={<Suspense fallback={<PageFallback />}><EmployeeApprovals /></Suspense>} />
                  <Route path="usuarios" element={<Suspense fallback={<PageFallback />}><UserTable /></Suspense>} />
                  <Route path="mesa-de-entrada" element={<Suspense fallback={<PageFallback />}><MesaDeEntrada /></Suspense>} />
                  <Route path="conocimiento" element={<Suspense fallback={<PageFallback />}><KnowledgeManager /></Suspense>} />
                  <Route path="siged" element={<Suspense fallback={<PageFallback />}><SigedIntegration /></Suspense>} />
                  <Route path="documentos" element={<Suspense fallback={<PageFallback />}><DocumentManager /></Suspense>} />
                  <Route path="configuracion" element={<Suspense fallback={<PageFallback />}><ChatbotSettings /></Suspense>} />
                  <Route path="reportes" element={<Suspense fallback={<PageFallback />}><ReportsPage /></Suspense>} />
                </Route>
                <Route
                  path="*"
                  element={
                    <Suspense fallback={<PageFallback />}>
                      <NotFoundPage />
                    </Suspense>
                  }
                />
              </PageTransition>
            </BrowserRouter>
          </AdminProvider>
        </ChatProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

const AdminLayout = lazy(() => import("./pages/AdminLayout"));
const ContactoPage = lazy(() => import("./pages/ContactoPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const AdminDashboard = lazy(() => import("./components/admin/Dashboard"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const EmployeeApprovals = lazy(() => import("./components/admin/EmployeeApprovals"));
const UserTable = lazy(() => import("./components/admin/UserTable"));
const KnowledgeManager = lazy(() => import("./components/admin/KnowledgeManager"));
const SigedIntegration = lazy(() => import("./components/admin/SigedIntegration"));
const DocumentManager = lazy(() => import("./components/admin/DocumentManager"));
const ChatbotSettings = lazy(() => import("./components/admin/ChatbotSettings"));
const ReportsPage = lazy(() => import("./components/admin/ReportsPage"));
const MesaDeEntrada = lazy(() => import("./components/admin/MesaDeEntrada"));
