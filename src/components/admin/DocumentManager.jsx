import { useState, useEffect } from "react";
import { documents as initialDocs, documentCategories, documentFormats } from "../../data/mockDocuments";
import { useToast } from "../common/Toast";
import Modal from "../common/Modal";
import Pagination, { usePagination } from "../common/Pagination";
import EmptyState from "./EmptyState";
import { TableSkeleton } from "./Skeleton";
import useSortable from "../../hooks/useSortable";

const emptyDoc = { title: "", description: "", category: "Formularios", format: "PDF", fileSize: "" };

export default function DocumentManager() {
  const addToast = useToast();
  const [localDocs, setLocalDocs] = useState(initialDocs);
  const [filterCat, setFilterCat] = useState("Todos");
  const [formOpen, setFormOpen] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(emptyDoc);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const filtered = filterCat === "Todos" ? localDocs : localDocs.filter((d) => d.category === filterCat);
  const { sorted, toggleSort, getSortIndicator } = useSortable(filtered, "title", "asc");
  const { page, totalPages, paginatedItems, setPage } = usePagination(sorted, 6);

  function openNew() { setEditDoc(null); setForm(emptyDoc); setFormOpen(true); }

  function openEdit(doc) {
    setEditDoc(doc);
    setForm({ title: doc.title, description: doc.description, category: doc.category, format: doc.format, fileSize: doc.fileSize });
    setFormOpen(true);
  }

  function handleSave() {
    if (!form.title.trim()) { addToast("El título es requerido", "error"); return; }
    if (editDoc) {
      setLocalDocs((prev) => prev.map((d) => d.id === editDoc.id ? { ...d, ...form } : d));
      addToast("Documento actualizado", "success");
    } else {
      setLocalDocs((prev) => [...prev, { id: Math.max(...prev.map((d) => d.id), 0) + 1, ...form, downloads: 0, updatedAt: new Date().toLocaleDateString("es-AR") }]);
      addToast("Documento creado", "success");
    }
    setFormOpen(false);
    setEditDoc(null);
  }

  function confirmDelete() {
    setLocalDocs((prev) => prev.filter((d) => d.id !== deleteId));
    setDeleteId(null);
    addToast("Documento eliminado", "info");
  }

  const formatColors = { PDF: "bg-red-50 text-red-600", DOCX: "bg-blue-50 text-blue-600", XLSX: "bg-emerald-50 text-emerald-600" };

  const catCounts = { Todos: localDocs.length };
  documentCategories.slice(1).forEach((c) => catCounts[c] = localDocs.filter((d) => d.category === c).length);

  if (loading) return <div className="animate-fade-in"><div className="animate-shimmer h-8 w-48 rounded-lg mb-4" /><TableSkeleton rows={4} cols={5} /></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-primary m-0 tracking-tight">Gestión Documental</h1>
          <p className="text-xs text-muted m-0 mt-0.5 font-medium">{localDocs.length} documentos · {localDocs.reduce((s, d) => s + d.downloads, 0).toLocaleString()} descargas totales</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nuevo Documento
        </button>
      </div>

      <div className="card card-border overflow-hidden">
        <div className="flex flex-wrap gap-1.5 px-4 py-3 border-b border-line">
          {documentCategories.map((cat) => (
            <button key={cat} onClick={() => { setFilterCat(cat); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-all duration-200 ${filterCat === cat ? "bg-primary text-paper shadow-sm" : "bg-paper text-muted border border-line/60 hover:border-primary/30 hover:text-primary"}`}>
              {cat} ({catCounts[cat] || 0})
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-soft/80 text-left text-xs text-muted uppercase tracking-wider">
                <TH sortable sortKey="title" label="Título" onSort={toggleSort} indicator={getSortIndicator("title")} />
                <TH sortable sortKey="category" label="Categoría" onSort={toggleSort} indicator={getSortIndicator("category")} />
                <TH sortable sortKey="format" label="Formato" onSort={toggleSort} indicator={getSortIndicator("format")} />
                <TH sortable sortKey="fileSize" label="Tamaño" onSort={toggleSort} indicator={getSortIndicator("fileSize")} />
                <TH sortable sortKey="downloads" label="Descargas" onSort={toggleSort} indicator={getSortIndicator("downloads")} />
                <TH sortable sortKey="updatedAt" label="Actualizado" onSort={toggleSort} indicator={getSortIndicator("updatedAt")} />
                <th className="px-4 py-3 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line stagger-children">
              {paginatedItems.map((doc) => (
                <tr key={doc.id} className="table-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${formatColors[doc.format] || "bg-soft text-muted"}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-ink m-0">{doc.title}</p>
                        <p className="text-[10px] text-muted m-0 mt-0.5">{doc.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 text-[10px] font-medium rounded-lg bg-accent-light text-accent">{doc.category}</span></td>
                  <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-lg ${formatColors[doc.format] || "bg-mist text-muted"}`}>{doc.format}</span></td>
                  <td className="px-4 py-3 text-xs text-muted">{doc.fileSize}</td>
                  <td className="px-4 py-3 text-xs text-muted">{doc.downloads.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-muted">{doc.updatedAt}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(doc)} className="px-2.5 py-1 text-[10px] font-medium text-accent bg-accent-light/50 rounded-lg cursor-pointer hover:bg-accent-light transition-colors">Editar</button>
                      <button onClick={() => setDeleteId(doc.id)} className="px-2.5 py-1 text-[10px] font-medium text-red-600 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && <EmptyState title="Sin documentos" description="No hay documentos en esta categoría." action={<button onClick={() => setFilterCat("Todos")} className="btn-ghost text-xs">Ver todos</button>} />}

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Modal open={formOpen} onClose={() => { setFormOpen(false); setEditDoc(null); }} title={editDoc ? "Editar documento" : "Nuevo documento"} onConfirm={handleSave} confirmText={editDoc ? "Guardar cambios" : "Crear documento"}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted mb-1 block">Título *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="Nombre del documento" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted mb-1 block">Descripción</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field min-h-[80px] resize-y" placeholder="Breve descripción del documento..." />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Categoría</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                {documentCategories.filter((c) => c !== "Todos").map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Formato</label>
              <select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} className="input-field">
                {documentFormats.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Tamaño</label>
              <input value={form.fileSize} onChange={(e) => setForm({ ...form, fileSize: e.target.value })} className="input-field" placeholder="Ej: 245 KB" />
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={confirmDelete} title="Eliminar documento" confirmText="Eliminar" confirmDanger>
        <p className="text-sm text-muted m-0">¿Estás seguro de eliminar este documento de la biblioteca?</p>
      </Modal>
    </div>
  );
}

function TH({ sortable, sortKey, label, onSort, indicator }) {
  if (!sortable) return <th className="px-4 py-3 font-semibold">{label}</th>;
  return (
    <th className="px-4 py-3 font-semibold sort-header" onClick={() => onSort(sortKey)}>
      <span className="inline-flex items-center gap-1">{label}{indicator && <span className="text-[9px] text-accent">{indicator}</span>}</span>
    </th>
  );
}
