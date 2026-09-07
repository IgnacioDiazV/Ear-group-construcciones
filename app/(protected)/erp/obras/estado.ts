export const OBRA_ESTADOS = [
  "presupuesto",
  "en_ejecucion",
  "finalizada",
  "cancelada",
] as const;

export type ObraEstado = (typeof OBRA_ESTADOS)[number];

export function normalizeObraEstado(value: string | null | undefined): ObraEstado {
  switch (value?.trim().toLowerCase()) {
    case "en_ejecucion":
    case "ejecucion":
    case "en ejecución":
      return "en_ejecucion";
    case "finalizada":
      return "finalizada";
    case "cancelada":
      return "cancelada";
    default:
      return "presupuesto";
  }
}

export function obraEstadoLabel(value: string | null | undefined) {
  switch (normalizeObraEstado(value)) {
    case "en_ejecucion":
      return "En ejecución";
    case "finalizada":
      return "Finalizada";
    case "cancelada":
      return "Cancelada";
    default:
      return "Presupuesto";
  }
}
