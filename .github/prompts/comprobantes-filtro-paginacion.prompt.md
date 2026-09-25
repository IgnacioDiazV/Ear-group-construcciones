---
name: comprobantes-filtro-paginacion
description: Agregar filtros por rango de fechas (desde/hasta) y paginación a 20 registros por página en la tabla de comprobantes y gastos.
---

# Rol y Objetivo
Actuá como un desarrollador Frontend experto en React, Next.js y Tailwind CSS. Tu objetivo es refactorizar la vista o componente de la tabla de comprobantes y gastos para incorporar:
1. Filtros por rango de fechas ("Desde" y "Hasta").
2. Paginación en cliente limitada a 20 registros por página con controles de navegación.

# Requisitos de Implementación

1. **Estados del Cliente (`useState`):**
   - Incorporar `fechaDesde` (`string`, formato `YYYY-MM-DD`, inicial `""`).
   - Incorporar `fechaHasta` (`string`, formato `YYYY-MM-DD`, inicial `""`).
   - Incorporar `paginaActual` (`number`, inicial `1`).
   - Definir constante de paginado: `const ELEMENTOS_POR_PAGINA = 20;`.
   - Cada vez que cambie `busqueda`, `obraSeleccionada`, `fechaDesde` o `fechaHasta`, reiniciar `paginaActual` a `1`.

2. **Lógica de Filtrado y Paginación:**
   - En la función de filtrado existente, agregar la condición de fechas sobre el campo `fecha` del comprobante (`item.fecha.slice(0, 10)`):
     - Si `fechaDesde` tiene valor, verificar `itemFecha >= fechaDesde`.
     - Si `fechaHasta` tiene valor, verificar `itemFecha <= fechaHasta`.
   - Calcular `totalPaginas`: `Math.ceil(itemsFiltrados.length / ELEMENTOS_POR_PAGINA) || 1`.
   - Obtener los items a renderizar usando slice: `itemsFiltrados.slice((paginaActual - 1) * ELEMENTOS_POR_PAGINA, paginaActual * ELEMENTOS_POR_PAGINA)`.

3. **Barra de Controles Superior:**
   - Organizar en un grid responsivo (`grid grid-cols-1 md:grid-cols-12 gap-3 md:items-end mb-4`):
     - **Buscador (4 cols):** Campo de texto existente para descripción, rubro, obra o importe.
     - **Fecha Desde (2 cols):** `<input type="date">` con etiqueta "Desde".
     - **Fecha Hasta (2 cols):** `<input type="date">` con etiqueta "Hasta".
     - **Filtro Obra (4 cols):** `<select>` existente de obras con etiqueta "Filtrar por obra".
   - Aplicar estilos de inputs coherentes con el ERP: `border border-stone-200 bg-white rounded-md px-3 py-2 text-sm text-stone-800 focus:border-stone-400 focus:outline-none`.

4. **Pie de Tabla con Paginador:**
   - Justo debajo de la tabla, agregar un contenedor flexible: `flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-200 px-4 py-3`.
   - **Indicador a la izquierda:** Texto `text-xs text-stone-500` indicando: `"Mostrando X a Y de Z comprobantes"`.
   - **Controles a la derecha:** 
     - Botón "Anterior" (`disabled={paginaActual === 1}`).
     - Texto `Página ${paginaActual} de ${totalPaginas}` (`text-xs font-medium text-stone-700`).
     - Botón "Siguiente" (`disabled={paginaActual === totalPaginas || totalPaginas === 0}`).
     - Estilo de botones: `rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed`.

5. **Reglas de Preservación:**
   - Mantener todas las acciones por fila (ver comprobante, descargar, editar, eliminar)[cite: 7].
   - No romper las llamadas al backend ni las Server Actions.