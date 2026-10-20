import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  obtener,
  eliminar,
  publicar,
  despublicar,
} from "../../services/tramites";
import {
  listar as listarDocumentos,
  subir,
  eliminar as eliminarDocumento,
  obtenerUrlDescarga,
} from "../../services/documentos";
import { listar as listarSectores } from "../../services/sectores";
import { apiErrorMessage } from "../../lib/api";
import { useToast } from "../common/Toast";
import Modal from "../common/Modal";
import { CardSkeleton } from "./Skeleton";
import { formatDate } from "../../utils/date";
import TramiteFormModal from "./TramiteFormModal";

const MAX_FILE = 10 * 1024 * 1024;
const TIPOS_OK = ["pdf", "docx"];

function formatCosto(costo, vacio = "—") {
  if (costo == null || costo === "") return vacio;
  const n = Number(costo);
  if (!Number.isFinite(n)) return vacio;
  return `$ ${n.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`;
}

function extensionDe(nombre = "") {
  const parts = String(nombre).split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

export default function TramiteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tramite, setTramite] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [working, setWorking] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTramite, setDeleteTramite] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [docName, setDocName] = useState("");
  const fileRef = useRef(null);

  async function cargar() {
    setLoading(true);
    setError("");
    try {
      const [t, docs, s] = await Promise.all([
        obtener(id),
        listarDocumentos(id),
        listarSectores(),
      ]);
      setTramite(t);
      setDocumentos(Array.isArray(docs) ? docs : []);
      setSectores(Array.isArray(s) ? s : []);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [t, docs, s] = await Promise.all([
          obtener(id),
          listarDocumentos(id),
          listarSectores(),
        ]);
        if (!active) return;
        setTramite(t);
        setDocumentos(Array.isArray(docs) ? docs : []);
        setSectores(Array.isArray(s) ? s : []);
      } catch (err) {
        if (active) setError(apiErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  async function togglePublicado() {
    if (!tramite) return;
    setWorking(true);
    try {
      if (tramite.publicado) await despublicar(tramite.id);
      else await publicar(tramite.id);
      addToast(tramite.publicado ? "Trámite despublicado" : "Trámite publicado", "success");
      await cargar();
    } catch (err) {
      addToast(apiErrorMessage(err), "error");
    } finally {
      setWorking(false);
    }
  }

  async function confirmDeleteTramite() {
    setDeleteTramite(false);
    setWorking(true);
    try {
      await eliminar(tramite.id);
      addToast("Trámite eliminado", "info");
      navigate("/admin/tramites");
    } catch (err) {
      addToast(apiErrorMessage(err), "error");
      setWorking(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      addToast("Elegí un archivo PDF o DOCX", "error");
      return;
    }
    if (!TIPOS_OK.includes(extensionDe(file.name))) {
      addToast("Solo se permiten archivos PDF o DOCX", "error");
      return;
    }
    if (file.size > MAX_FILE) {
      addToast("El archivo supera los 10 MB", "error");
      return;
    }
    setUploading(true);
    try {
      await subir(id, { archivo: file, nombre: docName.trim() || undefined });
      addToast("Documento subido", "success");
      setDocName("");
      if (fileRef.current) fileRef.current.value = "";
      const docs = await listarDocumentos(id);
      setDocumentos(Array.isArray(docs) ? docs : []);
    } catch (err) {
      addToast(apiErrorMessage(err), "error");
    } finally {
      setUploading(false);
    }
  }

  async function descargar(doc) {
    try {
      const { url } = await obtenerUrlDescarga(id, doc.id);
      if (url) window.open(url, "_blank", "noopener");
    } catch (err) {
      addToast(apiErrorMessage(err), "error");
    }
  }

  async function confirmDeleteDoc() {
    const doc = deleteDoc;
    setDeleteDoc(null);
    try {
      await eliminarDocumento(id, doc.id);
      addToast("Documento eliminado", "info");
      setDocumentos((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      addToast(apiErrorMessage(err), "error");
    }
  }

  if (loading) return <CardSkeleton lines={4} />;

  if (error || !tramite) {
    return (
      <div className="animate-fade-in">
        <Link to="/admin/tramites" className="text-xs text-muted no-underline hover:text-ink">
          ← Volver a Trámites
        </Link>
        <div className="mt-6 rounded-lg border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-bad">
          {error || "No se encontró el trámite."}
        </div>
      </div>
    );
  }

  const requisitos = tramite.requisitos || [];
  const mesas = tramite.mesas || [];

  return (
    <div className="animate-fade-in">
      <Link to="/admin/tramites" className="text-xs text-muted no-underline hover:text-ink">
        ← Volver a Trámites
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mt-4 mb-6 border-b border-line/70 pb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`badge ${tramite.publicado ? "bg-ok/10 text-ok" : "bg-muted/10 text-muted"}`}>
              {tramite.publicado ? "Publicado" : "Borrador"}
            </span>
            {tramite.sector?.nombre && (
              <span className="badge bg-brand-deep/10 text-brand-deep">{tramite.sector.nombre}</span>
            )}
          </div>
          <h1 className="display-3 text-ink m-0 uppercase">{tramite.nombre}</h1>
          <p className="text-sm text-muted mt-3 m-0 max-w-2xl">{tramite.descripcion}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setFormOpen(true)} className="btn-primary text-xs" disabled={working}>
            Editar
          </button>
          <button onClick={togglePublicado} className="btn-ghost text-xs" disabled={working}>
            {tramite.publicado ? "Despublicar" : "Publicar"}
          </button>
          <button
            onClick={() => setDeleteTramite(true)}
            className="px-3 py-1.5 text-xs font-medium text-bad bg-bad/10 rounded-lg cursor-pointer hover:bg-bad/20 transition-colors disabled:opacity-50"
            disabled={working}
          >
            Eliminar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="card card-border p-5">
            <h2 className="text-sm font-semibold text-ink m-0 mb-3">Requisitos</h2>
            {requisitos.length === 0 ? (
              <p className="text-xs text-muted m-0">Sin requisitos cargados.</p>
            ) : (
              <ul className="m-0 p-0 list-none space-y-2">
                {requisitos.map((r) => (
                  <li key={r.id} className="rounded-lg border border-line bg-soft/40 px-3 py-2">
                    <p className="text-xs font-medium text-ink m-0">{r.descripcion}</p>
                    <p className="text-[11px] text-muted m-0 mt-0.5">
                      {r.dondeSeConsigue ? `Dónde: ${r.dondeSeConsigue}` : "Sin indicación de dónde conseguirlo"}
                      {r.costo != null && r.costo !== "" ? ` · Costo: ${formatCosto(r.costo)}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card card-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-ink m-0">Documentos</h2>
              <span className="text-[11px] text-muted">{documentos.length} archivo(s)</span>
            </div>

            <form onSubmit={handleUpload} className="flex flex-wrap items-end gap-2 mb-4 pb-4 border-b border-line">
              <div className="flex-1 min-w-40">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-muted mb-0.5 block">
                  Nombre (opcional)
                </label>
                <input
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="input-field text-sm"
                  placeholder="Ej: Formulario oficial"
                />
              </div>
              <div className="flex-1 min-w-40">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-muted mb-0.5 block">
                  Archivo (PDF/DOCX, ≤10 MB)
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="input-field text-sm file:mr-2 file:border-0 file:bg-transparent file:text-xs"
                />
              </div>
              <button type="submit" className="btn-primary text-xs" disabled={uploading}>
                {uploading ? "Subiendo…" : "Subir"}
              </button>
            </form>

            {documentos.length === 0 ? (
              <p className="text-xs text-muted m-0">Todavía no hay documentos.</p>
            ) : (
              <ul className="m-0 p-0 list-none divide-y divide-line">
                {documentos.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-ink m-0 truncate">{doc.nombre}</p>
                      <p className="text-[10px] text-muted m-0 mt-0.5">
                        {doc.tipo?.toUpperCase() || "Archivo"} · {formatDate(doc.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => descargar(doc)}
                        className="px-2.5 py-1 text-[10px] font-medium text-brand-deep bg-brand-deep/10 rounded-lg cursor-pointer hover:bg-brand-deep/20 transition-colors"
                      >
                        Descargar
                      </button>
                      <button
                        onClick={() => setDeleteDoc(doc)}
                        className="px-2.5 py-1 text-[10px] font-medium text-bad bg-bad/10 rounded-lg cursor-pointer hover:bg-bad/20 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card card-border p-5">
            <h2 className="text-sm font-semibold text-ink m-0 mb-3">Información</h2>
            <dl className="m-0 text-xs space-y-2">
              <div className="flex justify-between gap-3">
                <dt className="text-muted m-0">Encargado</dt>
                <dd className="text-ink m-0 text-right">{tramite.encargado?.nombre || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted m-0">Sector</dt>
                <dd className="text-ink m-0 text-right">{tramite.sector?.nombre || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted m-0">Costo</dt>
                <dd className="text-ink m-0 text-right">{formatCosto(tramite.costo, "Sin costo")}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted m-0">Creado</dt>
                <dd className="text-ink m-0 text-right">{formatDate(tramite.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted m-0">Actualizado</dt>
                <dd className="text-ink m-0 text-right">{formatDate(tramite.updatedAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="card card-border p-5">
            <h2 className="text-sm font-semibold text-ink m-0 mb-3">Mesas de entrada</h2>
            {mesas.length === 0 ? (
              <p className="text-xs text-muted m-0">
                Sin mesas asignadas. La gestión de mesas todavía no está disponible en el backend.
              </p>
            ) : (
              <ul className="m-0 p-0 list-none space-y-1.5">
                {mesas.map((m) => (
                  <li key={m.id} className="text-xs text-ink">
                    {m.mesa?.nombre || `Mesa #${m.mesaId}`}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {formOpen && (
        <TramiteFormModal
          tramite={tramite}
          sectores={sectores}
          onClose={() => setFormOpen(false)}
          onSaved={async () => {
            setFormOpen(false);
            await cargar();
          }}
        />
      )}

      <Modal
        open={deleteTramite}
        onClose={() => setDeleteTramite(false)}
        onConfirm={confirmDeleteTramite}
        title="Eliminar trámite"
        confirmText="Eliminar"
        confirmDanger
      >
        <p className="m-0">
          ¿Seguro que querés eliminar este trámite? Se borran también sus documentos y no se puede
          deshacer.
        </p>
      </Modal>

      <Modal
        open={deleteDoc !== null}
        onClose={() => setDeleteDoc(null)}
        onConfirm={confirmDeleteDoc}
        title="Eliminar documento"
        confirmText="Eliminar"
        confirmDanger
      >
        <p className="m-0">¿Seguro que querés eliminar “{deleteDoc?.nombre}”?</p>
      </Modal>
    </div>
  );
}
