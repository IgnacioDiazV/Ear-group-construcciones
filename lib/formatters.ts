export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "Sin fecha";

  let parsedDate: Date;

  if (date instanceof Date) {
    parsedDate = date;
  } else if (typeof date === "string") {
    const trimmed = date.trim();
    const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    const latinDate = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);

    if (isoDate) {
      parsedDate = new Date(
        Number(isoDate[1]),
        Number(isoDate[2]) - 1,
        Number(isoDate[3]),
        12,
        0,
        0,
      );
    } else if (latinDate) {
      parsedDate = new Date(
        Number(latinDate[3]),
        Number(latinDate[2]) - 1,
        Number(latinDate[1]),
        12,
        0,
        0,
      );
    } else {
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

export function formatPhoneNumber(value: string | null | undefined): string {
  const digits = value?.replace(/\D/g, "") ?? "";
  if (!digits) return "";

  const hasCountryCode = digits.startsWith("54");
  const countryNumber = hasCountryCode ? digits.slice(2) : digits;
  const hasMobilePrefix = countryNumber.startsWith("9");
  const nationalNumber = hasMobilePrefix ? countryNumber.slice(1) : countryNumber;
  const areaCodeLength = nationalNumber.startsWith("11") ? 2 : nationalNumber.length === 10 ? 3 : 2;
  const areaCode = nationalNumber.slice(0, areaCodeLength);
  const subscriberNumber = nationalNumber.slice(areaCodeLength);

  if (!areaCode || !subscriberNumber) return value?.trim() ?? "";

  const body = subscriberNumber.length > 4
    ? `${subscriberNumber.slice(0, -4)}-${subscriberNumber.slice(-4)}`
    : subscriberNumber;
  const countryPrefix = hasCountryCode ? `+54${hasMobilePrefix ? " 9" : ""} ` : "";

  return `${countryPrefix}${areaCode} ${body}`;
}