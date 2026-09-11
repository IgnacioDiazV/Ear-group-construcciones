---
description: Permitir editar nombres de herramientas asignadas y mejorar el modal de importación de WhatsApp
---
Trabajá únicamente sobre los archivos indicados con `#file:`.
Archivos de referencia:
- app/(protected)/erp/inventario/inventory-table.tsx
- app/(protected)/erp/inventario/whatsapp-import-modal.tsx
- app/(protected)/erp/inventario/actions.ts

Requisitos:
1. Edición de asignación en `inventory-table.tsx`:
   - Agregar un botón "Editar" (o ícono de lápiz) en cada fila junto a las acciones.
   - Permitir editar el nombre/concepto (`descripcion_libre`), la cantidad y la obra asignada mediante un modal o inputs en línea.
2. Server Action de actualización en `actions.ts`:
   - Crear o actualizar la acción `editarAsignacionHerramienta(id, { descripcion_libre, cantidad, obra_id })`.
   - Ejecutar el UPDATE en `asignacion_herramientas` y llamar a `revalidatePath('/erp/inventario')`.
3. Mejorar `whatsapp-import-modal.tsx`:
   - Mostrar una lista previa (preview) editable de los ítems detectados por `parser.ts` antes de confirmar el guardado masivo, para corregir errores tipográficos en el momento.
- Devolver únicamente las funciones o componentes modificados sin código redundante.