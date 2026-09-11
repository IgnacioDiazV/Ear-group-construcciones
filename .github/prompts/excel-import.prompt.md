---
description: Importación masiva de liquidaciones desde Excel con SheetJS y asignación de obra
---
Trabajá únicamente sobre los archivos indicados con `#file:`.
Archivos de referencia:
- Formulario: app/(protected)/erp/contabilidad/liquidaciones/liquidacion-form.tsx
- Servidor: app/(protected)/erp/contabilidad/liquidaciones/actions.ts
- Tabla: app/(protected)/erp/contabilidad/liquidaciones/liquidaciones-table.tsx

Requisitos:
1. Lectura automática:
   - Al soltar o seleccionar un archivo (.xlsx, .xls, .csv), parsearlo en el cliente con SheetJS (`xlsx`).
   - Sumar los valores de la columna de montos y autocompletar el campo "Monto total liquidado ($)".
2. Gestión de obra:
   - Si no se selecciona una obra específica, permitir guardarla como "Planilla General (Multi-obra)" en lugar de enviar un valor nulo roto (`Obra #null`).
3. Persistencia en Supabase:
   - En la Server Action (`actions.ts`), registrar la cabecera de la liquidación y guardar el detalle de las filas para su posterior imputación por obra.
4. Salida:
   - Entregar únicamente las funciones o bloques JSX modificados, sin explicaciones extensas.