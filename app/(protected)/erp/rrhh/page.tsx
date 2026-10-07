import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EmpleadosTable } from "./empleados-table";
import type { Empleado } from "./actions";
import styles from "../inventario/inventario.module.css";

export const dynamic = "force-dynamic";

type Obra = { id: number; nombre: string; codigo: string };

export default async function RrhhPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: empleadosData, error: empleadosError }, { data: obrasData, error: obrasError }] = await Promise.all([
    supabase
      .from("empleados")
      .select("*, obra:obras(id, nombre, codigo)")
      .order("apellido", { ascending: true }),
    supabase.from("obras").select("id, nombre, codigo").order("nombre"),
  ]);

  const empleados = (empleadosData ?? []) as unknown as Empleado[];
  const obras = (obrasData ?? []) as Obra[];
  const error = empleadosError ?? obrasError;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1>Personal y equipo</h1>
            <p>Directorio de operarios, números de contacto y datos de emergencia.</p>
          </div>
        </header>

        {error && <div className={styles.error} role="alert">No se pudo cargar el personal: {error.message}</div>}

        <div className="mt-6">
          <EmpleadosTable initialData={empleados} obras={obras} />
        </div>
      </div>
    </main>
  );
}