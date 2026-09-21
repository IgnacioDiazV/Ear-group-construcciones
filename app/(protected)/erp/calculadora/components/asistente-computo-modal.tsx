"use client";

import { useMemo, useState, useCallback, ChangeEvent } from "react";
import { Calculator, Plus, X } from "lucide-react";
import {
  AsistenteComputoProps,
  ComputoResult,
  TipoComputo,
  NumFieldProps,
  SelectFieldProps,
} from "../types";
import { formatARS, montoEnLetras, num } from "../utils/monto-en-letras";

/* ============================================================================
   TIPOS Y CONSTANTES
============================================================================ */

const TIPOS_COMPUTO: TipoComputo[] = [
  { id: "zapatas", label: "Zapatas / Bases H°A°" },
  { id: "columnas", label: "Columnas y Vigas H°A°" },
  { id: "losa", label: "Losa c/ Viguetas y Telgopor" },
  { id: "mamposteria", label: "Mampostería" },
  { id: "superficie", label: "Contrapiso / Carpeta / Revoque" },
  { id: "manual", label: "Carga manual directa" },
];

const UNIDADES_OPCIONES = ["M³", "M²", "ml", "un", "gl", "kg", "hs"];

/* ============================================================================
   COMPONENTES AUXILIARES
============================================================================ */

function NumField({ label, value, onChange }: NumFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-blue-400"
        style={{ borderColor: "#e7e0db" }}
        placeholder="0"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  className = "",
}: SelectFieldProps) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-slate-500">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-blue-400"
        style={{ borderColor: "#e7e0db" }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ============================================================================
   ASISTENTE DE CÓMPUTO MÉTRICO
============================================================================ */

export function AsistenteComputoModal({
  onClose,
  onAdd,
}: AsistenteComputoProps) {
  const [tipo, setTipo] = useState<string>("zapatas");

  // Zapatas
  const [zBase, setZBase] = useState<string>("");
  const [zAncho, setZAncho] = useState<string>("");
  const [zProf, setZProf] = useState<string>("");
  const [zCant, setZCant] = useState<string>("1");
  const [zRepeticiones, setZRepeticiones] = useState<string>("1");
  const [zDesperdicio, setZDesperdicio] = useState<string>("8");

  // Columnas / Vigas
  const [cB, setCB] = useState<string>("");
  const [cH, setCH] = useState<string>("");
  const [cLong, setCLong] = useState<string>("");
  const [cCant, setCCant] = useState<string>("1");
  const [cRepeticiones, setCRepeticiones] = useState<string>("1");
  const [cDesperdicio, setCDesperdicio] = useState<string>("8");
  const [cUnidad, setCUnidad] = useState<string>("M³");

  // Losa
  const [lLargo, setLLargo] = useState<string>("");
  const [lAncho, setLAncho] = useState<string>("");
  const [lRepeticiones, setLRepeticiones] = useState<string>("1");
  const [lDesperdicio, setLDesperdicio] = useState<string>("5");

  // Mampostería
  const [mLargo, setMLargo] = useState<string>("");
  const [mAlto, setMAlto] = useState<string>("");
  const [mVanos, setMVanos] = useState<string>("0");
  const [mTipoLadrillo, setMTipoLadrillo] = useState<string>(
    "Ladrillo hueco 18x18x33"
  );
  const [mUnidad, setMUnidad] = useState<string>("M²");
  const [mEspesor, setMEspesor] = useState<string>("0.15");
  const [mRepeticiones, setMRepeticiones] = useState<string>("1");
  const [mDesperdicio, setMDesperdicio] = useState<string>("10");

  // Superficie (contrapiso/carpeta/revoque)
  const [sLargo, setSLargo] = useState<string>("");
  const [sAncho, setSAncho] = useState<string>("");
  const [sTipo, setSTipo] = useState<string>(
    "Contrapiso de hormigón pobre"
  );
  const [sRepeticiones, setSRepeticiones] = useState<string>("1");
  const [sDesperdicio, setSDesperdicio] = useState<string>("10");

  // Manual
  const [manConcepto, setManConcepto] = useState<string>("");
  const [manUnidad, setManUnidad] = useState<string>("gl");
  const [manCantidad, setManCantidad] = useState<string>("1");
  const [manDesperdicio, setManDesperdicio] = useState<string>("0");

  // Precios comunes
  const [precioMaterial, setPrecioMaterial] = useState<string>("");
  const [precioManoObra, setPrecioManoObra] = useState<string>("");
  const [concepto, setConcepto] = useState<string>("");

  // Cálculo de cantidad y unidad según el tipo activo
  const { cantidad, unidad, conceptoSugerido } = useMemo<ComputoResult>(() => {
    const aplicarDesperdicioYRepeticiones = (
      base: number,
      repeticiones: number,
      desperdicio: number
    ) => {
      const rep = Math.max(num(repeticiones || 1), 1);
      const desp = Math.max(Math.min(num(desperdicio || 0), 30), 0);
      return base * rep * (1 + desp / 100);
    };

    switch (tipo) {
      case "zapatas": {
        const cantElem = Math.max(num(zCant || 1), 0) || 1;
        const volumenUnitario = num(zBase) * num(zAncho) * num(zProf);
        const base = volumenUnitario * cantElem;
        const c = aplicarDesperdicioYRepeticiones(
          base,
          num(zRepeticiones),
          num(zDesperdicio)
        );
        const rep = Math.max(num(zRepeticiones || 1), 1);
        const desp = Math.max(Math.min(num(zDesperdicio || 0), 30), 0);
        return {
          cantidad: c,
          unidad: "M³",
          conceptoSugerido: `Excavación, armado y llenado de bases/zapatas de H°A° (${rep} series de ${cantElem} unidad${
            cantElem === 1 ? "" : "es"
          } de ${zBase || "-"} × ${zAncho || "-"} × ${zProf || "-"} m) + ${desp}% desperdicio, según cálculo estructural.`,
        };
      }

      case "columnas": {
        const cantElem = Math.max(num(cCant || 1), 0) || 1;
        const seccion = num(cB) * num(cH);
        const volumenUnitario = seccion * num(cLong);
        const base =
          cUnidad === "M³"
            ? volumenUnitario * cantElem
            : num(cLong) * cantElem;
        const c = aplicarDesperdicioYRepeticiones(
          base,
          num(cRepeticiones),
          num(cDesperdicio)
        );
        const rep = Math.max(num(cRepeticiones || 1), 1);
        const desp = Math.max(Math.min(num(cDesperdicio || 0), 30), 0);
        return {
          cantidad: c,
          unidad: cUnidad,
          conceptoSugerido: `Armado y llenado de columnas y vigas de H°A° (${rep} series de ${cantElem} unidad${
            cantElem === 1 ? "" : "es"
          } de ${cB || "-"} × ${cH || "-"} × ${cLong || "-"} m) + ${desp}% desperdicio, encofrado y armadura incluidos.`,
        };
      }

      case "losa": {
        const base = num(lLargo) * num(lAncho);
        const c = aplicarDesperdicioYRepeticiones(
          base,
          num(lRepeticiones),
          num(lDesperdicio)
        );
        const rep = Math.max(num(lRepeticiones || 1), 1);
        const desp = Math.max(Math.min(num(lDesperdicio || 0), 30), 0);
        return {
          cantidad: c,
          unidad: "M²",
          conceptoSugerido: `Losa de viguetas con telgopor (${rep} un de ${lLargo || "-"}×${lAncho || "-"}m) + ${desp}% desperdicio -> Total: ${c.toFixed(2)} m². Incluye carpeta de compresión de hormigón H-21, malla de repartición y encofrado.`,
        };
      }

      case "mamposteria": {
        const superficie = Math.max(
          num(mLargo) * num(mAlto) - num(mVanos),
          0
        );
        const base =
          mUnidad === "M³"
            ? superficie * num(mEspesor)
            : superficie;
        const c = aplicarDesperdicioYRepeticiones(
          base,
          num(mRepeticiones),
          num(mDesperdicio)
        );
        const rep = Math.max(num(mRepeticiones || 1), 1);
        const desp = Math.max(Math.min(num(mDesperdicio || 0), 30), 0);
        return {
          cantidad: c,
          unidad: mUnidad,
          conceptoSugerido: `Mampostería de ${mTipoLadrillo} (${rep} repeticiones) + ${desp}% desperdicio, asentada con mezcla cementicia 1:2:8, incluye mano de obra de elevación, descontados vanos.`,
        };
      }

      case "superficie": {
        const base = num(sLargo) * num(sAncho);
        const c = aplicarDesperdicioYRepeticiones(
          base,
          num(sRepeticiones),
          num(sDesperdicio)
        );
        const rep = Math.max(num(sRepeticiones || 1), 1);
        const desp = Math.max(Math.min(num(sDesperdicio || 0), 30), 0);
        return {
          cantidad: c,
          unidad: "M²",
          conceptoSugerido: `${sTipo} (${rep} repeticiones) + ${desp}% desperdicio, terminación según especificaciones técnicas, incluye materiales y mano de obra de aplicación.`,
        };
      }

      case "manual":
      default:
        const desp = Math.max(Math.min(num(manDesperdicio || 0), 30), 0);
        const c = num(manCantidad) * (1 + desp / 100);
        return {
          cantidad: c,
          unidad: manUnidad,
          conceptoSugerido: desp > 0 ? `${manConcepto} + ${desp}% desperdicio` : manConcepto,
        };
    }
  }, [
    tipo,
    zBase,
    zAncho,
    zProf,
    zCant,
    zRepeticiones,
    zDesperdicio,
    cB,
    cH,
    cLong,
    cCant,
    cRepeticiones,
    cDesperdicio,
    cUnidad,
    lLargo,
    lAncho,
    lRepeticiones,
    lDesperdicio,
    mLargo,
    mAlto,
    mVanos,
    mTipoLadrillo,
    mUnidad,
    mEspesor,
    mRepeticiones,
    mDesperdicio,
    sLargo,
    sAncho,
    sTipo,
    sRepeticiones,
    sDesperdicio,
    manConcepto,
    manUnidad,
    manCantidad,
    manDesperdicio,
  ]);

  const conceptoFinal = concepto || conceptoSugerido;
  const costoEstimado =
    cantidad * (num(precioMaterial) + num(precioManoObra));

  const handleAdd = useCallback(() => {
    if (!conceptoFinal.trim() || cantidad <= 0) return;
    onAdd({
      concepto: conceptoFinal,
      unidad,
      cantidad: Number(cantidad.toFixed(3)),
      precioMaterial: num(precioMaterial),
      precioManoObra: num(precioManoObra),
    });
  }, [conceptoFinal, cantidad, unidad, precioMaterial, precioManoObra, onAdd]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto print:hidden">
      <div className="max-h-[90vh] flex flex-col w-full max-w-2xl bg-white rounded-xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2 text-slate-800">
            <Calculator className="h-5 w-5" style={{ color: "#b8722a" }} />
            <h2 className="text-base font-semibold">
              Asistente de Cómputo Métrico
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs de tipo de cómputo */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 px-5 py-3">
          {TIPOS_COMPUTO.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTipo(t.id);
                setConcepto("");
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                tipo === t.id
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              style={
                tipo === t.id
                  ? { backgroundColor: "#3e2723", color: "#ffffff" }
                  : undefined
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Cuerpo con scroll garantizado */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* Campos según tipo */}
          {tipo === "zapatas" && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <NumField label="Base (m)" value={zBase} onChange={setZBase} />
              <NumField label="Ancho (m)" value={zAncho} onChange={setZAncho} />
              <NumField
                label="Profundidad (m)"
                value={zProf}
                onChange={setZProf}
              />
              <NumField
                label="Cantidad / Elementos (u)"
                value={zCant}
                onChange={setZCant}
              />
              <NumField
                label="Repeticiones Idénticas (u)"
                value={zRepeticiones}
                onChange={setZRepeticiones}
              />
              <NumField
                label="Desperdicio (%)"
                value={zDesperdicio}
                onChange={setZDesperdicio}
              />
            </div>
          )}

          {tipo === "columnas" && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <NumField label="Sección b (m)" value={cB} onChange={setCB} />
              <NumField label="Sección h (m)" value={cH} onChange={setCH} />
              <NumField
                label="Longitud de un elemento (m)"
                value={cLong}
                onChange={setCLong}
              />
              <NumField
                label="Cantidad / Elementos (u)"
                value={cCant}
                onChange={setCCant}
              />
              <NumField
                label="Repeticiones Idénticas (u)"
                value={cRepeticiones}
                onChange={setCRepeticiones}
              />
              <NumField
                label="Desperdicio (%)"
                value={cDesperdicio}
                onChange={setCDesperdicio}
              />
              <SelectField
                label="Unidad de salida"
                value={cUnidad}
                onChange={setCUnidad}
                options={["M³", "ml"]}
              />
            </div>
          )}

          {tipo === "losa" && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <NumField label="Largo (m)" value={lLargo} onChange={setLLargo} />
              <NumField label="Ancho (m)" value={lAncho} onChange={setLAncho} />
              <NumField
                label="Repeticiones Idénticas (u)"
                value={lRepeticiones}
                onChange={setLRepeticiones}
              />
              <NumField
                label="Desperdicio (%)"
                value={lDesperdicio}
                onChange={setLDesperdicio}
              />
            </div>
          )}

          {tipo === "mamposteria" && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <NumField label="Largo (m)" value={mLargo} onChange={setMLargo} />
              <NumField label="Alto (m)" value={mAlto} onChange={setMAlto} />
              <NumField
                label="Vanos a descontar (M²)"
                value={mVanos}
                onChange={setMVanos}
              />
              <SelectField
                label="Unidad de salida"
                value={mUnidad}
                onChange={setMUnidad}
                options={["M²", "M³"]}
              />
              {mUnidad === "M³" && (
                <NumField
                  label="Espesor del muro (m)"
                  value={mEspesor}
                  onChange={setMEspesor}
                />
              )}
              <SelectField
                label="Tipo de mampostería"
                value={mTipoLadrillo}
                onChange={setMTipoLadrillo}
                options={[
                  "Ladrillo hueco 18x18x33",
                  "Ladrillo hueco 12x18x33",
                  "Ladrillo hueco 8x18x33",
                  "Ladrillo común",
                  "Bloque de hormigón",
                ]}
                className="col-span-2"
              />
              <NumField
                label="Repeticiones Idénticas (u)"
                value={mRepeticiones}
                onChange={setMRepeticiones}
              />
              <NumField
                label="Desperdicio (%)"
                value={mDesperdicio}
                onChange={setMDesperdicio}
              />
            </div>
          )}

          {tipo === "superficie" && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <NumField label="Largo (m)" value={sLargo} onChange={setSLargo} />
              <NumField label="Ancho (m)" value={sAncho} onChange={setSAncho} />
              <SelectField
                label="Tipo de trabajo"
                value={sTipo}
                onChange={setSTipo}
                options={[
                  "Contrapiso de hormigón pobre",
                  "Carpeta de nivelación",
                  "Revoque grueso a la cal",
                  "Revoque fino terminado",
                ]}
                className="col-span-2"
              />
              <NumField
                label="Repeticiones Idénticas (u)"
                value={sRepeticiones}
                onChange={setSRepeticiones}
              />
              <NumField
                label="Desperdicio (%)"
                value={sDesperdicio}
                onChange={setSDesperdicio}
              />
            </div>
          )}

          {tipo === "manual" && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <SelectField
                label="Unidad"
                value={manUnidad}
                onChange={setManUnidad}
                options={UNIDADES_OPCIONES}
              />
              <NumField
                label="Cantidad"
                value={manCantidad}
                onChange={setManCantidad}
              />
              <NumField
                label="Desperdicio (%)"
                value={manDesperdicio}
                onChange={setManDesperdicio}
              />
            </div>
          )}

          {/* Concepto (editable) */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Concepto / Descripción (editable)
            </label>
            <textarea
              value={conceptoFinal}
              onChange={(e) => setConcepto(e.target.value)}
              rows={3}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-blue-400"
              style={{ borderColor: "#e7e0db" }}
              placeholder="Describí el ítem de carga manual..."
            />
          </div>

          {/* Precios unitarios */}
          <div className="grid grid-cols-2 gap-3">
            <NumField
              label="Precio Unitario Material ($)"
              value={precioMaterial}
              onChange={setPrecioMaterial}
            />
            <NumField
              label="Precio Mano de Obra ($)"
              value={precioManoObra}
              onChange={setPrecioManoObra}
            />
          </div>

          {/* Resumen de cálculo */}
          <div className="border-t border-slate-200 pt-4 space-y-2 bg-blue-50 p-3 rounded-md">
            <div className="flex items-center justify-between text-sm text-slate-700">
              <span>Metraje final a presupuestar:</span>
              <span className="font-semibold">
                {cantidad > 0
                  ? cantidad.toLocaleString("es-AR", {
                      maximumFractionDigits: 3,
                    })
                  : "0"}{" "}
                {unidad}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-700">
              <span>Subtotal Materiales:</span>
              <span className="font-semibold">
                {formatARS(cantidad * num(precioMaterial))}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-700">
              <span>Subtotal Mano de Obra:</span>
              <span className="font-semibold">
                {formatARS(cantidad * num(precioManoObra))}
              </span>
            </div>
            <div className="flex items-center justify-between text-base font-bold text-white rounded px-3 py-2" style={{ backgroundColor: "#3e2723" }}>
              <span>Costo Total Ítem</span>
              <span>{formatARS(costoEstimado)}</span>
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4 bg-slate-50">
          <button
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            style={{ borderColor: "#e7e0db" }}
          >
            Cancelar
          </button>
          <button
            onClick={handleAdd}
            disabled={!conceptoFinal.trim() || cantidad <= 0}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: "#3e2723" }}
          >
            <Plus className="h-4 w-4" />
            Agregar a la planilla
          </button>
        </div>
      </div>
    </div>
  );
}
