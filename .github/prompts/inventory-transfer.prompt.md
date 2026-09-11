---
description: Implementar traslados de herramientas entre obras/galpón y visualización de stock
---
Trabajá únicamente sobre los archivos indicados con `#file:`.
Archivos de referencia:
- app/(protected)/erp/inventario/page.tsx
- app/(protected)/erp/inventario/inventory-table.tsx
- app/(protected)/erp/inventario/actions.ts

Requisitos:
1. En inventory-table.tsx:
   - Agregar una acción "Transferir" al lado de "Marcar Devuelto".
   - Abrir un modal que permita elegir una obra destino o el depósito central (Galpón).
2. En actions.ts:
   - Crear la Server Action `transferirHerramienta(asignacionId, destinoObraId, depositoDestinoId)`.
   - Si se transfiere a otra obra: actualizar `obra_id` en `asignacion_herramientas` y registrar la trazabilidad en `movimientos_stock` con tipo `traslado_obra`.
   - Si se devuelve al galpón: marcar la asignación como devuelta (`cantidad_devuelta = cantidad`) e incrementar el stock correspondiente en `stock_por_deposito`.
   - Aplicar `revalidatePath('/erp/inventario')`.
- Devolver únicamente las funciones o componentes modificados, sin explicaciones extensas.