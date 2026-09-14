---
description: Rediseñar la tabla de inventario con filtros de categoría, buscador en vivo y botones de acción compactos con íconos
---
Trabajá únicamente sobre los archivos indicados con `#file:`.
Archivos principales:
- app/(protected)/erp/inventario/inventory-table.tsx
- app/(protected)/erp/inventario/page.tsx

Reglas de UI y mejoras funcionales:
1. Barra de herramientas superior (Toolbar):
   - Buscador en tiempo real: input con ícono de lupa para buscar por nombre de herramienta/material o por obra.
   - Pestañas / Filtro de tipo: botones tipo tab ("Todos", "Herramientas", "Materiales/Insumos") con conteo badge numérico.
   - Mantener el selector existente de "Filtrar por obra".

2. Acciones compactas por fila (Reemplazar botones de texto):
   - Contenedor: `flex items-center gap-1 justify-end`.
   - Botones cuadrados compactos (`p-2 rounded-lg border text-sm transition hover:scale-105`):
     * Marcar devuelto: ícono de tilde/check verde (`✓` o CheckIcon de lucide-react) con tooltip "Marcar Devuelto".
     * Transferir: ícono de flechas de intercambio (`⇄` / `⭾` o ArrowLeftRight) con tooltip "Transferir".
     * Editar: ícono de lápiz (`✎` o Pencil) con tooltip "Editar".

3. Clasificación de herramientas vs. materiales:
   - Si el registro proviene de `articulos`, usar su campo `tipo`.
   - Si es texto libre (`descripcion_libre`), clasificar por palabras clave comunes o agregar un selector rápido de categoría al editar.
   - Chips visuales en la tabla: badge suave (ej. gris/azul claro para herramientas, marrón claro/ámbar para materiales).

Salida:
- Devolver únicamente el componente `inventory-table.tsx` actualizado y adaptaciones necesarias en `page.tsx`.