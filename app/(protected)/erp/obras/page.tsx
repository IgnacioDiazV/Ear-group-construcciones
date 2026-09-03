import Link from "next/link";
import { getObras, type Obra } from "@/features/obras/queries";

const statusStyles: Record<string, string> = {
  ejecucion: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30",
  finalizada: "bg-sky-400/15 text-sky-300 ring-sky-400/30",
  presupuesto: "bg-amber-400/15 text-amber-300 ring-amber-400/30",
  revision: "bg-violet-400/15 text-violet-300 ring-violet-400/30",
};

function formatStatus(status: string | null) {
  if (!status) return "Sin estado";
  return status.charAt(0).toUpperCase() + status.slice(1).replaceAll("_", " ");
}

function formatBudget(obra: Obra) {
  if (obra.presupuesto_base === null) return "Sin presupuesto";

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: obra.moneda_base === "USD" ? "USD" : "ARS",
    maximumFractionDigits: 0,
  }).format(obra.presupuesto_base);
}

function formatDate(date: string | null) {
  if (!date) return "Sin fecha";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function StatusBadge({ status }: { status: string | null }) {
  const normalizedStatus = status?.toLowerCase() ?? "";
  const style = statusStyles[normalizedStatus] ?? "bg-white/10 text-slate-300 ring-white/15";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${style}`}>
      {formatStatus(status)}
    </span>
  );
}

function ObraCard({ obra }: { obra: Obra }) {
  return (
    <article className="group rounded-xl border border-white/10 bg-[#17202a] p-5 shadow-2xl shadow-black/10 transition hover:-translate-y-0.5 hover:border-amber-300/40">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-xs font-semibold tracking-wider text-amber-300">{obra.codigo}</p>
          <h2 className="text-lg font-bold text-white">{obra.nombre}</h2>
        </div>
        <StatusBadge status={obra.estado} />
      </div>

      <dl className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 text-sm">
        <div>
          <dt className="text-slate-500">Tipo de obra</dt>
          <dd className="mt-1 font-medium text-slate-200">{obra.tipo_obra}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Presupuesto base</dt>
          <dd className="mt-1 font-medium text-slate-200">{formatBudget(obra)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-slate-500">Ubicación</dt>
          <dd className="mt-1 font-medium text-slate-200">{obra.direccion ?? "Sin dirección cargada"}</dd>
        </div>
      </dl>

      <Link
        className="mt-5 inline-flex text-sm font-semibold text-amber-300 transition group-hover:text-amber-200"
        href={`/erp/obras/${obra.id}`}
      >
        Ver detalle <span aria-hidden="true" className="ml-2">-&gt;</span>
      </Link>
    </article>
  );
}

export default async function ObrasPage() {
  const obras = await getObras();
  const activeCount = obras.filter((obra) => obra.estado?.toLowerCase() === "ejecucion").length;
  const publicCount = obras.filter((obra) => obra.es_publica_web).length;
  const budgetCount = obras.filter((obra) => obra.presupuesto_base !== null).length;

  return (
    <main className="min-h-screen bg-[#0d141b] text-slate-100">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-300">EAR Group / ERP</p>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Obras y proyectos</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">Centro de control de obras, presupuestos y documentación operativa.</p>
          </div>
          <Link
            className="inline-flex items-center justify-center rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-bold text-[#17202a] transition hover:bg-amber-200"
            href="/erp/obras/nueva"
          >
            + Nueva obra
          </Link>
        </header>

        <section aria-label="Resumen de obras" className="mb-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-[#131c24] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total de obras</p>
            <p className="mt-2 text-3xl font-bold text-white">{obras.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#131c24] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">En ejecución</p>
            <p className="mt-2 text-3xl font-bold text-emerald-300">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#131c24] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Con presupuesto cargado</p>
            <p className="mt-2 text-3xl font-bold text-amber-300">{budgetCount}</p>
            <p className="mt-1 text-xs text-slate-500">{publicCount} visibles en la web pública</p>
          </div>
        </section>

        {obras.length === 0 ? (
          <section className="rounded-xl border border-dashed border-white/15 bg-[#131c24] px-6 py-16 text-center">
            <p className="text-lg font-semibold text-white">Todavía no hay obras cargadas</p>
            <p className="mt-2 text-sm text-slate-400">Creá la primera obra para comenzar a centralizar la operación.</p>
          </section>
        ) : (
          <>
            <section aria-label="Obras destacadas" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {obras.map((obra) => <ObraCard key={obra.id} obra={obra} />)}
            </section>

            <section className="mt-10 overflow-hidden rounded-xl border border-white/10 bg-[#131c24]">
              <div className="border-b border-white/10 px-5 py-4">
                <h2 className="font-bold text-white">Vista detallada</h2>
                <p className="mt-1 text-sm text-slate-500">Información principal de cada centro de costos.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Código / obra</th>
                      <th className="px-5 py-3 font-semibold">Estado</th>
                      <th className="px-5 py-3 font-semibold">Inicio</th>
                      <th className="px-5 py-3 font-semibold">Cierre estimado</th>
                      <th className="px-5 py-3 text-right font-semibold">Presupuesto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {obras.map((obra) => (
                      <tr className="transition hover:bg-white/[0.03]" key={`row-${obra.id}`}>
                        <td className="px-5 py-4">
                          <Link className="font-semibold text-white hover:text-amber-300" href={`/erp/obras/${obra.id}`}>
                            {obra.nombre}
                          </Link>
                          <p className="mt-1 font-mono text-xs text-amber-300">{obra.codigo}</p>
                        </td>
                        <td className="px-5 py-4"><StatusBadge status={obra.estado} /></td>
                        <td className="px-5 py-4 text-slate-400">{formatDate(obra.fecha_inicio)}</td>
                        <td className="px-5 py-4 text-slate-400">{formatDate(obra.fecha_fin_estimada)}</td>
                        <td className="px-5 py-4 text-right font-medium text-slate-200">{formatBudget(obra)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}