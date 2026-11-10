import PendingBackend from "../../admin/PendingBackend";
import { SectionHeader } from "../ui";

export default function Tramites() {
  return (
    <div>
      <SectionHeader
        title="Mis trámites"
        description="Consulta personal de trámites y expedientes."
      />
      <PendingBackend
        title="Próximamente"
        description="El backend todavía no vincula expedientes personales de forma verificable con esta cuenta."
      />
    </div>
  );
}
