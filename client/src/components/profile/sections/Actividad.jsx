import PendingBackend from "../../admin/PendingBackend";
import { SectionHeader } from "../ui";

export default function Actividad() {
  return (
    <div>
      <SectionHeader
        title="Mi actividad"
        description="Acciones registradas de tu cuenta."
      />
      <PendingBackend
        title="Próximamente"
        description="La API de auditoría todavía no está disponible. No se muestran eventos de demostración como actividad real."
      />
    </div>
  );
}
