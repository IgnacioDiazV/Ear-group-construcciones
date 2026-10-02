"use client";

import { useMemo, useState, useCallback } from "react";
import { Calculator, Trash2, ChevronUp, ChevronDown, Plus, Printer, Download } from "lucide-react";
import { ItemCotizacion } from "../types";
import { formatARS, montoEnLetras } from "../utils/monto-en-letras";
import { exportarCotizacionAExcel } from "../utils/export-excel";
import { AsistenteComputoModal } from "./asistente-computo-modal";

/* ============================================================================
   CONSTANTES
============================================================================ */

const UNIDADES_OPCIONES = ["M³", "M²", "ml", "un", "gl", "kg", "hs"];

let idCounter = 1;
const nextId = (): number => idCounter++;

/* ============================================================================
   COMPONENTES AUXILIARES
============================================================================ */

interface FieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

function Field({ label, children, className = "" }: FieldProps) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-500 print:hidden">
        {label}
      </label>
      {children}
    </div>
  );
}

/* ============================================================================
   COMPONENTE PRINCIPAL: COTIZADOR DE OBRA CIVIL
============================================================================ */

function CalculadoraContent() {
  // Cabecera
  const [obra, setObra] = useState<string>("");
  const [cliente, setCliente] = useState<string>("");
  const [direccion, setDireccion] = useState<string>("");
  const [fecha, setFecha] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [presentacion, setPresentacion] = useState<string>(
    "Elevo a Ud. Cotización de trabajos solicitados para la obra de referencia, detallada según planilla de cómputo y presupuesto adjunta."
  );
  const [validezDias, setValidezDias] = useState<string>("30");

  // Planilla
  const [items, setItems] = useState<ItemCotizacion[]>([
    {
      id: nextId(),
      concepto:
        "Provisión de mano de obra y materiales para la ejecución de los trabajos detallados a continuación, conforme reglas del arte de la construcción.",
      unidad: "gl",
      cantidad: 1,
      precioMaterial: 0,
      precioManoObra: 0,
    },
  ]);

  // Modal asistente
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Estado de exportación
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Parseo numérico seguro para evitar NaN y concatenaciones accidentales
  const parseVal = (v: unknown): number => {
    if (typeof v === "number") return isNaN(v) ? 0 : v;
    if (!v) return 0;
    const clean = String(v).replace(/\./g, "").replace(",", ".");
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Cálculos de totales
  const totalMateriales = useMemo<number>(
    () =>
      items.reduce(
        (acc, it) => acc + parseVal(it.cantidad) * parseVal(it.precioMaterial),
        0
      ),
    [items]
  );

  const totalManoObra = useMemo<number>(
    () =>
      items.reduce(
        (acc, it) => acc + parseVal(it.cantidad) * parseVal(it.precioManoObra),
        0
      ),
    [items]
  );

  const total = useMemo<number>(
    () => totalMateriales + totalManoObra,
    [totalMateriales, totalManoObra]
  );

  // Manejadores de estado
  const updateItem = useCallback(
    (id: number, field: keyof ItemCotizacion, value: string | number) => {
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
      );
    },
    []
  );

  const removeItem = useCallback((id: number) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const moveItem = useCallback((id: number, dir: number) => {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === id);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  }, []);

  const addManualItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        id: nextId(),
        concepto: "",
        unidad: "un",
        cantidad: 1,
        precioMaterial: 0,
        precioManoObra: 0,
      },
    ]);
  }, []);

  const addFromAssistant = useCallback(
    (item: Omit<ItemCotizacion, "id">) => {
      setItems((prev) => [...prev, { ...item, id: nextId() }]);
      setModalOpen(false);
    },
    []
  );

  const handleExportarExcel = useCallback(async () => {
    setIsExporting(true);
    try {
      await exportarCotizacionAExcel({
        obra,
        cliente,
        direccion,
        fecha,
        items,
        total,
        totalMateriales,
        totalManoObra,
        validezDias,
        presentacion,
      });
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      alert("Ocurrió un error al exportar el archivo. Por favor, intenta de nuevo.");
    } finally {
      setIsExporting(false);
    }
  }, [obra, cliente, direccion, fecha, items, total, totalMateriales, totalManoObra, validezDias, presentacion]);

  return (
    <div className="print:bg-white">
      {/* Estilos de impresión */}
      <style jsx global>{`
        @page {
          size: A4;
          margin: 12mm;
        }
        @media print {
          input[type=number]::-webkit-inner-spin-button,
          input[type=number]::-webkit-outer-spin-button {
            opacity: 1;
          }
        }
      `}</style>

      {/* Barra de herramientas superior */}
      <div className="print:hidden mb-4 flex flex-wrap items-center justify-between gap-3 px-2 py-4">
        <div className="flex items-center gap-2 text-neutral-800 text-lg font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3E2723]" />
          <span>Cotización de Obra Civil</span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#3E2723] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#5D291E] transition-all"
          >
            <Calculator className="h-4 w-4" />
            Asistente de Cómputo
          </button>
          <button
            onClick={addManualItem}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 hover:text-neutral-900 transition-all"
          >
            <Plus className="h-4 w-4" />
            Ítem manual
          </button>
          <button
            onClick={handleExportarExcel}
            disabled={isExporting || items.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 hover:text-neutral-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Exportando..." : "Exportar a Excel"}
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#3E2723] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#5D291E] transition-all"
          >
            <Printer className="h-4 w-4" />
            Imprimir / Guardar como PDF
          </button>
        </div>
      </div>

      {/* Hoja imprimible / Tarjeta principal */}
      <div className="rounded-xl border border-neutral-200 bg-white px-8 py-8 shadow-sm print:rounded-none print:border-none print:shadow-none print:p-0 md:mx-auto md:max-w-5xl">
        {/* Membrete corporativo */}
        <div className="mb-6 border-b border-neutral-200 pb-5">
          <h1 className="text-2xl font-black text-[#3E2723] tracking-tight">EAR Group Construcciones</h1>
          <div className="mt-1 flex flex-wrap justify-between text-xs text-neutral-500">
            <span>Cotización de trabajos de construcción</span>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="border-none bg-transparent text-right text-xs text-neutral-600 font-medium outline-none print:border-none"
            />
          </div>
        </div>

        {/* Datos de obra / cliente */}
        <div className="mb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Obra">
              <input
                value={obra}
                onChange={(e) => setObra(e.target.value)}
                placeholder="Ej: Vivienda unifamiliar de dos plantas"
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-800 placeholder-neutral-400 outline-none focus:border-[#3E2723] focus:ring-1 focus:ring-[#3E2723] print:border-none print:bg-transparent"
              />
            </Field>
            <Field label="Cliente / Comitente">
              <input
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Nombre del cliente"
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-800 placeholder-neutral-400 outline-none focus:border-[#3E2723] focus:ring-1 focus:ring-[#3E2723] print:border-none print:bg-transparent"
              />
            </Field>
            <Field label="Dirección de la obra" className="md:col-span-2">
              <input
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Calle, número, localidad"
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-800 placeholder-neutral-400 outline-none focus:border-[#3E2723] focus:ring-1 focus:ring-[#3E2723] print:border-none print:bg-transparent"
              />
            </Field>
          </div>
        </div>

        {/* Presentación */}
        <div className="mb-6 print:hidden">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Texto de presentación
          </label>
          <textarea
            value={presentacion}
            onChange={(e) => setPresentacion(e.target.value)}
            rows={2}
            className="w-full resize-y rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs leading-relaxed text-neutral-800 outline-none focus:border-[#3E2723] focus:ring-1 focus:ring-[#3E2723] print:resize-none"
          />
        </div>

        {/* Validez de la oferta */}
        <div className="mb-6 flex items-center gap-3 text-xs text-neutral-700">
          <span className="font-semibold">Validez de la oferta:</span>
          <select
            value={validezDias}
            onChange={(e) => setValidezDias(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium outline-none focus:border-[#3E2723] print:border-none print:bg-transparent cursor-pointer"
          >
            <option value="30">30 días hábiles</option>
            <option value="45">45 días hábiles</option>
          </select>
        </div>

        {/* Tabla principal */}
        <div className="overflow-x-auto mb-8 rounded-lg border border-neutral-200">
          <table className="w-full min-w-[900px] border-collapse text-xs bg-white">
            <thead>
              <tr className="bg-neutral-50 text-neutral-700 border-b border-neutral-200">
                <th className="w-10 px-3 py-2.5 text-center font-bold">Nº</th>
                <th className="px-3 py-2.5 text-left font-bold">Concepto / Descripción</th>
                <th className="w-16 px-2 py-2.5 text-center font-bold">Unidad</th>
                <th className="w-20 px-2 py-2.5 text-center font-bold">Cantidad</th>
                <th className="w-24 px-2 py-2.5 text-center font-bold">P. Mat. ($)</th>
                <th className="w-24 px-2 py-2.5 text-center font-bold">P. Mano ($)</th>
                <th className="w-28 px-3 py-2.5 text-right font-bold">P. Unit. ($)</th>
                <th className="w-32 px-3 py-2.5 text-right font-bold">Total ($)</th>
                <th className="print:hidden w-20 px-2 py-2.5 text-center font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {items.map((it, idx) => {
                const cant = parseVal(it.cantidad);
                const mat = parseVal(it.precioMaterial);
                const mano = parseVal(it.precioManoObra);
                const unitarioFila = mat + mano;
                const totalFila = cant * unitarioFila;

                return (
                  <tr key={it.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-3 py-2 text-center text-neutral-500 font-medium">{idx + 1}</td>
                    <td className="px-3 py-1.5">
                      <textarea
                        value={it.concepto}
                        onChange={(e) => updateItem(it.id, "concepto", e.target.value)}
                        rows={2}
                        placeholder="Descripción técnica..."
                        className="w-full min-w-[260px] resize-y rounded border-none bg-transparent p-1 text-xs leading-snug text-neutral-800 outline-none focus:bg-neutral-50 print:resize-none"
                      />
                    </td>
                    <td className="px-1 py-1.5 text-center">
                      <select
                        value={it.unidad}
                        onChange={(e) => updateItem(it.id, "unidad", e.target.value)}
                        className="w-full rounded border-none bg-transparent p-1 text-center text-xs font-medium text-neutral-800 outline-none cursor-pointer"
                      >
                        {UNIDADES_OPCIONES.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-1 py-1.5">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={it.cantidad}
                        onChange={(e) => updateItem(it.id, "cantidad", e.target.value)}
                        className="w-full rounded border border-transparent focus:border-neutral-200 bg-transparent p-1 text-right text-xs font-medium text-neutral-800 outline-none print:border-none"
                      />
                    </td>
                    <td className="px-1 py-1.5">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={it.precioMaterial}
                        onChange={(e) => updateItem(it.id, "precioMaterial", e.target.value)}
                        className="w-full rounded border border-transparent focus:border-neutral-200 bg-transparent p-1 text-right text-xs font-medium text-neutral-800 outline-none print:border-none"
                      />
                    </td>
                    <td className="px-1 py-1.5">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={it.precioManoObra}
                        onChange={(e) => updateItem(it.id, "precioManoObra", e.target.value)}
                        className="w-full rounded border border-transparent focus:border-neutral-200 bg-transparent p-1 text-right text-xs font-medium text-neutral-800 outline-none print:border-none"
                      />
                    </td>
                    {/* Precio Unitario = P. Material + P. Mano de Obra */}
                    <td className="px-3 py-2 bg-neutral-50/60 text-right font-semibold text-neutral-700 print:bg-transparent">
                      {formatARS(unitarioFila)}
                    </td>
                    {/* Total Fila = Cantidad * Precio Unitario */}
                    <td className="px-3 py-2 text-right font-bold text-neutral-900">
                      {formatARS(totalFila)}
                    </td>
                    <td className="print:hidden px-2 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => moveItem(it.id, -1)}
                          disabled={idx === 0}
                          className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-20 transition-colors"
                          title="Subir"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => moveItem(it.id, 1)}
                          disabled={idx === items.length - 1}
                          className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-20 transition-colors"
                          title="Bajar"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => removeItem(it.id)}
                          className="rounded p-1 text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-neutral-400 text-xs">
                    No hay ítems cargados. Usá el Asistente de Cómputo o agregá un ítem manual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pie de cotización y totales */}
        <div className="mt-8 flex flex-col items-end gap-2 border-t border-neutral-200 pt-6">
          <div className="flex w-full max-w-md justify-between text-xs text-neutral-600">
            <span>Subtotal materiales</span>
            <span className="font-semibold text-neutral-800">{formatARS(totalMateriales)}</span>
          </div>
          <div className="flex w-full max-w-md justify-between text-xs text-neutral-600">
            <span>Subtotal mano de obra</span>
            <span className="font-semibold text-neutral-800">{formatARS(totalManoObra)}</span>
          </div>
          <div className="mt-2 flex w-full max-w-md items-baseline justify-between border-t border-neutral-200 pt-3">
            <span className="text-sm font-bold text-neutral-800">Precio Total $</span>
            <span className="text-2xl font-black text-[#3E2723]">{formatARS(total)}</span>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs italic text-neutral-700 print:border-neutral-300 print:bg-white">
          El Monto Final asciende a la suma en pesos ($): <strong className="text-neutral-900 not-italic">{montoEnLetras(total)}</strong> .-
        </div>

        <div className="mt-6 space-y-2 text-xs leading-relaxed text-neutral-500">
          <p>
            La presente cotización mantiene su validez por un plazo de <strong className="text-neutral-700">{validezDias} días hábiles</strong> a partir de la fecha de emisión. Transcurrido dicho plazo sin mediar aceptación expresa, los precios podrán ser reajustados.
          </p>
          <p>
            Los precios cotizados no incluyen impuestos no especificados, permisos municipales, ni tareas no descriptas expresamente. Cualquier trabajo adicional será presupuestado y aprobado por separado.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-8 text-center text-xs text-neutral-500">
          <div>
            <div className="border-t border-neutral-300 pt-2 font-medium text-neutral-600">
              Firma y aclaración (Contratista)
            </div>
          </div>
          <div>
            <div className="border-t border-neutral-300 pt-2 font-medium text-neutral-600">
              Firma y aclaración (Comitente)
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Asistente de Cómputo */}
      {modalOpen && (
        <AsistenteComputoModal
          onClose={() => setModalOpen(false)}
          onAdd={addFromAssistant}
        />
      )}
    </div>
  );
}

export default CalculadoraContent;