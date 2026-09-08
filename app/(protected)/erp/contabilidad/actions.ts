"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Groq from "groq-sdk";

const BUCKET = "comprobantes";
export type ExpenseActionState = { error?: string; success?: string };
export type ComprobanteOCR = {
  proveedor: string;
  fecha: string;
  total: number;
  tipo_comprobante: "Factura A" | "Factura B" | "Factura C" | "Ticket" | "Vale";
  rubro_sugerido: "Materiales" | "Combustible" | "Ferretería" | "Fletes" | "Varios";
  descripcion: string;
};

function storagePathFromUrl(url: string) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  return index >= 0 ? decodeURIComponent(url.slice(index + marker.length)) : url;
}

export async function eliminarGasto(id: number, storageUrl: string | null) {
  if (!Number.isInteger(id) || id <= 0) return { error: "El gasto seleccionado no es válido." };

  const supabase = await createSupabaseServerClient();
  if (storageUrl) {
    const storagePath = storagePathFromUrl(storageUrl);
    if (storagePath) await supabase.storage.from(BUCKET).remove([storagePath]);
  }

  const { error } = await supabase.from("gastos_obra").delete().eq("id", id);
  if (error) return { error: `No se pudo eliminar el gasto: ${error.message}` };

  revalidatePath("/erp/contabilidad");
  return { success: "Gasto eliminado correctamente." };
}

export async function analizarComprobante(formData: FormData): Promise<{ data?: ComprobanteOCR; error?: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Seleccioná una imagen o PDF para analizar." };
  if (!process.env.GROQ_API_KEY) return { error: "Falta configurar GROQ_API_KEY en el entorno." };

  try {
    const bytes = Buffer.from(await file.arrayBuffer()).toString("base64");
    const mimeType = file.type || "image/jpeg";
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const response = await groq.chat.completions.create({
      model: "llama-3.2-90b-vision-preview",
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content: "Eres un asistente contable. Analiza comprobantes de construcción y responde ÚNICAMENTE con un objeto JSON válido, sin bloques de código markdown ni texto adicional. La respuesta debe ser JSON.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analiza esta imagen de comprobante o factura de construcción y responde ÚNICAMENTE con un objeto JSON válido. Estructura requerida del JSON: { \"proveedor\": \"nombre\", \"fecha\": \"YYYY-MM-DD\", \"total\": 0.00, \"tipo_comprobante\": \"Factura A\", \"rubro_sugerido\": \"Materiales\", \"descripcion\": \"detalle\" }. Si un dato no es legible, usa string vacío o 0. No agregues texto fuera del objeto JSON.",
            },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${bytes}` } },
          ],
        },
      ],
    });
    const rawContent = response.choices[0]?.message?.content || "{}";
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    const parsedData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    return { data: parsedData as ComprobanteOCR };
  } catch (error) {
    return { error: `No se pudo analizar el comprobante: ${error instanceof Error ? error.message : "error desconocido"}` };
  }
}

type ExpenseInsert = {
  obra_id: number;
  rubro: string;
  descripcion: string;
  precio_unitario: number;
  fecha: string;
  comprobante_archivo_url: string | null;
  tipo_comprobante: string | null;
};

export async function cargarComprobante(_previousState: ExpenseActionState, formData: FormData): Promise<ExpenseActionState> {
  const obraId = Number(formData.get("obra_id"));
  const rubro = String(formData.get("rubro") ?? "").trim();
  const proveedor = String(formData.get("proveedor") ?? "").trim();
  const tipoComprobante = String(formData.get("tipo_comprobante") ?? "Ticket").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const precioUnitario = Number(formData.get("precio_unitario"));
  const fecha = String(formData.get("fecha") ?? "");
  const file = formData.get("file");

  if (!Number.isInteger(obraId) || !rubro || !descripcion || !Number.isFinite(precioUnitario) || !fecha) {
    return { error: "Completá obra, rubro, descripción, importe y fecha." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: obra } = await supabase.from("obras").select("nombre").eq("id", obraId).maybeSingle();
  if (!obra) return { error: "La obra seleccionada no existe." };
  let comprobantePath: string | null = null;
  let comprobanteUrl: string | null = null;

  if (file instanceof File && file.size > 0) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const folder = obra.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `obra-${obraId}`;
    comprobantePath = `${folder}/comprobantes/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(comprobantePath, file, { upsert: false });
    if (uploadError) return { error: `No se pudo subir el comprobante: ${uploadError.message}` };
    comprobanteUrl = supabase.storage.from(BUCKET).getPublicUrl(comprobantePath).data.publicUrl;
  }

  const expense: ExpenseInsert = { obra_id: obraId, rubro, descripcion: proveedor ? `${proveedor} - ${descripcion}` : descripcion, precio_unitario: precioUnitario, fecha, comprobante_archivo_url: comprobanteUrl, tipo_comprobante: tipoComprobante };
  const { error } = await (supabase.from("gastos_obra") as unknown as { insert: (value: ExpenseInsert) => Promise<{ error: { message: string } | null }> }).insert(expense);

  if (error) {
    if (comprobantePath) await supabase.storage.from(BUCKET).remove([comprobantePath]);
    return { error: `No se pudo registrar el gasto: ${error.message}` };
  }

  revalidatePath("/erp/contabilidad");
  revalidatePath(`/erp/obras/${obraId}`);
  return { success: "Comprobante registrado correctamente." };
}
