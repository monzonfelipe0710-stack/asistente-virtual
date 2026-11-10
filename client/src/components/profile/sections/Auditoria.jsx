import PendingBackend from "../../admin/PendingBackend";
import { SectionHeader } from "../ui";

export default function Auditoria() {
  return (
    <div>
      <SectionHeader
        title="Actividad del sistema"
        description="Registro de auditoría de las acciones administrativas."
      />
      <PendingBackend
        title="Próximamente"
        description="La API de auditoría del sistema no está incluida en el backend actual. No se presentan datos de ejemplo."
      />
    </div>
  );
}
