---
description: Corrección quirúrgica de bugs de consola o lógica sin gastar tokens extra
---
Trabajá únicamente sobre el archivo indicado con `#file:`.
Requisitos:
- No indexar el workspace ni escanear carpetas no solicitadas.
- Analizar el error específico provisto en el prompt.
- Devolver únicamente la función, hook o línea exacta corregida (el diff).
- No reescribir el resto del archivo ni incluir explicaciones teóricas.