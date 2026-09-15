---
description: Upgrade completo de comprobantes: edición in-place, buscador en tiempo real, fix de modal preview y dropzone refinado
---
Trabajá sobre:
- `#file:app/(protected)/erp/contabilidad/actions.ts`
- `#file:app/(protected)/erp/contabilidad/expense-table.tsx`
- `#file:app/(protected)/erp/contabilidad/expense-form.tsx`

Reglas técnicas y requerimientos:

1. Server Action de Edición (`actions.ts`):
   - Crear y exportar `actualizarGasto(_prevState: ExpenseActionState, formData: FormData): Promise<ExpenseActionState>`.
   - Extraer: `id` (Number), `obra_id` (Number), `rubro` (String), `descripcion` (String), `precio_unitario` (Number), `fecha` (String).
   - Validar datos y ejecutar:
     `supabase.from("gastos_obra").update({ obra_id, rubro, descripcion, precio_unitario, fecha }).eq("id", id)`.
   - Revalidar `/erp/contabilidad` y `/erp/obras/[id]`.

2. Buscador y Filtros (`expense-table.tsx`):
   - Agregar un input de búsqueda de texto `searchTerm` al lado del selector de obra.
   - Filtrar reactivamente en `useMemo`: por `obra_id` Y coincidencia en `descripcion`, `rubro`, `obra_nombre` o `precio_unitario`.
   - Si no hay coincidencias, mostrar mensaje "No se encontraron gastos que coincidan con la búsqueda".

3. Edición de Comprobantes (`expense-table.tsx`):
   - Agregar estado `editingExpense: Expense | null`.
   - En la columna de acciones, sumar el botón de editar (ícono lápiz ✎) antes del de eliminar.
   - Al hacer clic, abrir un modal centrado con backdrop oscuro para editar: Obra (select con `obras`), Rubro, Descripción, Importe y Fecha.
   - Enviar mediante `actualizarGasto` y cerrar al completar con éxito.

4. Fix de Previsualización (`expense-table.tsx`):
   - Asegurar que el modal de preview tenga backdrop fijo (`fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4`).
   - Contenedor blanco o neutro centrado (`bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl`).
   - Header con título, botón de descargar y botón de cerrar (×).
   - Si es PDF: `<iframe src={previewExpense.comprobante_archivo_url} className="w-full h-[75vh] border-0" />`.
   - Si es imagen: `<img src={previewExpense.comprobante_archivo_url} alt="Comprobante" className="max-h-[75vh] w-auto mx-auto object-contain p-4" />`.

5. Estética y Microinteracciones del Dropzone (`expense-form.tsx`):
   - Agregar estado `isDragging: boolean` para activar `border-[#3E2723] bg-amber-50/40` en `onDragEnter`/`onDragLeave`.
   - Reemplazar el `⌁` por un ícono SVG moderno de subida/recibo.
   - Cuando hay archivo o vista previa: mostrar miniatura con botón para quitar/reemplazar el archivo y badge de estado.
   