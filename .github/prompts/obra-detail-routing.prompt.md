---
description: Refactorizar el enrutamiento dinámico de obras por código/slug y pulir la interfaz del detalle de obra
---
Trabajá únicamente sobre los archivos indicados con `#file:`.

Objetivos y Reglas:

1. Enrutamiento dinámico (App Router):
   - Migrar el parámetro de ruta de `[id]` a `[codigo]` (ej: `/erp/obras/OBR-03`).
   - Manejar correctamente el tipado de `params` según Next.js (si `params` es `Promise<{ codigo: string }>`, aplicar `await params` antes de usarlo).
   - En la consulta a Supabase, buscar por `.eq('codigo', decodedCodigo)` sobre `public.obras`.
   - Actualizar los enlaces `<Link href="...">` en el listado general (`/erp/obras`) para que naveguen usando `obra.codigo`.

2. Botón "Volver":
   - Sustituir el texto plano `<- Volver a obras` por un botón secundario estilizado.
   - Usar Tailwind: `inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 text-xs font-medium transition cursor-pointer`.
   - Iconografía sutil (`←` o ícono SVG) alineado a la izquierda.

3. Reubicación del badge de estado:
   - Quitar el chip de estado (`obra.estado`) de la barra de acciones superiores (al lado de "Editar información").
   - Integrarlo en la tarjeta o bloque de metadatos de fechas, situándolo inmediatamente al lado del valor de "Cierre real".
   - Mantener los estilos de badge acordes al estado (ej: verde/emerald para ejecución, neutro para presupuesto/revisión).

Salida:
- Devolver los archivos necesarios actualizados manteniendo intacta la lógica de mutaciones o acciones existentes.