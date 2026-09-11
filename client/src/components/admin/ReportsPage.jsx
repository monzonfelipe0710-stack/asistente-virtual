import { useState, useMemo } from "react";
import { users } from "../../data/mockUsers";
import { knowledgeBase } from "../../data/mockKnowledge";
import { sigedRecords } from "../../data/mockSiged";
import { documents } from "../../data/mockDocuments";
import { CountUp } from "./ui";

// Tareas administrativas iniciales adaptadas a ChatAP y SIGED
const INITIAL_TASKS = [
  {
    id: 1,
    title: "Auditar expediente EXP-2026-004",
    subtitle: "Documentación de liquidación de haberes observada",
    priority: "Alta",
    dueDate: "Vence hoy",
    completed: false,
  },
  {
    id: 2,
    title: "Validar solicitudes de Formulario F-04",
    subtitle: "Asignaciones familiares pendientes en Mesa de Entradas",
    priority: "Media",
    dueDate: "Vence mañana",
    completed: false,
  },
  {
    id: 3,
    title: "Actualizar instructivo de Licencias en ChatAP",
    subtitle: "Incorporar Decreto Provincial N° 124/26 a la base de conocimiento",
    priority: "Baja",
    dueDate: "Vence 15 Oct",
    completed: true,
  },
];

// Expedientes y solicitudes recientes adaptados al sistema provincial
const INITIAL_REQUESTS = [
  {
    id: 1,
    name: "María López",
    email: "m.lopez@formosa.gob.ar",
    tramite: "Licencia Anual Ordinaria",
    area: "Recursos Humanos",
    source: "ChatAP Bot",
    status: "Ingresado",
    expediente: "EXP-2026-001",
    date: "12 Jun 2026",
  },
  {
    id: 2,
    name: "Carlos Fernández",
    email: "c.fernandez@formosa.gob.ar",
    tramite: "Pase a Otra Repartición",
    area: "Sistemas",
    source: "SIGED Central",
    status: "En proceso",
    expediente: "EXP-2026-002",
    date: "11 Jun 2026",
  },
  {
    id: 3,
    name: "Ana Martínez",
    email: "a.martinez@formosa.gob.ar",
    tramite: "Certificación de Servicios",
    area: "Legajos",
    source: "Mesa Digital",
    status: "Finalizado",
    expediente: "EXP-2026-003",
    date: "10 Jun 2026",
  },
  {
    id: 4,
    name: "Pedro Gómez",
    email: "p.gomez@formosa.gob.ar",
    tramite: "Adelanto de Haberes",
    area: "Liquidaciones",
    source: "Portal Web",
    status: "Observado",
    expediente: "EXP-2026-004",
    date: "09 Jun 2026",
  },
  {
    id: 5,
    name: "Laura Rodríguez",
    email: "l.rodriguez@formosa.gob.ar",
    tramite: "Permiso por Estudio",
    area: "Recursos Humanos",
    source: "ChatAP Bot",
    status: "En proceso",
    expediente: "EXP-2026-005",
    date: "08 Jun 2026",
  },
  {
    id: 6,
    name: "Santiago Díaz",
    email: "s.diaz@formosa.gob.ar",
    tramite: "Informe de Legajo Personal",
    area: "Legajos",
    source: "Presencial",
    status: "Finalizado",
    expediente: "EXP-2026-006",
    date: "04 Jun 2026",
  },
  {
    id: 7,
    name: "Valentina Torres",
    email: "v.torres@formosa.gob.ar",
    tramite: "Cambio de Obra Social",
    area: "Recursos Humanos",
    source: "Mesa Digital",
    status: "Ingresado",
    expediente: "EXP-2026-007",
    date: "12 Jun 2026",
  },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState("30d");
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [newTaskInput, setNewTaskInput] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);

  // Filtros de tabla
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "knowledge"

  // Cálculos dinámicos de los datos del sistema
  const totalViews = useMemo(() => knowledgeBase.reduce((s, a) => s + a.views, 0), []);
  const totalDownloads = useMemo(() => documents.reduce((s, d) => s + d.downloads, 0), []);
  const activeArticles = useMemo(() => knowledgeBase.filter((a) => a.active).length, []);
  const topArticles = useMemo(() => [...knowledgeBase].sort((a, b) => b.views - a.views).slice(0, 5), []);
  const topDocs = useMemo(() => [...documents].sort((a, b) => b.downloads - a.downloads).slice(0, 5), []);
  const usersByRole = useMemo(() => ["Superadmin", "Administrador", "Ciudadano"].map((r) => ({
    label: r,
    count: users.filter((u) => u.role === r).length,
  })), []);
  const maxRole = useMemo(() => Math.max(...usersByRole.map((r) => r.count), 1), [usersByRole]);

  // Manejador de tareas
  const handleToggleTask = (id) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    const newTask = {
      id: Date.now(),
      title: newTaskInput.trim(),
      subtitle: "Ingresado recientemente por administración",
      priority: "Media",
      dueDate: "Vence pronto",
      completed: false,
    };
    setTasks((prev) => [newTask, ...prev]);
    setNewTaskInput("");
    setShowAddTask(false);
  };

  // Filtrado de expedientes/solicitudes
  const filteredRequests = useMemo(() => {
    return INITIAL_REQUESTS.filter((req) => {
      const matchesSearch =
        req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.tramite.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.expediente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || req.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  // Selección múltiple
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredRequests.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllSelected =
    filteredRequests.length > 0 && selectedIds.length === filteredRequests.length;

  // Pipeline de trámites
  const pipelineStages = [
    { label: "Mesa de Entrada", count: 45, pct: 30, color: "bg-blue-500", text: "text-blue-500" },
    { label: "En Dictamen", count: 32, pct: 21, color: "bg-purple-500", text: "text-purple-500" },
    { label: "Despacho RR.HH.", count: 24, pct: 16, color: "bg-cyan-500", text: "text-cyan-500" },
    { label: "Liquidaciones", count: 33, pct: 21, color: "bg-amber-500", text: "text-amber-500" },
    { label: "Finalizado", count: 18, pct: 12, color: "bg-emerald-500", text: "text-emerald-500" },
  ];

  // Gráfico de dona (Canales de Entrada)
  const channels = [
    { label: "ChatAP Bot", value: 380, color: "#3b82f6" },
    { label: "Mesa Digital", value: 265, color: "#06b6d4" },
    { label: "SIGED Central", value: 190, color: "#f59e0b" },
    { label: "Presencial", value: 100, color: "#8b5cf6" },
  ];
  const totalChannels = channels.reduce((acc, curr) => acc + curr.value, 0);

  // Configuración SVG Donut
  const donutRadius = 65;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let accumulatedOffset = 0;

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100 font-sans pb-10">
      {/* 1. Header Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white m-0">
              Reportes y Analíticas
            </h1>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              ChatAP · SIGED Formosa
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 m-0 mt-1">
            Métricas de atención ciudadana, expedientes en curso y rendimiento del sistema
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de periodo interactivo */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium">
            <button
              type="button"
              onClick={() => setPeriod("7d")}
              className={`px-3 py-1 rounded-md transition-all ${
                period === "7d"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              7 días
            </button>
            <button
              type="button"
              onClick={() => setPeriod("30d")}
              className={`px-3 py-1 rounded-md transition-all ${
                period === "30d"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              30 días
            </button>
            <button
              type="button"
              onClick={() => setPeriod("90d")}
              className={`px-3 py-1 rounded-md transition-all ${
                period === "90d"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              90 días
            </button>
          </div>

          {/* Selector de Rango de Fecha */}
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>15 Ago 2026 - 11 Sep 2026</span>
            <svg className="w-3 h-3 text-slate-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Botón de Descarga / Exportación estilo Shadcn */}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Descargar Informe</span>
          </button>
        </div>
      </div>

      {/* Tabs de vista: Dashboard General vs Base de Conocimiento */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("dashboard")}
          className={`pb-2 text-xs font-semibold px-3 transition-colors border-b-2 -mb-1 flex items-center gap-1.5 cursor-pointer ${
            activeTab === "dashboard"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Dashboard General & SIGED
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("knowledge")}
          className={`pb-2 text-xs font-semibold px-3 transition-colors border-b-2 -mb-1 flex items-center gap-1.5 cursor-pointer ${
            activeTab === "knowledge"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Lo Más Solicitado & Base de Conocimiento ({knowledgeBase.length})
        </button>
      </div>

      {/* 2. Fila 1: Cuatro Tarjetas KPI Superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Medidor circular de objetivo mensual */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Objetivo mensual
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
              Resolución de Trámites
            </h3>
          </div>

          <div className="my-3 flex items-center justify-between">
            {/* Medidor Radial Gauge SVG con aguja e indicador */}
            <div className="relative w-24 h-24 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-100 dark:text-slate-800"
                />
                {/* 76% de progreso */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray="238.76"
                  strokeDashoffset="57.3"
                  strokeLinecap="round"
                  className="text-blue-600 dark:text-blue-500 transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  76%
                </span>
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">
                  Cumplido
                </span>
              </div>
            </div>

            <div className="pl-3 flex-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Se ha resuelto el <strong className="text-slate-900 dark:text-white">76%</strong> de los expedientes dentro del plazo normativo.
            </div>
          </div>

          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Meta fijada: 80% al cierre del mes
          </div>
        </div>

        {/* KPI 2: Ciudadanos Atendidos */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ciudadanos Atendidos
            </span>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              <CountUp value={2450} />
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                +12.4%
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                vs mes anterior
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Expedientes SIGED */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Expedientes SIGED
            </span>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              <CountUp value={sigedRecords.length * 75} />
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                +8.2%
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                gestiones activas
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Consultas y Descargas */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Vistas e Interacciones
            </span>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              <CountUp value={totalViews + totalDownloads} />
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                +20.1%
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                vs mes anterior
              </span>
            </div>
          </div>
        </div>
      </div>

      {activeTab === "dashboard" ? (
        <>
          {/* 3. Fila 2: Tres Widgets Analíticos (Donut, Tareas, Pipeline) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Widget 1: Canales de Entrada (Donut Chart) */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                    Canales de Atención
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                    Origen de consultas y trámites
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => alert("Exportando datos de canales en CSV...")}
                  className="px-2.5 py-1 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Exportar
                </button>
              </div>

              {/* Donut SVG puro con texto central */}
              <div className="py-4 flex flex-col items-center justify-center">
                <div className="relative w-44 h-44">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                    {channels.map((ch, idx) => {
                      const strokeLength = (ch.value / totalChannels) * donutCircumference;
                      const offset = accumulatedOffset;
                      accumulatedOffset += strokeLength;
                      return (
                        <circle
                          key={idx}
                          cx="80"
                          cy="80"
                          r={donutRadius}
                          fill="transparent"
                          stroke={ch.color}
                          strokeWidth="22"
                          strokeDasharray={`${strokeLength} ${donutCircumference - strokeLength}`}
                          strokeDashoffset={-offset}
                          className="transition-all duration-700 hover:opacity-85"
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {totalChannels}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      Trámites
                    </span>
                  </div>
                </div>

                {/* Leyenda de 4 Canales */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mt-4 w-full text-xs">
                  {channels.map((ch) => (
                    <div key={ch.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: ch.color }}
                        />
                        <span className="text-slate-600 dark:text-slate-400">{ch.label}:</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {ch.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Widget 2: Tareas Administrativas */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                      Tareas y Pendientes
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                      Acciones administrativas urgentes
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddTask((prev) => !prev)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
                  >
                    + Nueva tarea
                  </button>
                </div>

                {/* Formulario rápido para añadir tarea */}
                {showAddTask && (
                  <form onSubmit={handleAddTask} className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={newTaskInput}
                      onChange={(e) => setNewTaskInput(e.target.value)}
                      placeholder="Escribe una nueva tarea..."
                      className="flex-1 px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Guardar
                    </button>
                  </form>
                )}

                {/* Lista de Tareas */}
                <div className="mt-3 space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(task.id)}
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => {}}
                        className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-semibold m-0 transition-colors ${
                            task.completed
                              ? "line-through text-slate-400 dark:text-slate-500"
                              : "text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                          }`}
                        >
                          {task.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0 mt-0.5 truncate">
                          {task.subtitle}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            task.priority === "Alta"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                              : task.priority === "Media"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {task.dueDate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex justify-between items-center">
                <span>
                  {tasks.filter((t) => t.completed).length} de {tasks.length} completadas
                </span>
                <span className="text-blue-500">Actualizado hace instantes</span>
              </div>
            </div>

            {/* Widget 3: Pipeline / Circuito de Expedientes SIGED */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                      Pipeline SIGED
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                      Circuito administrativo en curso
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                    152 Trámites
                  </span>
                </div>

                {/* Barra Segmentada Multicolor */}
                <div className="mt-4 flex h-3 w-full rounded-full overflow-hidden gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5">
                  {pipelineStages.map((stage) => (
                    <div
                      key={stage.label}
                      className={`h-full ${stage.color} first:rounded-l-full last:rounded-r-full transition-all duration-500 hover:opacity-85`}
                      style={{ width: `${stage.pct}%` }}
                      title={`${stage.label}: ${stage.count} trámites (${stage.pct}%)`}
                    />
                  ))}
                </div>

                {/* Etapas desglosadas */}
                <div className="mt-4 space-y-2.5">
                  {pipelineStages.map((stage) => (
                    <div key={stage.label} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {stage.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {stage.count} trámites
                        </span>
                        <span className="text-[11px] text-slate-400 w-8 text-right font-mono">
                          {stage.pct}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Tiempo medio de pase: <strong>1.8 días</strong></span>
                <span className="text-emerald-500 font-medium">✓ Circuito fluido</span>
              </div>
            </div>
          </div>

          {/* 4. Fila 3: Tabla de Solicitudes y Expedientes Recientes */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                  Expedientes y Trámites Recientes
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                  Seguimiento en tiempo real de gestiones ingresadas
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Input de filtro */}
                <div className="relative">
                  <svg
                    className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filtrar expedientes o trámites..."
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-56"
                  />
                </div>

                {/* Botón de filtros rápidos */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowFilterDropdown((prev) => !prev)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span>Filtros</span>
                  </button>

                  {/* Dropdown de estados */}
                  {showFilterDropdown && (
                    <div className="absolute right-0 mt-1 w-44 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-20 p-1 text-xs">
                      <div className="px-2 py-1 font-semibold text-slate-400 text-[10px] uppercase">
                        Filtrar por Estado
                      </div>
                      {["all", "Finalizado", "En proceso", "Observado", "Ingresado"].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            setStatusFilter(st);
                            setShowFilterDropdown(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-md transition-colors ${
                            statusFilter === st
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 font-semibold"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                          }`}
                        >
                          {st === "all" ? "Todos los estados" : st}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tabla responsive con checkboxes y estados Shadcn */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-2 w-8">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-3">Solicitante</th>
                    <th className="py-3 px-3">Trámite / Asunto</th>
                    <th className="py-3 px-3">Canal</th>
                    <th className="py-3 px-3">Estado</th>
                    <th className="py-3 px-3">N° Expediente</th>
                    <th className="py-3 px-3">Fecha</th>
                    <th className="py-3 px-2 w-8 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRequests.map((row) => {
                    const isSelected = selectedIds.includes(row.id);
                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                          isSelected ? "bg-blue-50/60 dark:bg-blue-950/20" : ""
                        }`}
                      >
                        <td className="py-3 px-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(row.id)}
                            className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {row.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {row.email}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {row.tramite}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Área: {row.area}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {row.source}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {/* Badges de Estado Shadcn */}
                          {row.status === "Finalizado" && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Finalizado
                            </span>
                          )}
                          {row.status === "En proceso" && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-300 dark:border-blue-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              En proceso
                            </span>
                          )}
                          {row.status === "Observado" && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Observado
                            </span>
                          )}
                          {row.status === "Ingresado" && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-300 dark:border-purple-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                              Ingresado
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {row.expediente}
                        </td>
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {row.date}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <button
                            type="button"
                            onClick={() => alert(`Detalles del trámite ${row.expediente} de ${row.name}`)}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            title="Opciones"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRequests.length === 0 && (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-400">
                        No se encontraron expedientes con los criterios seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginador y Selección */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              <div>
                {selectedIds.length} de {filteredRequests.length} fila(s) seleccionadas.
              </div>

              <div className="flex items-center gap-4">
                <span>1 - {filteredRequests.length} de {filteredRequests.length} expedientes</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled
                    className="p-1 rounded border border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed text-slate-400"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    disabled
                    className="p-1 rounded border border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed text-slate-400"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* 5. Sección: Lo más solicitado & Base de Conocimiento (Visible siempre o en tab) */}
      <div className={`space-y-6 ${activeTab === "dashboard" ? "mt-8" : ""}`}>
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white m-0">
              Lo Más Solicitado en ChatAP
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">
              Consultas ciudadanas más frecuentes y formularios descargados
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {knowledgeBase.length} artículos · {activeArticles} activos
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preguntas más frecuentes */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Preguntas Más Frecuentes
            </h3>
            <div className="space-y-2">
              {topArticles.map((a, i) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                        : i === 1
                        ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        : "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 m-0 truncate">
                      {a.question}
                    </p>
                    <p className="text-[10px] text-slate-400 m-0">
                      Categoría: {a.category}
                    </p>
                  </div>
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">
                    <CountUp value={a.views} /> vistas
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Documentos más descargados */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Documentos y Formularios Más Descargados
            </h3>
            <div className="space-y-2">
              {topDocs.map((d, i) => (
                <div
                  key={d.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 m-0 truncate">
                      {d.title}
                    </p>
                    <p className="text-[10px] text-slate-400 m-0">
                      {d.category} · {d.format} · {d.fileSize}
                    </p>
                  </div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    <CountUp value={d.downloads} /> descargas
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Distribución de usuarios por rol */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Usuarios por Rol
            </h3>
            <div className="space-y-2">
              {usersByRole.map((r) => (
                <div key={r.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700 dark:text-slate-300">{r.label}</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">{r.count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${(r.count / maxRole) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4 shadow-sm flex flex-col justify-between">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Estado Operativo de Usuarios
            </h3>
            <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 gap-0.5">
              <div className="h-full bg-emerald-500" style={{ width: "94%" }} title="Activos: 94%" />
              <div className="h-full bg-slate-400" style={{ width: "6%" }} title="Inactivos: 6%" />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                <span className="text-xs text-slate-500">Activos</span>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 m-0">94%</p>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                <span className="text-xs text-slate-500">Inactivos</span>
                <p className="text-lg font-bold text-slate-500 m-0">6%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
