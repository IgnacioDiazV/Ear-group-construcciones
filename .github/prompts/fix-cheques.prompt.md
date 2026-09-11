---
description: Corregir consulta de base de datos y filtros para que los cheques aparezcan en la tabla
---
Trabajá únicamente sobre los archivos indicados con `#file:`.
Requisitos:
1. En la consulta Supabase (`page.tsx`):
   - Incluir la relación foránea a cheques: `*, cheques (*), obras (nombre)`.
   - Aplanar los campos antes de pasarlos al componente para que la tabla reciba `cheque_numero`, `cheque_banco` y `cheque_fecha` en el primer nivel del objeto.
2. En la tabla (`cobros-table.tsx`):
   - Normalizar la detección: considerar cheque si `metodo_pago.toLowerCase().includes('cheque')` o si existe `cheque_numero` o `cheque_id`.
   - Parsear fechas soportando tanto `DD/MM/YYYY` como `YYYY-MM-DD` fijando la hora a las 12:00:00 para evitar desfasajes UTC.
   - Normalizar estados con `.toLowerCase().trim() !== 'cobrado'`.
- Devolver únicamente las funciones o consultas corregidas, sin reimprimir archivos completos.