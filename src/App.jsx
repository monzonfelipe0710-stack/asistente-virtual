import { ToastProvider } from "./components/common/Toast";
import AppErrorBoundary from "./components/common/AppErrorBoundary";
import { AdminProvider } from "./context/AdminContext";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import ClickSpark from "./components/common/ClickSpark";
import AppRouter from "./router/AppRouter";

export default function App() {
  return (
    <AppErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <ChatProvider>
            <AdminProvider>
              <ClickSpark>
                <AppRouter />
              </ClickSpark>
            </AdminProvider>
          </ChatProvider>
        </AuthProvider>
      </ToastProvider>
    </AppErrorBoundary>
  );
}
