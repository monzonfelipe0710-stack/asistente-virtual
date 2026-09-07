import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useProfileData } from "./useProfileData";
import ProfileHeader from "./ProfileHeader";
import { Icon, ICONS } from "./ui";
import Resumen from "./sections/Resumen";
import Tramites from "./sections/Tramites";
import Solicitudes from "./sections/Solicitudes";
import Conversaciones from "./sections/Conversaciones";
import Actividad from "./sections/Actividad";
import Notificaciones from "./sections/Notificaciones";
import Seguridad from "./sections/Seguridad";
import Permisos from "./sections/Permisos";
import Auditoria from "./sections/Auditoria";

export default function ProfileLayout() {
  const { isSuperadmin, userRole } = useAuth();
  const data = useProfileData();
  const [go, setGo] = useState(null);

  const isStaff = userRole === "Administrador" || isSuperadmin;

  const nav =
    isSuperadmin
      ? [
          { key: "resumen", label: "Resumen", icon: ICONS.activity },
          { key: "permisos", label: "Permisos", icon: ICONS.shield },
          { key: "auditoria", label: "Auditoría", icon: ICONS.activity },
          { key: "seguridad", label: "Seguridad", icon: ICONS.lock },
        ]
      : isStaff
      ? [
          { key: "resumen", label: "Resumen", icon: ICONS.activity },
          { key: "permisos", label: "Permisos", icon: ICONS.shield },
          { key: "seguridad", label: "Seguridad", icon: ICONS.lock },
        ]
      : [
          { key: "resumen", label: "Resumen", icon: ICONS.activity },
          { key: "tramites", label: "Mis trámites", icon: ICONS.tramite },
          { key: "solicitudes", label: "Mis solicitudes", icon: ICONS.solicitud },
          { key: "conversaciones", label: "Mis conversaciones", icon: ICONS.chat },
          { key: "actividad", label: "Mi actividad", icon: ICONS.activity },
          { key: "notificaciones", label: "Notificaciones", icon: ICONS.bell },
          { key: "seguridad", label: "Seguridad", icon: ICONS.shield },
        ];

  const [active, setActive] = useState(nav[0].key);
  const normalized = go || active;

  const target = nav.find((n) => n.key === normalized) || nav[0];

  function renderSection(key) {
    switch (key) {
      case "resumen":
        return <Resumen data={data} role={userRole} onGo={setGo} />;
      case "tramites":
        return <Tramites />;
      case "solicitudes":
        return <Solicitudes />;
      case "conversaciones":
        return <Conversaciones />;
      case "actividad":
        return <Actividad />;
      case "notificaciones":
        return <Notificaciones />;
      case "seguridad":
        return <Seguridad />;
      case "permisos":
        return isStaff ? <Permisos /> : null;
      case "auditoria":
        return isSuperadmin ? <Auditoria /> : null;
      default:
        return null;
    }
  }

  return (
    <div className="min-h-full flex flex-col bg-paper">
      <main className="flex-1 w-full ed-max section-bleed py-12 lg:py-16" key={normalized}>
        <ProfileHeader />

        {/* Pestañas */}
        <div className="flex gap-2 overflow-x-auto pb-2 mt-10 -mx-1 px-1" aria-label="Secciones del perfil">
          {nav.map((n) => {
            const isActive = target.key === n.key;
            return (
              <button
                key={n.key}
                onClick={() => {
                  setActive(n.key);
                  setGo(null);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold rounded-full border whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? "bg-ink text-paper border-ink"
                    : "bg-paper text-muted border-line hover:text-ink hover:bg-mist"
                }`}
              >
                <Icon path={n.icon} className="w-4 h-4" />
                {n.label}
              </button>
            );
          })}
        </div>

        <div className="mt-8 animate-page-enter" key={normalized}>
          {renderSection(target.key)}
        </div>
      </main>
    </div>
  );
}