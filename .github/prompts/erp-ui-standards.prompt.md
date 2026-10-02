---
description: Reglas y estándares de diseño visual corporativo para módulos del ERP (paleta, tablas, feeds y controles).
globs: app/(protected)/**/*.tsx, **/*.module.css
---

# ERP UI & Design System Standards

## Paleta y Tokens
- **Color Principal / Acento:** Chocolate corporativo `#3E2723` (fondos activos, botones primarios).
- **Fondos y Contenedores:** Fondo blanco `#ffffff` para tarjetas, fondo tenue `#fcfbfa` / `neutral-50` para toolbars y headers.
- **Bordes:** `border-neutral-200` o `border-neutral-200/80` (bordes finos y discretos).
- **Tipografía:** Textos principales en `neutral-800` (font-semibold/medium), textos secundarios en `neutral-500` (text-sm/xs).

## Componentes Frecuentes
1. **Toolbars & Filtros:**
   - Agrupación horizontal (`flex items-center justify-between`) con fondo tenue y padding suave.
   - Segmented Controls para tabs/semanas: contenedor redondeado en gris tenue con botones compactos. El seleccionado lleva `#3E2723`, texto blanco y sombra leve.
   - Selects integrados con formato de fecha legible en español (ej. "Octubre 2026", nunca claves crudas como "2026-10").

2. **Feeds, Timelines y Listas:**
   - Ítems contenidos en tarjetas de fila con padding uniforme (12px 16px) y `hover:bg-neutral-50/50`.
   - Badges temáticos:
     * Financiero / Comprobante: Verde esmeralda o neutro oscuro (`bg-emerald-50 text-emerald-700`).
     * Herramientas / Equipos: Ámbar / Ocre (`bg-amber-50 text-amber-800`).
     * Materiales / Stock: Pizarra / Azul neutro (`bg-sky-50 text-sky-800`).
   - Botones de acción compactos (32x32px cuadrados o con bordes suaves) para previsualizaciones (ojo) o descargas.

3. **Empty States:**
   - Borde discontinuo suave (`border-dashed border-neutral-300`), icono sutil y mensaje claro en `neutral-500`.
   