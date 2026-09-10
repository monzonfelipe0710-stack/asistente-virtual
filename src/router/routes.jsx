import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAdmin } from "../context/AdminContext";
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

function StaffRoute() {
  const { user, userRole } = useAuth();
  const location = useLocation();

  if (!user || user.status === "Suspendido") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (userRole !== "Superadmin" && userRole !== "Administrador") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

function PermissionRoute({ permission }) {
  const { can } = useAdmin();
  const location = useLocation();

  if (!can(permission)) {
    return <Navigate to="/admin" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default function AppRoutes({ location }) {
  return (
    <Routes location={location}>
      <Route path="/" element={<HomePage />} />
      <Route path="/chat" element={<CiudadanoPage />} />
      <Route path="/login" element={<LoginRegisterPage />} />
      <Route path="/restablecer" element={<ResetPasswordPage />} />

      <Route path="/contacto" element={<Lazy><ContactoPage /></Lazy>} />
      <Route path="/soporte" element={<Lazy><ContactoPage /></Lazy>} />
      <Route path="/perfil" element={<Lazy><ProfilePage /></Lazy>} />

      <Route element={<StaffRoute />}>
        <Route path="/admin" element={<Lazy><AdminLayout /></Lazy>}>
          <Route element={<PermissionRoute permission="dashboard" />}>
            <Route index element={<Lazy><AdminDashboard /></Lazy>} />
          </Route>
          <Route element={<PermissionRoute permission="solicitudes" />}>
            <Route path="solicitudes" element={<Lazy><EmployeeApprovals /></Lazy>} />
          </Route>
          <Route element={<PermissionRoute permission="usuarios" />}>
            <Route path="usuarios" element={<Lazy><UserTable /></Lazy>} />
          </Route>
          <Route element={<PermissionRoute permission="mesa_entrada" />}>
            <Route path="mesa-de-entrada" element={<Lazy><MesaDeEntrada /></Lazy>} />
          </Route>
          <Route element={<PermissionRoute permission="conocimiento" />}>
            <Route path="conocimiento" element={<Lazy><KnowledgeManager /></Lazy>} />
          </Route>
          <Route element={<PermissionRoute permission="siged" />}>
            <Route path="siged" element={<Lazy><SigedIntegration /></Lazy>} />
          </Route>
          <Route element={<PermissionRoute permission="documentos" />}>
            <Route path="documentos" element={<Lazy><DocumentManager /></Lazy>} />
          </Route>
          <Route element={<PermissionRoute permission="configuracion" />}>
            <Route path="configuracion" element={<Lazy><ChatbotSettings /></Lazy>} />
          </Route>
          <Route element={<PermissionRoute permission="reportes" />}>
            <Route path="reportes" element={<Lazy><ReportsPage /></Lazy>} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Lazy><NotFoundPage /></Lazy>} />
    </Routes>
  );
}
