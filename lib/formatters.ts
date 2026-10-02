export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "Sin fecha";

  let parsedDate: Date;

  if (date instanceof Date) {
    parsedDate = date;
  } else if (typeof date === "string") {
    const trimmed = date.trim();
    // Si viene solo la fecha 'YYYY-MM-DD', le agregamos la hora local para evitar desfasaje de zona horaria
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      parsedDate = new Date(`${trimmed}T00:00:00`);
    } else {
      // Si ya viene con hora o formato ISO (ej. timestamptz de Supabase como "2026-09-24T15:30:00Z")
      parsedDate = new Date(trimmed);
    }
  } else {
    return "Sin fecha";
  }

  if (isNaN(parsedDate.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

export function formatCurrency(value: number | null, currency = "ARS") {
  if (value === null) return "Sin importe";

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}