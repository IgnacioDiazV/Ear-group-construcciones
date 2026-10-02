---
description: Implementación y mantenimiento de la bitácora de actividad y movimientos semanales en el detalle de obra.
globs: app/(protected)/erp/obras/**, lib/formatters.ts
---

# Obra Bitácora & Actividad Semanal

## Contexto & Origen de Datos
- **Vista SQL en Supabase:** `vista_actividad_obra`
  - Columnas: `tipo_evento` ('gasto' | 'herramienta' | 'stock'), `referencia_id`, `obra_id`, `fecha`, `mes_anio`, `semana_mes`, `detalle`, `monto`, `url_archivo`.
- **Relaciones incluidas:**
  - `gastos_obra`: Comprobantes y egresos imputados.
  - `asignacion_herramientas`: Entregas/asignaciones de herramientas y maquinarias.
  - `movimientos_stock`: Consumos y traslados de materiales en la obra.

## Reglas de Implementación en UI (`operational-sections.tsx`)
1. **Filtros Temporales:**
   - Desplegable de Meses (`<select>`): Formato legible "Mes YYYY", por defecto el mes más reciente disponible.
   - Pestañas/Píldoras de Semanas: Alternar entre "Todas", "Semana 1", "Semana 2", "Semana 3", "Semana 4", "Semana 5".
   - Estado activo en píldora: Fondo `#3E2723` (chocolate corporativo) y texto blanco.

2. **Indicadores & Formateo:**
   - Badge financiero: Suma únicamente los ítems con `tipo_evento === 'gasto'` correspondientes a la semana o mes seleccionado ("Total gastos: $X").
   - Manejo de Fechas: Usar `formatDate(evento.fecha)` de `lib/formatters.ts`.
   - Visualización de Comprobante: Si `url_archivo` existe, incluir botón compacto de vista previa (ojo) abriendo en pestaña nueva (`target="_blank"`).

3. **Iconografía de Eventos:**
   - `gasto`: Ícono SVG de comprobante/factura.
   - `herramienta`: Ícono SVG de herramienta (llave/martillo).
   - `stock`: Ícono SVG de caja/paquete de materiales.

4. **Estilos:**
   - Consistencia con `obra-detalle.module.css` y las tarjetas de comprobantes de contabilidad.