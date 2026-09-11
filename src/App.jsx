import { ToastProvider } from "./components/common/Toast";
import AppErrorBoundary from "./components/common/AppErrorBoundary";
import { AdminProvider } from "./context/AdminContext";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import AppRouter from "./router/AppRouter";

export default function App() {
  return (
    <AppErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <ChatProvider>
            <AdminProvider>
              <AppRouter />
            </AdminProvider>
          </ChatProvider>
        </AuthProvider>
      </ToastProvider>
    </AppErrorBoundary>
  );
}
