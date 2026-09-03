import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";
import { useAdmin, ROLES } from "../context/AdminContext";

function ThemeToggle() {
  const [dark, setDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("animate-theme-transition");
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    const timer = setTimeout(
      () => root.classList.remove("animate-theme-transition"),
      250
    );
    return () => clearTimeout(timer);
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      aria-label="Cambiar tema"
      className="w-10 h-10 grid place-items-center rounded-lg transition-all duration-200 cursor-pointer"
      style={{
        border: "1px solid var(--sidebar-border)",
        color: "var(--sidebar-text)",
        backgroundColor: "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--sidebar-hover)";
        e.currentTarget.style.color = "var(--sidebar-text-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = "var(--sidebar-text)";
      }}
    >
      {dark ? (
        <svg
          className="w-5 h-5 transition-transform duration-300 rotate-0 hover:rotate-45"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg
          className="w-5 h-5 transition-transform duration-300 hover:-rotate-45"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
          />
        </svg>
      )}
    </button>
  );
}

export default function AdminLayout() {
  const { role, setRole } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div
      className="min-h-screen flex transition-colors duration-300"
      style={{ backgroundColor: "var(--color-paper)" }}
    >
      <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} />

      <div
        className="flex-1 flex flex-col min-w-0 transition-[margin] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
        style={{
          marginLeft: sidebarOpen ? "var(--sidebar-width)" : "var(--sidebar-collapsed-width)",
        }}
      >
        {/* Header */}
        <header
          className="h-14 flex items-center justify-end px-4 lg:px-6 sticky top-0 z-30 backdrop-blur-md"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-paper) 80%, transparent)",
          }}
        >
          <div className="flex items-center gap-3">
            <label
              className="hidden sm:flex items-center gap-2 text-xs"
              style={{ color: "var(--sidebar-text)" }}
            >
              Rol:
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="px-3 py-1.5 rounded text-xs font-medium transition-colors duration-200 cursor-pointer"
                style={{
                  backgroundColor: "var(--sidebar-hover)",
                  border: "1px solid var(--sidebar-border)",
                  color: "var(--sidebar-text-hover)",
                  outline: "none",
                  appearance: "none",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--sidebar-active-bg)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--sidebar-border)")
                }
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <ThemeToggle />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="animate-page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
