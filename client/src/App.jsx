import { lazy, Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "./components/common/Toast";
import { AdminProvider } from "./context/AdminContext";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import CiudadanoPage from "./pages/CiudadanoPage";
import LoginRegisterPage from "./pages/LoginRegisterPage";
import AnimatedRoutes from "./components/common/AnimatedRoutes";
import { Route } from "react-router-dom";

const AdminLayout = lazy(() => import("./pages/AdminLayout"));
const ContactoPage = lazy(() => import("./pages/ContactoPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

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
              <AnimatedRoutes>
                <Route path="/" element={<CiudadanoPage />} />
                <Route path="/login" element={<LoginRegisterPage />} />
                <Route
                  path="/contacto"
                  element={
                    <Suspense fallback={<PageFallback />}>
                      <ContactoPage />
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
              </AnimatedRoutes>
            </BrowserRouter>
          </AdminProvider>
        </ChatProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

const AdminDashboard = lazy(() => import("./components/admin/Dashboard"));
const UserTable = lazy(() => import("./components/admin/UserTable"));
const KnowledgeManager = lazy(() => import("./components/admin/KnowledgeManager"));
const SigedIntegration = lazy(() => import("./components/admin/SigedIntegration"));
const DocumentManager = lazy(() => import("./components/admin/DocumentManager"));
const ChatbotSettings = lazy(() => import("./components/admin/ChatbotSettings"));
const ReportsPage = lazy(() => import("./components/admin/ReportsPage"));
const MesaDeEntrada = lazy(() => import("./components/admin/MesaDeEntrada"));
