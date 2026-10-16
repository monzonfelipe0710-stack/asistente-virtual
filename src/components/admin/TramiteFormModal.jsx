import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { crear, actualizar } from "../../services/tramites";
import { apiErrorMessage } from "../../lib/api";
import { useToast } from "../common/Toast";

const numeroValido = (v) =>
  v === "" || v == null || (Number.isFinite(Number(v)) && Number(v) >= 0);

const requisitoSchema = z.object({
  descripcion: z
    .string()
    .trim()
    .min(1, "Describí el requisito")
    .max(300, "Máximo 300 caracteres"),
  dondeSeConsigue: z.string().trim().max(300, "Máximo 300 caracteres"),
  costo: z
    .string()
    .trim()
    .refine(numeroValido, "Ingresá un número mayor o igual a 0"),
});

const schema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, "Mínimo 3 caracteres")
    .max(200, "Máximo 200 caracteres"),
  descripcion: z
    .string()
    .trim()
    .min(5, "Mínimo 5 caracteres")
    .max(2000, "Máximo 2000 caracteres"),
  costo: z
    .string()
    .trim()
    .refine(numeroValido, "Ingresá un número mayor o igual a 0"),
  sectorId: z.string().min(1, "Elegí un sector"),
  requisitos: z.array(requisitoSchema).max(30, "Demasiados requisitos"),
});

function toFormValues(tramite) {
  if (!tramite) {
    return {
      nombre: "",
      descripcion: "",
      costo: "",
      sectorId: "",
      requisitos: [],
    };
  }
  return {
    nombre: tramite.nombre || "",
    descripcion: tramite.descripcion || "",
    costo: tramite.costo != null ? String(tramite.costo) : "",
    sectorId: tramite.sectorId != null ? String(tramite.sectorId) : "",
    requisitos: (tramite.requisitos || []).map((r) => ({
      descripcion: r.descripcion || "",
      dondeSeConsigue: r.dondeSeConsigue || "",
      costo: r.costo != null ? String(r.costo) : "",
    })),
  };
}

export default function TramiteFormModal({ tramite = null, sectores = [], onClose, onSaved }) {
  const esEdicion = Boolean(tramite?.id);
  const addToast = useToast();
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(tramite),
  });
  const { fields, append, remove } = useFieldArray({ control, name: "requisitos" });

  async function onSubmit(values) {
    setSaving(true);
    try {
      const payload = {
        nombre: values.nombre.trim(),
        descripcion: values.descripcion.trim(),
        costo: values.costo === "" ? null : Number(values.costo),
        sectorId: Number(values.sectorId),
        requisitos: values.requisitos.map((r) => {
          const out = { descripcion: r.descripcion.trim() };
          if (r.dondeSeConsigue?.trim()) out.dondeSeConsigue = r.dondeSeConsigue.trim();
          if (r.costo !== "" && r.costo != null) out.costo = Number(r.costo);
          return out;
        }),
      };
      const guardado = esEdicion
        ? await actualizar(tramite.id, payload)
        : await crear(payload);
      addToast(esEdicion ? "Trámite actualizado" : "Trámite creado", "success");
      onSaved?.(guardado);
    } catch (err) {
      addToast(apiErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = (name) =>
    `input-field ${errors[name] ? "border-bad/50 focus:border-bad focus:ring-bad/20" : ""}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in p-4">
      <div className="card card-border w-full max-w-3xl max-h-[90vh] flex flex-col animate-scale-in">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-ink m-0">
              {esEdicion ? "Editar trámite" : "Nuevo trámite"}
            </h2>
            <p className="text-[11px] text-muted m-0 mt-0.5">
              El trámite se crea sin publicar. El encargado se toma de tu cuenta.
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

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 overflow-y-auto space-y-4">
          <div>
            <label className="text-xs font-medium text-muted mb-1 block">Nombre *</label>
            <input {...register("nombre")} className={inputClass("nombre")} placeholder="Ej: Jubilación ordinaria" />
            {errors.nombre && <p className="text-[10px] text-bad mt-0.5 m-0">{errors.nombre.message}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-muted mb-1 block">Descripción *</label>
            <textarea
              {...register("descripcion")}
              className={`${inputClass("descripcion")} min-h-24 resize-y`}
              placeholder="Explicá en qué consiste el trámite..."
            />
            {errors.descripcion && <p className="text-[10px] text-bad mt-0.5 m-0">{errors.descripcion.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Sector *</label>
              <select {...register("sectorId")} className={inputClass("sectorId")}>
                <option value="">Seleccioná un sector…</option>
                {sectores.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.nombre}
                  </option>
                ))}
              </select>
              {errors.sectorId && <p className="text-[10px] text-bad mt-0.5 m-0">{errors.sectorId.message}</p>}
              {sectores.length === 0 && (
                <p className="text-[10px] text-warn mt-0.5 m-0">
                  No se pudieron cargar los sectores. Recargá la página.
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Costo (opcional)</label>
              <input {...register("costo")} inputMode="decimal" className={inputClass("costo")} placeholder="Ej: 1500.50" />
              {errors.costo && <p className="text-[10px] text-bad mt-0.5 m-0">{errors.costo.message}</p>}
            </div>
          </div>

          <div className="border-t border-line pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-ink m-0">Requisitos</label>
              <button
                type="button"
                onClick={() => append({ descripcion: "", dondeSeConsigue: "", costo: "" })}
                className="btn-ghost text-xs py-1! px-2.5!"
              >
                + Agregar requisito
              </button>
            </div>

            {fields.length === 0 && (
              <p className="text-[11px] text-muted m-0">Sin requisitos. Podés agregarlos ahora o más tarde.</p>
            )}

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border border-line bg-soft/40 p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <input
                        {...register(`requisitos.${index}.descripcion`)}
                        className={`${inputClass(`requisitos.${index}.descripcion`)} text-sm`}
                        placeholder="Descripción del requisito *"
                      />
                      {errors.requisitos?.[index]?.descripcion && (
                        <p className="text-[10px] text-bad m-0">{errors.requisitos[index].descripcion.message}</p>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          {...register(`requisitos.${index}.dondeSeConsigue`)}
                          className="input-field text-sm"
                          placeholder="Dónde se consigue (opcional)"
                        />
                        <input
                          {...register(`requisitos.${index}.costo`)}
                          inputMode="decimal"
                          className={`${inputClass(`requisitos.${index}.costo`)} text-sm`}
                          placeholder="Costo (opcional)"
                        />
                      </div>
                      {errors.requisitos?.[index]?.costo && (
                        <p className="text-[10px] text-bad m-0">{errors.requisitos[index].costo.message}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-1.5 rounded-lg text-bad hover:bg-bad/10 transition-colors cursor-pointer bg-transparent border-none shrink-0"
                      aria-label="Quitar requisito"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <button type="button" onClick={onClose} className="btn-ghost text-xs" disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary text-xs" disabled={saving}>
              {saving ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear trámite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
