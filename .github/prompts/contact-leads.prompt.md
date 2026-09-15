---
description: Implementar la captura y persistencia de leads de contacto en la web comercial conectando con Supabase
---
Trabajá únicamente sobre los archivos indicados con `#file:`.

Esquema de Base de Datos objetivo:
- Tabla: `public.contactos_leads_web`
- Columnas:
  * `nombre` (varchar, NOT NULL)
  * `email` (varchar, NOT NULL)
  * `telefono` (varchar, nullable)
  * `tipo_proyecto_interes` (varchar, nullable)
  * `mensaje` (text, nullable)
  * `estado` ('nuevo' por defecto)

Reglas de negocio y ejecución:
1. Server Action / API:
   - Validar obligatoriedad de `nombre` y `email`.
   - Limpiar espacios en blanco (`trim()`).
   - Usar el cliente de Supabase configurado en el proyecto para llamadas públicas/server.
   - Devolver un objeto estructurado: `{ success: boolean, error?: string }`.

2. Interfaz y UX:
   - NO alterar el diseño actual de los inputs, labels ni colores corporativos (botón `#3E2723`).
   - Añadir manejo de estado reactivo:
     * Estado de carga: deshabilitar el botón y mostrar "Enviando...".
     * Estado de error: mensaje sutil en rojo claro sin romper el layout.
     * Estado de éxito: reemplazar el formulario o mostrar una tarjeta limpia de confirmación agradeciendo el contacto.

Salida:
- Devolver únicamente la Server Action y el componente de formulario actualizado.
