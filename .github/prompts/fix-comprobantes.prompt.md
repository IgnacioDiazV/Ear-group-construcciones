---
description: Solucionar errores en comprobantes, Groq IA, drag-and-drop y borrado de registros sin archivo
---
Trabajá únicamente sobre los archivos indicados con `#file:`.
Requisitos:
1. Error de IA (Groq):
   - Reemplazar el modelo `llama-3.2-90b-vision-preview` por `llama-3.2-11b-vision-preview` (o silenciarlo y ocultar la alerta roja).
2. Mensaje de confirmación:
   - Hacer que el cartel de éxito desaparezca tras 2.5 segundos con `setTimeout` o eliminar la alerta fija.
3. Drag & Drop:
   - Capturar el archivo en `onDrop` mediante `e.dataTransfer.files[0]`.
   - Impedir que se cree el gasto si no se completó la subida o si el archivo no está asignado.
4. Borrado permisivo (Eliminar registros huérfanos / "Sin archivo"):
   - En la Server Action de eliminar (`actions.ts`): ejecutar siempre el `DELETE` en la tabla de la base de datos, incluso si `comprobante_url` o el path del archivo es `null`, vacío o indefinido. No detener la ejecución si no hay archivo físico que borrar de Supabase Storage.
   - En la tabla (`expense-table.tsx`): asegurar que el botón de la cruz (`×`) esté siempre habilitado y llame a la acción de borrado pasando el `id` del gasto, tenga o no comprobante adjunto.
- Devolver únicamente las funciones o bloques corregidos.