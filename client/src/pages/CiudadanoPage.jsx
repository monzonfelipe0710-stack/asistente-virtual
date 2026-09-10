import { useLocation } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import ChatWindow from "../components/ciudadano/ChatWindow";

export default function CiudadanoPage() {
  const location = useLocation();
  const initialQuery = location.state?.initialQuery || null;

  return (
    <div className="h-screen flex flex-col bg-paper">
      <Navbar />
      <main className="flex-1 min-h-0">
        <ChatWindow initialQuery={initialQuery} />
      </main>
    </div>
  );
}

