"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OBRA_ESTADOS } from "./estado";

export type ObraActionState = {
  error?: string;
  success?: string;
};

function readOptionalNumber(value: FormDataEntryValue | null) {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function createObra(
  _previousState: ObraActionState,
  formData: FormData,
): Promise<ObraActionState> {
  const codigo = String(formData.get("codigo") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const tipoObra = String(formData.get("tipo_obra") ?? "").trim();
  const estado = String(formData.get("estado") ?? "presupuesto").trim().toLowerCase();

  if (!codigo || !nombre || !tipoObra || !OBRA_ESTADOS.includes(estado as (typeof OBRA_ESTADOS)[number])) {
    return { error: "Completá código, nombre y tipo de obra." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("obras").insert({
    codigo,
    direccion: String(formData.get("direccion") ?? "").trim() || null,
    estado,
    fecha_fin_estimada: String(formData.get("fecha_fin_estimada") ?? "") || null,
    fecha_inicio: String(formData.get("fecha_inicio") ?? "") || null,
    moneda_base: String(formData.get("moneda_base") ?? "ARS"),
    nombre,
    presupuesto_base: readOptionalNumber(formData.get("presupuesto_base")),
    tipo_obra: tipoObra,
  });

  if (error) {
    return { error: `No se pudo guardar la obra: ${error.message}` };
  }

  revalidatePath("/erp/obras");
  return { success: "La obra fue creada correctamente." };
}

export async function seedObras(): Promise<ObraActionState> {
  const supabase = await createSupabaseServerClient();
  const { count, error: countError } = await supabase
    .from("obras")
    .select("id", { count: "exact", head: true });

  if (countError) {
    return { error: `No se pudo verificar la tabla de obras: ${countError.message}` };
  }

  if ((count ?? 0) > 0) {
    return { error: "La tabla ya contiene obras. No se cargaron semillas." };
  }

  const { error } = await supabase.from("obras").insert([
    {
      codigo: "OBR-TA-002",
      estado: "en_ejecucion",
      es_publica_web: true,
      moneda_base: "ARS",
      nombre: "Torre Alvear - Fase 2",
      presupuesto_base: 7793000,
      tipo_obra: "Residencial Multifamiliar",
    },
    {
      codigo: "OBR-CS-001",
      estado: "presupuesto",
      es_publica_web: true,
      moneda_base: "USD",
      nombre: "Complejo Residencial Siandencio",
      presupuesto_base: 420000,
      tipo_obra: "Residencial",
    },
  ]);

  if (error) {
    return { error: `No se pudieron cargar las semillas: ${error.message}` };
  }

  revalidatePath("/erp/obras");
  return { success: "Se cargaron las dos obras de prueba." };
}