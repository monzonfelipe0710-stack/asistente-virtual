import Navbar from "../components/common/Navbar";
import ChatWindow from "../components/ciudadano/ChatWindow";

export default function CiudadanoPage() {
  return (
    <div className="chatap-chat-shell h-screen flex flex-col bg-paper">
      <Navbar />
      <main className="chatap-chat-main flex-1 min-h-0">
        <ChatWindow />
      </main>
    </div>
  );
}
