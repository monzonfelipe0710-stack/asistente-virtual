import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./components/common/Toast";
import CiudadanoPage from "./pages/CiudadanoPage";
import AdminLayout from "./pages/AdminLayout";
import ContactoPage from "./pages/ContactoPage";
import NotFoundPage from "./pages/NotFoundPage";
import Dashboard from "./components/admin/Dashboard";
import UserTable from "./components/admin/UserTable";
import KnowledgeManager from "./components/admin/KnowledgeManager";
import SigedIntegration from "./components/admin/SigedIntegration";
import DocumentManager from "./components/admin/DocumentManager";
import ChatbotSettings from "./components/admin/ChatbotSettings";
import ReportsPage from "./components/admin/ReportsPage";

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CiudadanoPage />} />
          <Route path="/contacto" element={<ContactoPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="usuarios" element={<UserTable />} />
            <Route path="conocimiento" element={<KnowledgeManager />} />
            <Route path="siged" element={<SigedIntegration />} />
            <Route path="documentos" element={<DocumentManager />} />
            <Route path="configuracion" element={<ChatbotSettings />} />
            <Route path="reportes" element={<ReportsPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
