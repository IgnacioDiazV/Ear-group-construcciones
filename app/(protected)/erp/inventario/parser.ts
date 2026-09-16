export type HerramientaItem = { cantidad: number; nombre: string; tipo: "herramienta" | "material" };

const PALABRAS_CLAVE_MATERIAL = [
  "bolsa",
  "bolsas",
  "cemento",
  "arena",
  "cal",
  "plasticor",
  "hierro",
  "vigueta",
  "ladrillo",
  "caño",
  "malla",
  "alambre",
  "clavo",
  "tornillo",
  "pegamento",
  "klaukol",
  "pintura",
  "goma",
  "gomas",
  "tubo",
  "tubos",
  "chapa",
  "chapas",
  "bloque",
  "bloques",
  "tejas",
  "teja",
  "cerámico",
  "cerámicos",
  "granito",
  "mármol",
  "vidrio",
  "madera",
  "tablón",
  "tablones",
  "mica",
  "durlock",
  "escuadra",
  "escuadras",
  "perfil",
  "perfiles",
  "varilla",
  "varillas",
  "acero",
  "hormigón",
  "mortero",
];

export function inferItemType(nombre: string): "herramienta" | "material" {
  const nombreLower = nombre.toLowerCase();
  const tieneKeywordMaterial = PALABRAS_CLAVE_MATERIAL.some((keyword) =>
    nombreLower.includes(keyword)
  );
  return tieneKeywordMaterial ? "material" : "herramienta";
}

export function parsearMensajeWhatsApp(texto: string): HerramientaItem[] {
  return texto
    .split(/\r?\n/)
    .map((linea) => linea.trim().replace(/^[-*•]\s*/, ""))
    .filter(Boolean)
    .map((linea) => {
      const cantidadMatch = linea.match(/^(\d+)\s*(?:x|unidades?|uds?\.?|unid\.?)?\s*[-:]?\s*(.+)$/i);
      if (cantidadMatch) {
        const nombre = cantidadMatch[2].trim();
        return { cantidad: Number(cantidadMatch[1]), nombre, tipo: inferItemType(nombre) };
      }
      const unidadMatch = linea.match(/^un(?:a|o)?\s+(.+)$/i);
      const nombre = (unidadMatch?.[1] ?? linea).trim();
      return { cantidad: 1, nombre, tipo: inferItemType(nombre) };
    })
    .filter((item) => item.nombre.length > 0 && item.cantidad > 0);
}
