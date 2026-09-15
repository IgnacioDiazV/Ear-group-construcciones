---
description: Optimizar la experiencia de carga de comprobantes, gastos y formularios contables con persistencia de contexto
---
Trabajá únicamente sobre los archivos indicados con `#file:`.

Reglas para formularios de contabilidad y carga continua:
1. Persistencia de contexto en carga masiva/consecutiva:
   - Al completar un guardado exitoso (`success`), **NO resetear la Obra seleccionada (`obra_id`)**.
   - Mantener también la **Fecha** para evitar reingresos repetitivos.
   - Limpiar únicamente los campos variables del comprobante:
     * Proveedor / Emisor
     * Rubro / Categoría
     * Descripción / Concepto
     * Importe
     * Archivo / vista previa adjunta (dropzone o input file)

2. Estado y UX:
   - Mostrar feedback de éxito temporal o toast sin bloquear nuevos envíos.
   - Restablecer el estado de carga (`isPending` / `submitting`) para permitir la siguiente carga de inmediato.
   - Dejar el foco listo para el siguiente campo (idealmente en Proveedor o en la zona de drop de archivo).

3. Integridad:
   - No alterar las Server Actions existentes ni las llamadas a Supabase.
   - Respetar la validación de tipos y los estilos Tailwind existentes (`#3E2723`).

Salida:
- Devolver el archivo del componente modificado conservando su estructura intacta.