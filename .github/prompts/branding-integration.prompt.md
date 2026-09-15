---
description: Integrar la identidad visual y logo corporativo en el Login, Hub de bienvenida y Footer
---
Trabajá únicamente sobre los archivos indicados con `#file:`.

Reglas de branding e interfaz:
1. Activo del logo:
   - Ruta: `/logo-ear.png` (ubicado en `public/`).
   - Usar `<img src="/logo-ear.png" alt="EAR Group" ... />` o `<Image src="/logo-ear.png" ... />` con `priority` si está above-the-fold.
   - Mantener siempre la relación de aspecto (`object-contain`).

2. Integración en el Login (`app/(auth)/login/page.tsx`):
   - Ubicar el logo centrado en la parte superior de la tarjeta o contenedor de login.
   - Tamaño recomendado: `h-14 w-auto mx-auto mb-4`.
   - Debajo del logo: Título institucional sutil ("EAR GROUP" o "Acceso al Sistema ERP").
   - Respetar toda la lógica existente de autenticación y manejo de errores.

3. Integración en el Hub / Bienvenida (`app/(protected)/erp/page.tsx`):
   - En la cabecera principal de bienvenida, acompañar el saludo/título con el isotipo (`h-12 w-auto`).
   - Mantener alineación horizontal armoniosa con el texto descriptivo del ERP.
   - No alterar el grid de accesos a los módulos.

4. Integración en el Footer de la web pública (ej: `components/footer.tsx` o `app/(public)/layout.tsx`):
   - En la columna o sección principal de marca del footer, colocar el isotipo junto al texto "EAR GROUP CONSTRUCCIONES".
   - Tamaño recomendado: `h-10 w-auto`.
   - Asegurar contraste adecuado según el color de fondo del footer (blanco o neutro oscuro).

Salida:
- Devolver únicamente los archivos editados conservando su lógica previa intacta.