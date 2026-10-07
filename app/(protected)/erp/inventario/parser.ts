export type HerramientaItem = { cantidad: number; nombre: string; tipo: "herramienta" | "material" };

export function getLocalDateString(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

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
