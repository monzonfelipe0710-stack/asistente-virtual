import { lazy, Suspense } from "react";
import { Route } from "react-router-dom";
import CiudadanoPage from "../pages/CiudadanoPage";
import HomePage from "../pages/HomePage";
import LoginRegisterPage from "../pages/LoginRegisterPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";

const AdminLayout = lazy(() => import("../pages/AdminLayout"));
const ContactoPage = lazy(() => import("../pages/ContactoPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const AdminDashboard = lazy(() => import("../components/admin/Dashboard"));
const ProfilePage = lazy(() => import("../pages/ProfilePage"));
const EmployeeApprovals = lazy(() => import("../components/admin/EmployeeApprovals"));
const UserTable = lazy(() => import("../components/admin/UserTable"));
const KnowledgeManager = lazy(() => import("../components/admin/KnowledgeManager"));
const SigedIntegration = lazy(() => import("../components/admin/SigedIntegration"));
const DocumentManager = lazy(() => import("../components/admin/DocumentManager"));
const ChatbotSettings = lazy(() => import("../components/admin/ChatbotSettings"));
const ReportsPage = lazy(() => import("../components/admin/ReportsPage"));
const MesaDeEntrada = lazy(() => import("../components/admin/MesaDeEntrada"));

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper text-muted text-sm uppercase tracking-widest">
      Cargando…
    </div>
  );
}

function Lazy({ children }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}

export default function AppRoutes() {
  return (
    <>
      <Route path="/" element={<HomePage />} />
      <Route path="/chat" element={<CiudadanoPage />} />
      <Route path="/login" element={<LoginRegisterPage />} />
      <Route path="/restablecer" element={<ResetPasswordPage />} />

      <Route path="/contacto" element={<Lazy><ContactoPage /></Lazy>} />
      <Route path="/soporte" element={<Lazy><ContactoPage /></Lazy>} />
      <Route path="/perfil" element={<Lazy><ProfilePage /></Lazy>} />

      <Route path="/admin" element={<Lazy><AdminLayout /></Lazy>}>
        <Route index element={<Lazy><AdminDashboard /></Lazy>} />
        <Route path="solicitudes" element={<Lazy><EmployeeApprovals /></Lazy>} />
        <Route path="usuarios" element={<Lazy><UserTable /></Lazy>} />
        <Route path="mesa-de-entrada" element={<Lazy><MesaDeEntrada /></Lazy>} />
        <Route path="conocimiento" element={<Lazy><KnowledgeManager /></Lazy>} />
        <Route path="siged" element={<Lazy><SigedIntegration /></Lazy>} />
        <Route path="documentos" element={<Lazy><DocumentManager /></Lazy>} />
        <Route path="configuracion" element={<Lazy><ChatbotSettings /></Lazy>} />
        <Route path="reportes" element={<Lazy><ReportsPage /></Lazy>} />
      </Route>

      <Route path="*" element={<Lazy><NotFoundPage /></Lazy>} />
    </>
  );
}
