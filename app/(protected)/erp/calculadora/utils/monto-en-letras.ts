/**
 * Formatear número como ARS (pesos argentinos)
 * Ej: 1000.50 → "$ 1.000,50"
 */
export const formatARS = (n: number): string =>
  "$ " +
  (Number.isFinite(n) ? n : 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Tablas de conversión para números a palabras (español argentino)
 */
const UNIDADES = [
  "",
  "uno",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
  "once",
  "doce",
  "trece",
  "catorce",
  "quince",
  "dieciséis",
  "diecisiete",
  "dieciocho",
  "diecinueve",
  "veinte",
];

const DECENAS = [
  "",
  "",
  "veinte",
  "treinta",
  "cuarenta",
  "cincuenta",
  "sesenta",
  "setenta",
  "ochenta",
  "noventa",
];

const CENTENAS = [
  "",
  "ciento",
  "doscientos",
  "trescientos",
  "cuatrocientos",
  "quinientos",
  "seiscientos",
  "setecientos",
  "ochocientos",
  "novecientos",
];

/**
 * Convertir un grupo de 3 dígitos a palabras
 */
function convertirGrupo(n: number, apocope: boolean): string {
  if (n === 0) return "";
  if (n === 100) return "cien";
  let str = "";
  const c = Math.floor(n / 100);
  const resto = n % 100;

  if (c > 0) str += CENTENAS[c] + " ";

  if (resto > 0) {
    if (resto <= 20) {
      str += resto === 1 && apocope ? "un" : UNIDADES[resto];
    } else {
      const d = Math.floor(resto / 10);
      const u = resto % 10;
      if (d === 2 && u > 0) {
        str += "veinti" + (u === 1 ? (apocope ? "ún" : "uno") : UNIDADES[u]);
      } else {
        str += DECENAS[d];
        if (u > 0) str += " y " + (u === 1 && apocope ? "un" : UNIDADES[u]);
      }
    }
  }

  return str.trim();
}

/**
 * Convertir número entero a letras (ej: 1234567 → "Un millón doscientos treinta y cuatro mil quinientos sesenta y siete")
 */
function enteroALetras(numOriginal: number): string {
  const num = Math.floor(Math.abs(numOriginal));
  if (num === 0) return "cero";

  let str = "";
  const millones = Math.floor(num / 1000000);
  const miles = Math.floor((num % 1000000) / 1000);
  const resto = num % 1000;

  if (millones > 0) {
    str += millones === 1
      ? "un millón "
      : convertirGrupo(millones, true) + " millones ";
  }

  if (miles > 0) {
    str += miles === 1 ? "mil " : convertirGrupo(miles, true) + " mil ";
  }

  if (resto > 0) {
    str += convertirGrupo(resto, true);
  }

  return str.trim();
}

/**
 * Convertir a Title Case preservando "y"
 */
function toTitleCase(str: string): string {
  return str
    .split(" ")
    .map((w) => (w === "y" ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/**
 * Convertir monto a letras para cheques/documentos
 * Ej: 1234.56 → "Pesos Mil Doscientos Treinta Y Cuatro con 56/100"
 */
export function montoEnLetras(num: number): string {
  const entero = Math.floor(Math.max(num, 0));
  const centavos = Math.round((Math.max(num, 0) - entero) * 100);
  const letras = toTitleCase(enteroALetras(entero));
  const centavosStr = String(centavos).padStart(2, "0");
  return `Pesos ${letras} con ${centavosStr}/100`;
}

/**
 * Parsear valor seguro a número
 */
export const num = (v: string | number): number => {
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};
