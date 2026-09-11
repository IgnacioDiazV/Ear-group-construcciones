---
description: Crear o editar modales y componentes UI respetando el Design System del ERP y el esquema real
---
Trabajá únicamente sobre los archivos indicados con `#file:`.
Archivos de referencia de diseño:
- Modal de referencia: app/(protected)/erp/inventario/whatsapp-import-modal.tsx

Reglas de negocio y base de datos:
1. Sucursales, depósitos y obradores:
   - NO inventar ni consultar tablas externas de depósitos o almacenes.
   - Cualquier ubicación física (obras, depósitos, galpones como 'Deposito Larrea' u oficinas) es un registro de la tabla `public.obras` (`obras.id` y `obras.nombre`).
2. Persistencia en inventario:
   - Modificar únicamente `public.asignacion_herramientas` (`descripcion_libre`, `cantidad`, `obra_id`).

Reglas de UI y Design System:
1. Contenedor y fondo:
   - Backdrop oscuro: `fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4`
   - Tarjeta: `bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150`
2. Tipografía y etiquetas:
   - Subtítulo superior: `text-xs font-bold uppercase tracking-wider text-[#8D6E63]`
   - Título: `text-xl font-bold text-neutral-800`
   - Labels de campos: `block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1`
3. Controles (Inputs y Selects):
   - `w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#3E2723]`
4. Botonera inferior:
   - Contenedor: `flex justify-end gap-3 pt-2`
   - Botón secundario/cancelar: `border border-neutral-300 text-neutral-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-50 transition`
   - Botón primario/confirmar: `bg-[#3E2723] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2C1B17] transition disabled:opacity-50`

Salida:
- Devolver únicamente los bloques JSX o componentes de modal corregidos.