import { useLocation } from "react-router-dom";
import ChatWindow from "../components/ciudadano/ChatWindow";

export default function CiudadanoPage() {
  const location = useLocation();
  const initialQuery = location.state?.initialQuery || null;

  return (
    <div className="chat-page-shell h-[100dvh] overflow-hidden bg-paper">
      <main id="contenido" aria-label="Chat con el asistente" className="h-full min-h-0">
        <h1 className="sr-only">ChatAP — Asistente de trámites</h1>
        <ChatWindow initialQuery={initialQuery} />
      </main>
    </div>
  );
}
