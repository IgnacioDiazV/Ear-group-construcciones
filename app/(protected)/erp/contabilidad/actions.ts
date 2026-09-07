"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET = "comprobantes";
export type ExpenseActionState = { error?: string; success?: string };

type ExpenseInsert = {
  obra_id: number;
  rubro: string;
  descripcion: string;
  precio_unitario: number;
  fecha: string;
  comprobante_archivo_url: string | null;
};

export async function cargarComprobante(_previousState: ExpenseActionState, formData: FormData): Promise<ExpenseActionState> {
  const obraId = Number(formData.get("obra_id"));
  const rubro = String(formData.get("rubro") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const precioUnitario = Number(formData.get("precio_unitario"));
  const fecha = String(formData.get("fecha") ?? "");
  const file = formData.get("file");

  if (!Number.isInteger(obraId) || !rubro || !descripcion || !Number.isFinite(precioUnitario) || !fecha) {
    return { error: "Completá obra, rubro, descripción, importe y fecha." };
  }

  const supabase = await createSupabaseServerClient();
  let comprobantePath: string | null = null;
  let comprobanteUrl: string | null = null;

  if (file instanceof File && file.size > 0) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    comprobantePath = `obra_${obraId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(comprobantePath, file, { upsert: false });
    if (uploadError) return { error: `No se pudo subir el comprobante: ${uploadError.message}` };
    comprobanteUrl = supabase.storage.from(BUCKET).getPublicUrl(comprobantePath).data.publicUrl;
  }

  const expense: ExpenseInsert = { obra_id: obraId, rubro, descripcion, precio_unitario: precioUnitario, fecha, comprobante_archivo_url: comprobanteUrl };
  const { error } = await (supabase.from("gastos_obra") as unknown as { insert: (value: ExpenseInsert) => Promise<{ error: { message: string } | null }> }).insert(expense);

  if (error) {
    if (comprobantePath) await supabase.storage.from(BUCKET).remove([comprobantePath]);
    return { error: `No se pudo registrar el gasto: ${error.message}` };
  }

  revalidatePath("/erp/contabilidad");
  revalidatePath(`/erp/obras/${obraId}`);
  return { success: "Comprobante registrado correctamente." };
}
