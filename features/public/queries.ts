import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ObraPublica = Pick<Database["public"]["Tables"]["obras"]["Row"], "id" | "nombre" | "tipo_obra" | "direccion" | "estado" | "created_at"> & {
  portada_url: string | null;
};

export async function getObrasPublicas(): Promise<ObraPublica[]> {
  const supabase = await createSupabaseServerClient();
  const { data: obras, error: obrasError } = await supabase
    .from("obras")
    .select("id, nombre, tipo_obra, direccion, estado, created_at")
    .eq("es_publica_web", true)
    .order("created_at", { ascending: false });

  if (obrasError || !obras || obras.length === 0) return [];

  const obraIds = obras.map((obra) => obra.id);
  const { data: documentos } = await supabase
    .from("documentos_obra")
    .select("obra_id, archivo_url, tipo, created_at")
    .in("obra_id", obraIds)
    .order("created_at", { ascending: true });

  const portadaPorObra = new Map<number, string>();
  for (const documento of documentos ?? []) {
    if (!portadaPorObra.has(documento.obra_id)) {
      portadaPorObra.set(documento.obra_id, documento.archivo_url);
    }
  }

  return obras.map((obra) => ({
    ...obra,
    portada_url: portadaPorObra.get(obra.id) ?? null,
  }));
}
