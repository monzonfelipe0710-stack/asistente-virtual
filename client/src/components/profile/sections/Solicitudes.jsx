import PendingBackend from "../../admin/PendingBackend";
import { SectionHeader } from "../ui";

export default function Solicitudes() {
  return (
    <div>
      <SectionHeader
        title="Mis solicitudes"
        description="Solicitudes de acceso y su resolución."
      />
      <PendingBackend
        title="Próximamente"
        description="El flujo de solicitudes de empleados quedó fuera del backend actual. No se muestran solicitudes almacenadas localmente como registros oficiales."
      />
    </div>
  );
}
