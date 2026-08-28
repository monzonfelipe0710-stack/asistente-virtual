import Navbar from "../components/common/Navbar";
import ChatWindow from "../components/ciudadano/ChatWindow";

export default function CiudadanoPage() {
  return (
    <div className="h-screen flex flex-col bg-paper">
      <Navbar />
      <main className="flex-1 min-h-0">
        <ChatWindow />
      </main>
    </div>
  );
}
