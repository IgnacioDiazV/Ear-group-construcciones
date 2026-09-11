---
description: Lógica de cobros, cartera de cheques y avisos de WhatsApp
---
Trabajá únicamente sobre el archivo indicado con `#file:`.
Requisitos:
- Si modificás filtros o cálculos de fechas, soportá tanto `DD/MM/YYYY` como `YYYY-MM-DD` fijando la hora a las 12:00:00 para evitar desfasajes UTC.
- Normalizá siempre los strings con `.toLowerCase().trim()` (ej. estado `'cobrado'`, método `'cheque'`).
- Para notificaciones de WhatsApp (`wa.me`), formateá los importes con `toLocaleString('es-AR')` y asegurá el uso de `encodeURIComponent`.
- Entregá únicamente la función modificada, no reimprimas la tabla entera.