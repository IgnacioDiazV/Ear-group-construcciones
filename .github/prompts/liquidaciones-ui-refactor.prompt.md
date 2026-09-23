---
name: liquidaciones-ui-refactor
description: Refactorizar la UI del formulario de carga de planillas semanales/liquidaciones para que replique el diseño split en 2 columnas de la sección de comprobantes.
---

# Rol y Objetivo
Actuá como un desarrollador Frontend experto en Next.js (App Router), TypeScript y Tailwind CSS. Tu objetivo es refactorizar el componente del formulario de la pestaña "Liquidaciones y jornales" (`/erp/contabilidad?tab=liquidaciones`) para que adopte una disposición de 2 columnas consistente con la pestaña "Comprobantes y gastos".

# Contexto y Referencias
- La sección actual de "Comprobantes y gastos" utiliza un grid dividido en dos columnas (`lg:grid-cols-2`):
  - **Columna izquierda:** Encabezado con ícono descriptivo ("Carga inteligente" / carga de archivos) y una dropzone con borde punteado (`border-dashed border-2`) de altura completa para arrastrar o examinar archivos.
  - **Columna derecha:** Encabezado con ícono ("Confirmar imputación") y los campos del formulario apilados verticalmente con botón de acción primario al fondo a ancho completo (`bg-[#2B1810]` / marrón institucional).
- Actualmente, la pestaña "Liquidaciones y jornales" tiene los campos de texto arriba y la dropzone debajo ocupando todo el ancho. Debe alinearse visualmente a la pestaña de comprobantes.

# Requisitos de Implementación

1. **Estructura visual (Grid 2 Columnas):**
   - Contenedor principal con tarjeta blanca: `rounded-xl border border-stone-200 bg-white p-6 shadow-sm`.
   - Layout interior: `grid grid-cols-1 gap-8 lg:grid-cols-2`.

2. **Columna Izquierda (Dropzone Planilla):**
   - Header con ícono (`h-9 w-9 border border-stone-200 bg-stone-50 text-stone-700 rounded-lg`), título: **"Cargar planilla semanal"** y subtítulo en `text-xs text-stone-500`: *"Subí el archivo Excel o CSV de jornales para procesar la liquidación."*.
   - Área drag & drop flexible (`flex-1 min-h-[220px] rounded-xl border-2 border-dashed border-stone-200 bg-stone-50/50 hover:bg-stone-50`).
   - Mantener el input de archivo (`type="file" name="archivo_planilla" accept=".xlsx, .xls, .csv"`).
   - Badge inferior con texto `.XLSX, .XLS o .CSV`.

3. **Columna Derecha (Confirmar Datos e Imputación):**
   - Header con ícono de check, título: **"Confirmar liquidación"** y subtítulo: *"Revisá la imputación de obra y montos antes de registrar."*.
   - Campos del formulario preservando nombres y handlers existentes:
     - `obra_id`: Selector de obra (opción por defecto "Planilla General (Multi-Obra)").
     - Fila doble (grid de 2 cols en `sm`): `semana_etiqueta` (Semana / Período) y `fecha_pago` (Input tipo date).
     - `total_pagado` o `monto`: Monto total liquidado ($).
   - Botón de guardado a ancho completo con estilo institucional (`w-full rounded-md bg-[#2B1810] py-2.5 text-sm font-semibold text-white hover:bg-[#3D2318]`).

4. **Reglas de Integridad:**
   - NO alteres la lógica de las Server Actions ni los nombres de los atributos `name` de los inputs/selects para no romper la recepción en el backend.
   - Conservá el estado de carga (`pending` / `useTransition` / `useFormStatus`) si el botón ya lo implementaba.
   - Mantené los componentes existentes de selección y listado histórico que se encuentren debajo del formulario.