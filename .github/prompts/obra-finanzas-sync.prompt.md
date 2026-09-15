---
description: Sincronizar métricas financieras de cobros (anticipos_clientes) y gastos en el detalle de obra
---
Trabajá únicamente sobre los archivos indicados con `#file:`.

Reglas de negocio y datos:
1. Consultas en el Detalle de Obra (`app/(protected)/erp/obras/[codigo]/page.tsx`):
   - Una vez obtenida la obra mediante su código (`obra.id`), consultar en paralelo sobre `public.anticipos_clientes`:
     `supabase.from("anticipos_clientes").select("monto, estado, numero_cuota, total_cuotas").eq("obra_id", obra.id)`
   - Calcular:
     * `totalCobrado`: suma de `monto` donde `estado === 'cobrado'`.
     * `totalPendiente`: suma de `monto` donde `estado === 'pendiente'`.
     * `presupuestoAprobado`: `Number(obra.presupuesto_base ?? 0)`.
     * `saldoRestante`: `presupuestoAprobado - totalCobrado`.

2. Tarjetas métricas inferiores:
   - Configurar la fila de métricas con formato de moneda en pesos argentinos:
     `new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(valor)`
   - Tarjeta 1: PRESUPUESTO APROBADO (`presupuestoAprobado`).
   - Tarjeta 2: TOTAL COBRADO (`totalCobrado` y mostrar subtexto opcional con cantidad de cuotas cobradas).
   - Tarjeta 3: PENDIENTE DE COBRO (`totalPendiente` o `saldoRestante`).
   - Tarjeta 4: SALDO DISPONIBLE EN OBRA (`totalCobrado - gastosDirectos` si existen gastos, o balance proyectado).

3. Rendimiento y consistencia:
   - Mantener el Server Component sin consultas bloqueantes innecesarias.
   - Conservar el grid responsivo Tailwind existente (`bg-white rounded-xl border border-neutral-100 p-4 shadow-sm`).