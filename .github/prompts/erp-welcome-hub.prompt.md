---
description: Diseñar la pantalla de bienvenida (Hub) del ERP y limpiar elementos obsoletos del layout/header
---
Trabajá únicamente sobre los archivos indicados con `#file:`.

Contexto y reglas de diseño:
1. Paleta y estilos corporativos:
   - Color primario/acento: Marrón corporativo `#3E2723` (hover `#2C1B17`).
   - Fondos: Blanco sobre fondo neutro claro del layout.
   - Tarjetas de módulos: Bordes suaves (`border border-neutral-200`), esquinas redondeadas (`rounded-xl`), sombra sutil y efecto hover claro (`hover:shadow-md hover:border-neutral-300 transition-all cursor-pointer`).

2. Limpieza del Navbar:
   - Localizar el selector/pill que dice "Proyecto Activo: ..." en el header/navbar compartido y eliminarlo por completo, preservando el estado de conexión ("Servidor sincronizado") y el badge de usuario.

3. Estructura de la pantalla de bienvenida (`app/(protected)/erp/page.tsx`):
   - Encabezado: Título principal en `text-2xl font-bold text-neutral-800` y bajada institucional descriptiva.
   - Grid de accesos principales (2 a 4 columnas responsivo: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`):
     * Obras y Proyectos (`/erp/obras`): Estados, presupuestos y seguimiento.
     * Inventario y Herramientas (`/erp/inventario`): Control de stock, galpones y transferencias.
     * Contabilidad y Caja (`/erp/contabilidad` o su subruta activa): Liquidaciones semanales, gastos y cheques.
     * Personal y Asistencia (`/erp/rrhh` o la ruta de personal configurada): Partes diarios y control horario.
   - Cada tarjeta debe incluir: ícono representativo, título claro, descripción en dos líneas y flecha o enlace directo.

Salida:
- Devolver únicamente el componente de la página de bienvenida y la sección editada del header.

