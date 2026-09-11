---
description: Crear o modificar Server Actions seguras con conexión a Supabase
---
Trabajá únicamente sobre el archivo de acciones indicado con `#file:actions.ts`.
Requisitos:
- Incluir la directiva `'use server'` al inicio de la función o archivo.
- Tipar estrictamente los parámetros de entrada y normalizar strings con `.trim().toLowerCase()` donde aplique.
- Retornar siempre un objeto de respuesta uniforme: `{ success: boolean, error?: string, data?: any }`.
- Si la acción muta datos (insert, update, delete), ejecutar `revalidatePath(...)` en la ruta correspondiente.
- Devolver únicamente la función de la Server Action solicitada.
