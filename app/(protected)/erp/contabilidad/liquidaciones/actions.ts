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
  const obraIdRaw = String(formData.get("obra_id") ?? "").trim();
  const obraId = obraIdRaw ? Number(obraIdRaw) : null;
  const semanaTexto = String(formData.get("semana") ?? formData.get("semana_etiqueta") ?? "").trim();
  const fechaPago = String(formData.get("fecha_pago") ?? "").trim();
  const montoTotal = Number(formData.get("total_pagado"));
  const file = formData.get("file");

  if ((obraId !== null && !Number.isInteger(obraId)) || !semanaTexto || !Number.isFinite(montoTotal) || !(file instanceof File) || file.size === 0) {
    return { error: "Completá la semana, el monto total y adjuntá un archivo." };
  }

  const supabase = await createSupabaseServerClient();
  let obraNombre = "Planilla General (Multi-obra)";
  if (obraId !== null) {
    const { data: obra } = await supabase.from("obras").select("nombre").eq("id", obraId).maybeSingle();
    if (!obra) return { error: "La obra seleccionada no existe." };
    obraNombre = obra.nombre;
  }

  const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${safeFolder(obraNombre, obraId ?? 0)}/liquidaciones/${Date.now()}-${filename}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (uploadError) return { error: `No se pudo subir la planilla: ${uploadError.message}` };

  const archivoUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const database = supabase as unknown as { from: (table: string) => { insert: (value: unknown) => Promise<{ error: { message: string } | null }> } };
  const payload = {
    obra_id: obraId,
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

export async function eliminarLiquidacion(id: string, storageUrl: string | null) {
  const idLimpio = String(id ?? "").trim();
  if (!idLimpio) return { error: "La liquidación seleccionada no es válida." };

  const supabase = await createSupabaseServerClient();

  // Casteo para evitar el bloqueo de TypeScript por tipos desactualizados
  const db = supabase as any;

  // 1. Borrar archivo de storage si existe
  if (storageUrl) {
    try {
      const path = storagePathFromUrl(storageUrl);
      if (path) await supabase.storage.from(BUCKET).remove([path]);
    } catch (storageErr) {
      console.warn("No se pudo eliminar el archivo en storage:", storageErr);
    }
  }

  // 2. Borrar filas hijas en caja_semanal_filas si existen
  await db
    .from("caja_semanal_filas")
    .delete()
    .eq("caja_semanal_id", idLimpio);

  // 3. Borrar la cabecera en caja_semanal
  const { error } = await db
    .from("caja_semanal")
    .delete()
    .eq("id", idLimpio);

  if (error) {
    return { error: `No se pudo eliminar la liquidación: ${error.message}` };
  }

  revalidatePath("/erp/contabilidad/liquidaciones");
  return { success: "Liquidación eliminada." };
}