import { useEffect, useMemo, useState } from "react";
import { crearUsuario } from "../../services/usuarios";
import { listar as listarSectores } from "../../services/sectores";
import { apiErrorMessage } from "../../lib/api";
import { useToast } from "../common/Toast";

const ROLES = [
  { value: "ADMINISTRADOR", label: "Empleado" },
  { value: "CIUDADANO", label: "Ciudadano" },
];

const soloDigitos = (value) => value.replace(/\D/g, "");

function claveAleatoria() {
  const letras = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  const numeros = "23456789";
  const simbolos = "!#$%&*+-?";
  const alfabeto = letras + numeros + simbolos;
  let clave = "";
  for (let i = 0; i < 4; i += 1) clave += letras[Math.floor(Math.random() * letras.length)];
  for (let i = 0; i < 4; i += 1) clave += numeros[Math.floor(Math.random() * numeros.length)];
  for (let i = 0; i < 4; i += 1) clave += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  return clave.replace(/(.{4})/g, "$1-").replace(/-$/, "");
}

/**
 * Alta de una cuenta desde el panel de administración.
 * No existe registro público de empleados: el alta la hace un superusuario y
 * la clave inicial se la entrega al usuario.
 */
export default function NuevoUsuarioModal({ onClose, onSaved }) {
  const addToast = useToast();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("ADMINISTRADOR");
  const [dni, setDni] = useState("");
  const [cuil, setCuil] = useState("");
  const [sectores, setSectores] = useState([]);
  const [sectorIds, setSectorIds] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const data = await listarSectores();
        if (!activo) return;
        setSectores(Array.isArray(data) ? data : []);
      } catch {
        // El selector de sectores es opcional: si falla, se puede crear la cuenta igual.
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  const sectoresOrdenados = useMemo(
    () => [...sectores].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    [sectores]
  );

  function alternarSector(id) {
    setSectorIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  async function submit(e) {
    e.preventDefault();

    const dniLimpio = soloDigitos(dni);
    const cuilLimpio = soloDigitos(cuil);

    if (!nombre.trim()) {
      addToast("Ingresá el nombre del usuario.", "error");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      addToast("Ingresá un correo electrónico válido.", "error");
      return;
    }
    if (password.length < 8) {
      addToast("La contraseña debe tener al menos 8 caracteres.", "error");
      return;
    }
    if (dniLimpio && !/^\d{7,8}$/.test(dniLimpio)) {
      addToast("El DNI debe tener 7 u 8 dígitos.", "error");
      return;
    }
    if (cuilLimpio && !/^\d{11}$/.test(cuilLimpio)) {
      addToast("El CUIL debe tener 11 dígitos.", "error");
      return;
    }

    setSaving(true);
    try {
      const data = await crearUsuario({
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        password,
        rol,
        dni: dniLimpio,
        cuil: cuilLimpio,
        sectorIds,
      });
      addToast(data?.mensaje || "Cuenta creada", "success");
      onSaved?.();
      onClose?.();
    } catch (err) {
      addToast(apiErrorMessage(err, "No se pudo crear la cuenta."), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in p-4">
      <div
        className="card card-border w-full max-w-lg animate-scale-in max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nuevo-usuario-title"
      >
        <div className="px-5 py-4 border-b border-line flex items-center justify-between shrink-0">
          <div>
            <h2 id="nuevo-usuario-title" className="text-sm font-semibold text-ink m-0">
              Nuevo usuario
            </h2>
            <p className="text-[11px] text-muted m-0 mt-0.5">
              La cuenta queda habilitada al instante con la clave que definas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-mist transition-colors text-muted cursor-pointer bg-transparent border-none"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-3 overflow-y-auto">
          <div>
            <label htmlFor="nuevo-usuario-nombre" className="text-xs font-medium text-muted mb-1 block">
              Nombre y apellido *
            </label>
            <input
              id="nuevo-usuario-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="input-field"
              placeholder="Ej: María Gómez"
              autoFocus
              required
            />
          </div>

          <div>
            <label htmlFor="nuevo-usuario-email" className="text-xs font-medium text-muted mb-1 block">
              Correo electrónico *
            </label>
            <input
              id="nuevo-usuario-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="nombre@chatap.gob.ar"
              required
            />
          </div>

          <div>
            <label htmlFor="nuevo-usuario-password" className="text-xs font-medium text-muted mb-1 block">
              Contraseña inicial *
            </label>
            <div className="flex gap-2">
              <input
                id="nuevo-usuario-password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field flex-1"
              placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setPassword(claveAleatoria())}
                className="btn-ghost text-xs shrink-0"
              >
                Generar
              </button>
            </div>
            <p className="text-[11px] text-muted m-0 mt-1">
              Entregá esta clave al usuario: es su acceso inicial al sistema.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="nuevo-usuario-rol" className="text-xs font-medium text-muted mb-1 block">
                Rol
              </label>
              <select
                id="nuevo-usuario-rol"
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className="input-field"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="nuevo-usuario-dni" className="text-xs font-medium text-muted mb-1 block">
                DNI
              </label>
              <input
                id="nuevo-usuario-dni"
                inputMode="numeric"
                value={dni}
                onChange={(e) => setDni(soloDigitos(e.target.value).slice(0, 8))}
                className="input-field"
                placeholder="Opcional"
              />
            </div>
            <div>
              <label htmlFor="nuevo-usuario-cuil" className="text-xs font-medium text-muted mb-1 block">
                CUIL
              </label>
              <input
                id="nuevo-usuario-cuil"
                inputMode="numeric"
                value={cuil}
                onChange={(e) => setCuil(soloDigitos(e.target.value).slice(0, 11))}
                className="input-field"
                placeholder="Opcional"
              />
            </div>
          </div>

          <fieldset className="border-none p-0 m-0">
            <legend className="text-xs font-medium text-muted mb-1">Sectores</legend>
            {sectoresOrdenados.length === 0 ? (
              <p className="text-[11px] text-muted m-0">No hay sectores cargados.</p>
            ) : (
              <ul className="max-h-40 overflow-y-auto border border-line rounded-lg divide-y divide-line">
                {sectoresOrdenados.map((s) => (
                  <li key={s.id}>
                    <label className="flex items-center gap-2 px-3 py-2 text-xs text-ink cursor-pointer hover:bg-mist transition-colors">
                      <input
                        type="checkbox"
                        checked={sectorIds.includes(s.id)}
                        onChange={() => alternarSector(s.id)}
                        className="w-4 h-4 rounded border-line bg-card text-brand-deep cursor-pointer accent-brand-deep"
                      />
                      <span className="truncate">{s.nombre}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost text-xs" disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary text-xs" disabled={saving}>
              {saving ? "Creando…" : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
