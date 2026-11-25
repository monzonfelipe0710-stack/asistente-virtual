import { BrowserRouter, Routes, Route } from "react-router-dom";
import CiudadanoPage from "./pages/CiudadanoPage";
import AdminLayout from "./pages/AdminLayout";
import Dashboard from "./components/admin/Dashboard";
import UserTable from "./components/admin/UserTable";
import KnowledgeManager from "./components/admin/KnowledgeManager";
import SigedIntegration from "./components/admin/SigedIntegration";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CiudadanoPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="usuarios" element={<UserTable />} />
          <Route path="conocimiento" element={<KnowledgeManager />} />
          <Route path="siged" element={<SigedIntegration />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
