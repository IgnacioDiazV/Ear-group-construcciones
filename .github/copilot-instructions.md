# Directivas de Proyecto: EAR Group (Constructora)

## Stack Tecnológico y Convenciones
- Framework: Next.js (App Router), React, TypeScript.
- Estilos: Tailwind CSS puro (o CSS Modules según el archivo intervenido).
- Backend / Base de Datos: Supabase (Auth, Postgres, Server Actions).
- Localización y Moneda: es-AR (formato numérico/moneda: ARS `$1.000.000`, números de teléfono con código regional argentino `549381...`).

## Reglas Estrictas de Consumo y Rendimiento (Ahorro de Recursos)
1. **Respuestas Quirúrgicas**: Entregar únicamente la función, hook o bloque JSX modificado. Nunca reescribir un archivo completo a menos que sea una creación desde cero.
2. **Sin Explicaciones Extensas**: Omitir introducciones, resúmenes finales o explicaciones teóricas extensas. Ir directo al código o diff solicitado.
3. **Aislamiento de Contexto**: Trabajar estrictamente sobre los archivos referenciados explícitamente (`#file:`). No solicitar lecturas masivas del árbol de archivos ni activar `@workspace` innecesariamente.
4. **Sin Dependencias Innecesarias**: Priorizar soluciones nativas de Next.js, React y Tailwind CSS sin instalar paquetes adicionales.

## Criterios de Manejo de Datos (ERP y Base de Datos)
- **Normalización de Strings**: Sanitizar siempre los estados y métodos de pago con `.trim().toLowerCase()` antes de comparar (por ejemplo: `'cobrado'`, `'cheque'`).
- **Parseo Defensivo de Fechas**: Soportar de manera flexible tanto formato latino `DD/MM/YYYY` como ISO `YYYY-MM-DD` fijando la hora al mediodía local (12:00:00) para neutralizar desfases de zona horaria UTC.
- **Relaciones de Supabase**: Contemplar que las relaciones foráneas (como cheques o anticipos) pueden retornar tanto como array de un solo elemento `[ {...} ]` o como objeto directo `{...}` según la consulta.
- **Mensajería WhatsApp**: En los links salientes a `https://wa.me/`, sanitizar siempre el mensaje con `encodeURIComponent` y estructurar el texto con negritas y saltos de línea prolijos.