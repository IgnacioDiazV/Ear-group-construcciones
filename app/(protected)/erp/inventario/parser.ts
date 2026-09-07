export type HerramientaItem = { cantidad: number; nombre: string };

export function parsearMensajeWhatsApp(texto: string): HerramientaItem[] {
  return texto
    .split(/\r?\n/)
    .map((linea) => linea.trim().replace(/^[-*•]\s*/, ""))
    .filter(Boolean)
    .map((linea) => {
      const cantidadMatch = linea.match(/^(\d+)\s*(?:x|unidades?|uds?\.?|unid\.?)?\s*[-:]?\s*(.+)$/i);
      if (cantidadMatch) return { cantidad: Number(cantidadMatch[1]), nombre: cantidadMatch[2].trim() };
      const unidadMatch = linea.match(/^un(?:a|o)?\s+(.+)$/i);
      return { cantidad: 1, nombre: (unidadMatch?.[1] ?? linea).trim() };
    })
    .filter((item) => item.nombre.length > 0 && item.cantidad > 0);
}
