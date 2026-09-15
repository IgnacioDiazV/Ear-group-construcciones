---
description: Gestión de cobros, cuotas y cheques: edición completa y eliminación con integridad referencial
---
Trabajá sobre los archivos indicados con `#file:`.

Reglas de negocio y base de datos:
1. Eliminación de Cobro/Anticipo (`actions.ts`):
   - Crear Server Action `eliminarCobro(anticipoId: number)`.
   - Primero eliminar los cheques vinculados en `public.cheques` donde `anticipo_id = anticipoId`.
   - Luego eliminar el registro en `public.anticipos_clientes` con `id = anticipoId`.
   - Revalidar `/erp/contabilidad/cobros` y la vista de obras (`/erp/obras`).

2. Edición de Cobro (`actions.ts`):
   - Crear Server Action `actualizarCobro(_prevState, formData)`.
   - Permitir modificar: `obra_id`, `descripcion`, `monto`, `numero_cuota`, `total_cuotas`, `fecha_estimada_cobro`, `estado` ('pendiente' | 'cobrado').
   - Si tiene cheque vinculado (`cheque_id`), actualizar también los datos del cheque (`banco`, `numero_cheque`, `fecha_pago_diferido`, `monto`).
   - Revalidar rutas pertinentes.

3. Interfaz de Tabla (`cobros-table.tsx`):
   - En la columna `ACCIÓN`, al lado del botón "Marcar cobrado" o texto "Completo", agregar:
     * Botón de edición (ícono lápiz ✎).
     * Botón de eliminación (ícono cruz ✕ o papelera) con confirmación previa (`window.confirm`).
   - Modal de Edición: al tocar editar, abrir un modal limpio para ajustar los valores cargados y guardar cambios.
   - Mantener la paleta institucional (#3E2723) y el diseño consistente con el módulo de comprobantes.