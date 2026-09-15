/**
 * Obtiene la cotización actual del dólar blue desde dolarapi.com
 * @returns Objeto con venta, compra y timestamp
 */
export async function getUSDARSRate(): Promise<{ venta: number; compra: number; timestamp: string }> {
  const defaultRate = { venta: 1000, compra: 980, timestamp: new Date().toISOString() };
  
  try {
    const response = await fetch("https://dolarapi.com/v1/dolares/blue", {
      next: { revalidate: 3600 }, // Cache por 1 hora
    });

    if (!response.ok) {
      console.warn(`API de cotización retornó status ${response.status}, usando valores por defecto`);
      return defaultRate;
    }

    const data = await response.json();
    const venta = Number(data.venta) || defaultRate.venta;
    const compra = Number(data.compra) || defaultRate.compra;

    return {
      venta: venta > 0 ? venta : defaultRate.venta,
      compra: compra > 0 ? compra : defaultRate.compra,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.warn("Error al obtener cotización de dólar:", error instanceof Error ? error.message : String(error));
    return defaultRate;
  }
}
