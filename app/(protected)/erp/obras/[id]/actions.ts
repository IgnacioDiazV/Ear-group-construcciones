"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ObraDetailActionState = { error?: string; success?: string };
export type DocumentActionState = { error?: string; success?: string };

const DOCUMENT_BUCKET = "obras-archivos";

function optionalNumber(value: FormDataEntryValue | null) {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export async function updateObra(
  _previousState: ObraDetailActionState,
  formData: FormData,
): Promise<ObraDetailActionState> {
  const id = Number(formData.get("obra_id"));
  const codigo = String(formData.get("codigo") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const tipoObra = String(formData.get("tipo_obra") ?? "").trim();

  if (!Number.isInteger(id) || id <= 0 || !codigo || !nombre || !tipoObra) {
    return { error: "Completá código, nombre y tipología de la obra." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("obras").update({
    codigo,
    direccion: String(formData.get("direccion") ?? "").trim() || null,
    estado: String(formData.get("estado") ?? "presupuesto"),
    es_publica_web: formData.get("es_publica_web") === "on",
    fecha_cierre_real: String(formData.get("fecha_cierre_real") ?? "") || null,
    fecha_fin_estimada: String(formData.get("fecha_fin_estimada") ?? "") || null,
    fecha_inicio: String(formData.get("fecha_inicio") ?? "") || null,
    moneda_base: String(formData.get("moneda_base") ?? "ARS"),
    nombre,
    presupuesto_base: optionalNumber(formData.get("presupuesto_base")),
    tipo_obra: tipoObra,
  }).eq("id", id);

  if (error) return { error: `No se pudo actualizar la obra: ${error.message}` };

  revalidatePath(`/erp/obras/${id}`);
  revalidatePath("/erp/obras");
  revalidatePath("/");
  return { success: "La información de la obra fue actualizada." };
}

export async function createDocumentoObra(
  _previousState: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  const obraId = Number(formData.get("obra_id"));
  const titulo = String(formData.get("titulo") ?? "").trim();
  const archivoUrl = String(formData.get("archivo_url") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "").trim();

  if (!Number.isInteger(obraId) || obraId <= 0 || !titulo || !archivoUrl || !tipo) {
    return { error: "Faltan datos del archivo para asociarlo a la obra." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("documentos_obra").insert({
    archivo_url: archivoUrl,
    obra_id: obraId,
    tipo,
    titulo,
  });

  if (error) return { error: `No se pudo registrar el archivo: ${error.message}` };

  revalidatePath(`/erp/obras/${obraId}`);
  return { success: "Archivo cargado correctamente." };
}

export async function deleteDocumentoObra(formData: FormData): Promise<DocumentActionState> {
  const obraId = Number(formData.get("obra_id"));
  const documentoId = Number(formData.get("documento_id"));
  const storagePath = String(formData.get("storage_path") ?? "").trim();

  if (!Number.isInteger(obraId) || !Number.isInteger(documentoId)) {
    return { error: "El archivo seleccionado no es válido." };
  }

  const supabase = await createSupabaseServerClient();
  if (storagePath) await supabase.storage.from(DOCUMENT_BUCKET).remove([storagePath]);

  const { error } = await supabase.from("documentos_obra").delete().eq("id", documentoId).eq("obra_id", obraId);
  if (error) return { error: `No se pudo eliminar el registro: ${error.message}` };

  revalidatePath(`/erp/obras/${obraId}`);
  return { success: "Archivo eliminado." };
}
