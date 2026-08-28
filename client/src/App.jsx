import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./components/common/Toast";
import { AdminProvider } from "./context/AdminContext";
import CiudadanoPage from "./pages/CiudadanoPage";

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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CiudadanoPage />} />
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
              <AdminProvider>
                <Suspense fallback={<PageFallback />}>
                  <AdminLayout />
                </Suspense>
              </AdminProvider>
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
        </Routes>
      </BrowserRouter>
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
