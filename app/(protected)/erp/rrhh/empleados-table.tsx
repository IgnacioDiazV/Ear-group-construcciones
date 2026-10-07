"use client";

import { useMemo, useState, useTransition } from "react";
import { Pencil, Search, Trash2, Users } from "lucide-react";
import { formatPhoneNumber } from "@/lib/formatters";
import { eliminarEmpleado, guardarEmpleado, type Empleado } from "./actions";

type FormState = {
  id: number | null;
  legajo: string;
  nombre: string;
  apellido: string;
  apodo: string;
  obra_actual_id: number | null;
  telefono: string;
  direccion: string;
  contacto_emergencia_nombre: string;
  telefono_emergencia: string;
};

const emptyForm: FormState = {
  id: null,
  legajo: "",
  nombre: "",
  apellido: "",
  apodo: "",
  obra_actual_id: null,
  telefono: "",
  direccion: "",
  contacto_emergencia_nombre: "",
  telefono_emergencia: "",
};

const digits = (value: string) => value.replace(/\D/g, "");

function waLink(phone: string) {
  const d = digits(phone).replace(/^0+/, "");
  if (!d) return null;
  if (d.startsWith("549")) return `https://wa.me/${d}`;
  if (d.startsWith("54")) return `https://wa.me/549${d.slice(2)}`;
  return `https://wa.me/549${d}`;
}

function PhoneLink({ phone }: { phone: string | null }) {
  if (!phone?.trim()) return <span className="text-neutral-400">—</span>;
  const wa = waLink(phone);
  return (
    <span className="flex items-center gap-2">
      <a className="text-neutral-800 hover:underline" href={`tel:+${digits(phone)}`}>
        {formatPhoneNumber(phone)}
      </a>
      {wa && (
        <a
          aria-label={`WhatsApp ${phone}`}
          className="inline-flex items-center gap-1 rounded-md border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
          href={wa}
          rel="noopener noreferrer"
          target="_blank"
        >
          WhatsApp
        </a>
      )}
    </span>
  );
}

const inputClass =
  "w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-800 focus:border-[#3E2723] focus:outline-none focus:ring-1 focus:ring-[#3E2723]";

type Obra = { id: number; nombre: string; codigo: string };

export function EmpleadosTable({ initialData, obras }: { initialData: Empleado[]; obras: Obra[] }) {
  const [query, setQuery] = useState("");
  const [obraFilter, setObraFilter] = useState("");
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialData.filter((e) => {
      const matchesQuery = !q || [e.nombre, e.apellido, e.apodo, e.telefono]
        .some((v) => (v ?? "").trim().toLowerCase().includes(q));
      const matchesObra = !obraFilter || e.obra_actual_id === Number(obraFilter);

      return matchesQuery && matchesObra;
    });
  }, [initialData, obraFilter, query]);

  const setField = (key: keyof FormState, value: string) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const openEdit = (e: Empleado) => {
    setError(null);
    setForm({
      id: e.id,
      legajo: e.legajo ?? "",
      nombre: e.nombre,
      apellido: e.apellido,
      apodo: e.apodo ?? "",
      obra_actual_id: e.obra_actual_id,
      telefono: e.telefono,
      direccion: e.direccion ?? "",
      contacto_emergencia_nombre: e.contacto_emergencia_nombre ?? "",
      telefono_emergencia: e.telefono_emergencia ?? "",
    });
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form) return;
    startTransition(async () => {
      const result = await guardarEmpleado(form);
      if (result.ok) {
        setForm(null);
        setError(null);
      } else {
        setError(result.error);
      }
    });
  };

  const handleDelete = (e: Empleado) => {
    if (!window.confirm(`¿Eliminar a ${e.nombre} ${e.apellido}? Esta acción no se puede deshacer.`)) return;
    startTransition(async () => {
      const result = await eliminarEmpleado(e.id);
      if (!result.ok) window.alert(`No se pudo eliminar: ${result.error}`);
    });
  };

  return (
    <section>
      <div className="mb-6 flex flex-col items-stretch justify-between gap-3 rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative sm:max-w-sm sm:flex-1">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={17} />
            <input
              aria-label="Buscar personal"
              className={`${inputClass} pl-10`}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, apellido o teléfono..."
              type="search"
              value={query}
            />
          </div>
          <select
            aria-label="Filtrar por obra"
            className={`${inputClass} sm:w-52`}
            onChange={(e) => setObraFilter(e.target.value)}
            value={obraFilter}
          >
            <option value="">Todas las obras</option>
            {obras.map((obra) => (
              <option key={obra.id} value={obra.id}>
                {obra.codigo} - {obra.nombre}
              </option>
            ))}
          </select>
        </div>
        <button
          className="rounded-lg bg-[#3E2723] px-4 py-2 text-sm font-medium text-white hover:bg-[#2e1d1a]"
          onClick={() => {
            setError(null);
            setForm(emptyForm);
          }}
          type="button"
        >
          + Agregar operario
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-neutral-200 p-12 text-center text-neutral-500">
          <Users aria-hidden="true" className="mx-auto mb-3 text-neutral-300" size={40} strokeWidth={1.5} />
          <p className="font-medium">{query ? "No encontramos operarios con esa búsqueda." : "Todavía no hay operarios registrados."}</p>
          <p className="mt-1 text-sm">Agregá personal para comenzar a gestionar el equipo.</p>
        </div>
      ) : (
      <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm">
       <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-3">Nombre y Apellido</th>
              <th className="px-4 py-3">Obra actual</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Dirección</th>
              <th className="px-4 py-3">Contacto de Emergencia</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filtered.map((e) => (
              <tr className="hover:bg-neutral-50/50" key={e.id}>
                <td className="px-4 py-3 font-medium text-neutral-800">
                  {e.nombre} {e.apellido}
                  {e.apodo && (
                    <span className="ml-2 rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                      &quot;{e.apodo}&quot;
                    </span>
                  )}
                  {e.legajo && <span className="ml-2 text-xs text-neutral-500">#{e.legajo}</span>}
                </td>
                <td className="px-4 py-3">
                  {e.obra ? (
                    <span className="inline-flex rounded-md border border-stone-200 bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">
                      {e.obra.codigo} - {e.obra.nombre}
                    </span>
                  ) : (
                    <span className="text-sm text-neutral-400">Sin asignar</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <PhoneLink phone={e.telefono} />
                </td>
                <td className="px-4 py-3 text-sm text-neutral-500">{e.direccion?.trim() || "—"}</td>
                <td className="px-4 py-3 text-sm text-neutral-500">
                  {e.contacto_emergencia_nombre?.trim() || e.telefono_emergencia?.trim() ? (
                    <div className="flex flex-col gap-0.5">
                      <span>{e.contacto_emergencia_nombre?.trim() || "—"}</span>
                      <PhoneLink phone={e.telefono_emergencia} />
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      aria-label={`Editar a ${e.nombre} ${e.apellido}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-[#3E2723]"
                      onClick={() => openEdit(e)}
                      type="button"
                    >
                      <Pencil aria-hidden="true" size={15} />
                    </button>
                    <button
                      aria-label={`Eliminar a ${e.nombre} ${e.apellido}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                      disabled={isPending}
                      onClick={() => handleDelete(e)}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
      )}

      {form && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4"
          role="dialog"
        >
          <form
            className="flex max-h-[90vh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
            onSubmit={handleSubmit}
          >
            <h2 className="text-lg font-bold text-neutral-800">
              {form.id ? "Editar operario" : "Agregar operario"}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                Nombre *
                <input className={inputClass} onChange={(e) => setField("nombre", e.target.value)} required value={form.nombre} />
              </label>
              <label className="text-sm">
                Apellido *
                <input className={inputClass} onChange={(e) => setField("apellido", e.target.value)} required value={form.apellido} />
              </label>
            </div>
            <label className="text-sm">
              Apodo
              <input
                className={inputClass}
                onChange={(e) => setField("apodo", e.target.value)}
                placeholder="Ej: Tito, Flaco, Negro"
                value={form.apodo}
              />
            </label>
            <label className="text-sm">
              Obra asignada
              <select
                className={inputClass}
                onChange={(e) => setForm((prev) => (prev ? {
                  ...prev,
                  obra_actual_id: e.target.value ? Number(e.target.value) : null,
                } : prev))}
                value={form.obra_actual_id ?? ""}
              >
                <option value="">Sin asignar</option>
                {obras.map((obra) => (
                  <option key={obra.id} value={obra.id}>
                    {obra.codigo} - {obra.nombre}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                Teléfono *
                <input
                  className={inputClass}
                  inputMode="tel"
                  onChange={(e) => setField("telefono", e.target.value)}
                  placeholder="5493810000000"
                  required
                  value={form.telefono}
                />
              </label>
              <label className="text-sm">
                Legajo
                <input className={inputClass} onChange={(e) => setField("legajo", e.target.value)} value={form.legajo} />
              </label>
            </div>
            <label className="text-sm">
              Dirección
              <input className={inputClass} onChange={(e) => setField("direccion", e.target.value)} value={form.direccion} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                Contacto de emergencia
                <input
                  className={inputClass}
                  onChange={(e) => setField("contacto_emergencia_nombre", e.target.value)}
                  value={form.contacto_emergencia_nombre}
                />
              </label>
              <label className="text-sm">
                Teléfono de emergencia
                <input
                  className={inputClass}
                  inputMode="tel"
                  onChange={(e) => setField("telefono_emergencia", e.target.value)}
                  value={form.telefono_emergencia}
                />
              </label>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}

            <div className="mt-2 flex justify-end gap-2">
              <button
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                onClick={() => setForm(null)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="rounded-lg bg-[#3E2723] px-4 py-2 text-sm font-medium text-white hover:bg-[#2e1d1a] disabled:opacity-50"
                disabled={isPending}
                type="submit"
              >
                {isPending ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
