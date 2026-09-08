"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET = "comprobantes";
export type LiquidacionActionState = { error?: string; success?: string };

function storagePathFromUrl(url: string) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  return index >= 0 ? decodeURIComponent(url.slice(index + marker.length)) : url;
}

function safeFolder(name: string, id: number) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `obra-${id}`;
}

export async function guardarLiquidacion(_previousState: LiquidacionActionState, formData: FormData): Promise<LiquidacionActionState> {
  const obraId = Number(formData.get("obra_id"));
  const semanaTexto = String(formData.get("semana") ?? formData.get("semana_etiqueta") ?? "").trim();
  const fechaPago = String(formData.get("fecha_pago") ?? "").trim();
  const montoTotal = Number(formData.get("total_pagado"));
  const file = formData.get("file");

  if (!Number.isInteger(obraId) || !semanaTexto || !Number.isFinite(montoTotal) || !(file instanceof File) || file.size === 0) {
    return { error: "Completá la obra, semana, monto total y adjuntá un archivo." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: obra } = await supabase.from("obras").select("nombre").eq("id", obraId).maybeSingle();
  if (!obra) return { error: "La obra seleccionada no existe." };

  const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${safeFolder(obra.nombre, obraId)}/liquidaciones/${Date.now()}-${filename}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (uploadError) return { error: `No se pudo subir la planilla: ${uploadError.message}` };

  const archivoUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const database = supabase as unknown as { from: (table: string) => { insert: (value: unknown) => Promise<{ error: { message: string } | null }> } };
  const payload = {
    obra_id: Number(obraId),
    semana_etiqueta: semanaTexto,
    fecha_pago: fechaPago || new Date().toISOString().split("T")[0],
    total_pagado: Number(montoTotal) || 0,
    archivo_url: archivoUrl,
  };
  const { error } = await database.from("caja_semanal").insert(payload);
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    return { error: `No se pudo registrar la liquidación: ${error.message}` };
  }

  revalidatePath("/erp/contabilidad/liquidaciones");
  return { success: "Planilla guardada correctamente." };
}

export async function eliminarLiquidacion(id: number, storageUrl: string | null) {
  if (!Number.isInteger(id) || id <= 0) return { error: "La liquidación seleccionada no es válida." };
  const supabase = await createSupabaseServerClient();
  if (storageUrl) await supabase.storage.from(BUCKET).remove([storagePathFromUrl(storageUrl)]);

  const database = supabase as unknown as { from: (table: string) => { delete: () => { eq: (column: string, value: number) => Promise<{ error: { message: string } | null }> } } };
  const { error } = await database.from("caja_semanal").delete().eq("id", id);
  if (error) return { error: `No se pudo eliminar la liquidación: ${error.message}` };
  revalidatePath("/erp/contabilidad/liquidaciones");
  return { success: "Liquidación eliminada." };
}
