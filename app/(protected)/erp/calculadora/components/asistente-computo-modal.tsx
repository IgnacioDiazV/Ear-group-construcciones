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
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
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
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
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

  // Columnas / Vigas
  const [cB, setCB] = useState<string>("");
  const [cH, setCH] = useState<string>("");
  const [cLong, setCLong] = useState<string>("");
  const [cCant, setCCant] = useState<string>("1");
  const [cUnidad, setCUnidad] = useState<string>("M³");

  // Losa
  const [lLargo, setLLargo] = useState<string>("");
  const [lAncho, setLAncho] = useState<string>("");

  // Mampostería
  const [mLargo, setMLargo] = useState<string>("");
  const [mAlto, setMAlto] = useState<string>("");
  const [mVanos, setMVanos] = useState<string>("0");
  const [mTipoLadrillo, setMTipoLadrillo] = useState<string>(
    "Ladrillo hueco 18x18x33"
  );
  const [mUnidad, setMUnidad] = useState<string>("M²");
  const [mEspesor, setMEspesor] = useState<string>("0.15");

  // Superficie (contrapiso/carpeta/revoque)
  const [sLargo, setSLargo] = useState<string>("");
  const [sAncho, setSAncho] = useState<string>("");
  const [sTipo, setSTipo] = useState<string>(
    "Contrapiso de hormigón pobre"
  );

  // Manual
  const [manConcepto, setManConcepto] = useState<string>("");
  const [manUnidad, setManUnidad] = useState<string>("gl");
  const [manCantidad, setManCantidad] = useState<string>("1");

  // Precios comunes
  const [precioMaterial, setPrecioMaterial] = useState<string>("");
  const [precioManoObra, setPrecioManoObra] = useState<string>("");
  const [concepto, setConcepto] = useState<string>("");

  // Cálculo de cantidad y unidad según el tipo activo
  const { cantidad, unidad, conceptoSugerido } = useMemo<ComputoResult>(() => {
    switch (tipo) {
      case "zapatas": {
        const cantElem = Math.max(num(zCant || 1), 0) || 1;
        const volumenUnitario = num(zBase) * num(zAncho) * num(zProf);
        const c = volumenUnitario * cantElem;
        return {
          cantidad: c,
          unidad: "M³",
          conceptoSugerido: `Excavación, armado y llenado de bases/zapatas de H°A° (${cantElem} unidad${
            cantElem === 1 ? "" : "es"
          } de ${zBase || "-"} × ${zAncho || "-"} × ${zProf || "-"} m), según cálculo estructural.`,
        };
      }

      case "columnas": {
        const cantElem = Math.max(num(cCant || 1), 0) || 1;
        const seccion = num(cB) * num(cH);
        const volumenUnitario = seccion * num(cLong);
        const c =
          cUnidad === "M³"
            ? volumenUnitario * cantElem
            : num(cLong) * cantElem;
        return {
          cantidad: c,
          unidad: cUnidad,
          conceptoSugerido: `Armado y llenado de columnas y vigas de H°A° (${cantElem} unidad${
            cantElem === 1 ? "" : "es"
          } de ${cB || "-"} × ${cH || "-"} × ${cLong || "-"} m), encofrado y armadura incluidos.`,
        };
      }

      case "losa": {
        const c = num(lLargo) * num(lAncho);
        return {
          cantidad: c,
          unidad: "M²",
          conceptoSugerido: `Losa de hormigón armado con viguetas pretensadas y bloques de telgopor (EPS), incluye carpeta de compresión de hormigón H-21, malla de repartición y encofrado.`,
        };
      }

      case "mamposteria": {
        const superficie = Math.max(
          num(mLargo) * num(mAlto) - num(mVanos),
          0
        );
        const c =
          mUnidad === "M³"
            ? superficie * num(mEspesor)
            : superficie;
        return {
          cantidad: c,
          unidad: mUnidad,
          conceptoSugerido: `Mampostería de ${mTipoLadrillo}, asentada con mezcla cementicia 1:2:8, incluye mano de obra de elevación, descontados vanos.`,
        };
      }

      case "superficie": {
        const c = num(sLargo) * num(sAncho);
        return {
          cantidad: c,
          unidad: "M²",
          conceptoSugerido: `${sTipo}, terminación según especificaciones técnicas, incluye materiales y mano de obra de aplicación.`,
        };
      }

      case "manual":
      default:
        return {
          cantidad: num(manCantidad),
          unidad: manUnidad,
          conceptoSugerido: manConcepto,
        };
    }
  }, [
    tipo,
    zBase,
    zAncho,
    zProf,
    zCant,
    cB,
    cH,
    cLong,
    cCant,
    cUnidad,
    lLargo,
    lAncho,
    mLargo,
    mAlto,
    mVanos,
    mTipoLadrillo,
    mUnidad,
    mEspesor,
    sLargo,
    sAncho,
    sTipo,
    manConcepto,
    manUnidad,
    manCantidad,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 print:hidden">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
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
                  ? { backgroundColor: "#3d1c14", color: "#ffffff" }
                  : undefined
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-5 px-5 py-5">
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
                label="Cantidad de elementos iguales"
                value={zCant}
                onChange={setZCant}
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
                label="Cantidad de elementos iguales"
                value={cCant}
                onChange={setCCant}
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
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              placeholder="Describí el ítem de carga manual..."
            />
          </div>

          {/* Resultado del cómputo */}
          <div
            className="flex items-center justify-between rounded-md px-4 py-3 text-sm font-semibold"
            style={{
              backgroundColor: "#fef3e2",
              color: "#8d6e63",
            }}
          >
            <span>Cantidad calculada</span>
            <span style={{ color: "#3d1c14", fontSize: "14px" }}>
              {cantidad > 0
                ? cantidad.toLocaleString("es-AR", {
                    maximumFractionDigits: 3,
                  })
                : "0"}{" "}
              {unidad}
            </span>
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

          <div className="space-y-1 border-t border-slate-200 pt-3 text-sm">
            <div className="flex items-center justify-between text-slate-600">
              <span>
                Precio Unitario (Material + Mano de Obra)
              </span>
              <span className="font-medium">
                {formatARS(num(precioMaterial) + num(precioManoObra))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-600">
                Costo total estimado ({cantidad > 0
                  ? cantidad.toLocaleString("es-AR", {
                      maximumFractionDigits: 3,
                    })
                  : 0}{" "}
                {unidad} × Precio Unitario)
              </span>
              <span className="text-lg font-bold" style={{ color: "#3d1c14" }}>
                {formatARS(costoEstimado)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleAdd}
            disabled={!conceptoFinal.trim() || cantidad <= 0}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: "#3d1c14" }}
          >
            <Plus className="h-4 w-4" />
            Agregar a la planilla
          </button>
        </div>
      </div>
    </div>
  );
}
