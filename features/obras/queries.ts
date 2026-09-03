import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Obra = Database["public"]["Tables"]["obras"]["Row"];

export async function getObras(): Promise<Obra[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("obras")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    throw new Error(`No se pudieron cargar las obras: ${error.message}`);
  }

  return data;
}