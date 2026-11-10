import PendingBackend from "../../admin/PendingBackend";
import { SectionHeader } from "../ui";

export default function Notificaciones() {
  return (
    <div>
      <SectionHeader
        title="Notificaciones"
        description="Avisos vinculados a los movimientos de tu cuenta."
      />
      <PendingBackend
        title="Próximamente"
        description="Las notificaciones todavía no se sincronizan con el backend. No se muestran avisos guardados solo en este navegador."
      />
    </div>
  );
}
