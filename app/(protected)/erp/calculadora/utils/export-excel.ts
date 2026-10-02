import { Workbook } from "exceljs";
import { saveAs } from "file-saver";
import { ItemCotizacion } from "../types";
import { montoEnLetras } from "./monto-en-letras";

export interface CotizacionData {
  obra: string;
  cliente: string;
  direccion: string;
  fecha: string;
  items: ItemCotizacion[];
  total: number;
  totalMateriales: number;
  totalManoObra: number;
  validezDias: string;
  presentacion: string;
}

// Conversión estricta a número válido para Excel
function safeNum(val: unknown): number {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const clean = String(val).replace(/\./g, "").replace(",", ".");
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

export async function exportarCotizacionAExcel(data: CotizacionData): Promise<void> {
  try {
    // 1. Cargar plantilla oficial
    const response = await fetch("/templates/plantilla-cotizacion.xlsx");
    if (!response.ok) {
      throw new Error("No se encontró la plantilla en /templates/plantilla-cotizacion.xlsx");
    }

    const buffer = await response.arrayBuffer();
    const workbook = new Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];

    // 2. Inyectar datos de cabecera
    if (worksheet.getCell("B4")) worksheet.getCell("B4").value = data.obra || "-";
    if (worksheet.getCell("B5")) worksheet.getCell("B5").value = data.cliente || "-";
    if (worksheet.getCell("B6")) worksheet.getCell("B6").value = data.direccion || "-";
    if (worksheet.getCell("B7")) {
      const f = data.fecha ? new Date(data.fecha + "T00:00:00") : new Date();
      worksheet.getCell("B7").value = f.toLocaleDateString("es-AR");
    }

    // 3. Inyectar ítems a partir de la fila 18
    let currentRow = 18;
    const firstDataRow = currentRow;

    data.items.forEach((item, idx) => {
      const cant = safeNum(item.cantidad);
      const pMat = safeNum(item.precioMaterial);
      const pMano = safeNum(item.precioManoObra);
      const totalCalculado = cant * (pMat + pMano);

      // Columna B: Número
      const nCell = worksheet.getCell(currentRow, 2);
      nCell.value = idx + 1;
      nCell.alignment = { horizontal: "center", vertical: "middle" };

      // Columna C: Concepto / Descripción
      const conceptoCell = worksheet.getCell(currentRow, 3);
      conceptoCell.value = item.concepto || "";
      conceptoCell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };

      // Columna D: Unidad
      const unidadCell = worksheet.getCell(currentRow, 4);
      unidadCell.value = item.unidad || "gl";
      unidadCell.alignment = { horizontal: "center", vertical: "middle" };

      // Columna E: Cantidad (número real)
      const cantidadCell = worksheet.getCell(currentRow, 5);
      cantidadCell.value = cant;
      cantidadCell.numFmt = "#,##0.00";
      cantidadCell.alignment = { horizontal: "right", vertical: "middle" };

      // Columna F: P. Mat ($)
      const pMaterialCell = worksheet.getCell(currentRow, 6);
      pMaterialCell.value = pMat;
      pMaterialCell.numFmt = '"$ "#,##0.00';
      pMaterialCell.alignment = { horizontal: "right", vertical: "middle" };

      // Columna G: P. Mano ($)
      const pManoObraCell = worksheet.getCell(currentRow, 7);
      pManoObraCell.value = pMano;
      pManoObraCell.numFmt = '"$ "#,##0.00';
      pManoObraCell.alignment = { horizontal: "right", vertical: "middle" };

      // Columna H: Total ($) con fórmula nativa que recalcula si el usuario edita en Excel
      const totalCell = worksheet.getCell(currentRow, 8);
      totalCell.value = {
        formula: `E${currentRow}*(F${currentRow}+G${currentRow})`,
        result: totalCalculado,
      };
      totalCell.numFmt = '"$ "#,##0.00';
      totalCell.alignment = { horizontal: "right", vertical: "middle" };

      // Ajustar altura de fila para que respire
      worksheet.getRow(currentRow).height = 24;

      currentRow++;
    });

    const lastDataRow = Math.max(firstDataRow, currentRow - 1);
    const rowTotal = currentRow + 1;

    // 4. Fila de Total General con fórmula =SUM(...)
    const totalLabelCell = worksheet.getCell(rowTotal, 7);
    totalLabelCell.value = "PRECIO TOTAL $";
    totalLabelCell.font = { bold: true, color: { argb: "FF3E2723" } };
    totalLabelCell.alignment = { horizontal: "right", vertical: "middle" };

    const totalValueCell = worksheet.getCell(rowTotal, 8);
    totalValueCell.value = {
      formula: `SUM(H${firstDataRow}:H${lastDataRow})`,
      result: safeNum(data.total),
    };
    totalValueCell.font = { bold: true, size: 12, color: { argb: "FF3E2723" } };
    totalValueCell.numFmt = '"$ "#,##0.00';
    totalValueCell.alignment = { horizontal: "right", vertical: "middle" };
    worksheet.getRow(rowTotal).height = 26;

    // 5. Monto en Letras
    const rowLetras = rowTotal + 2;
    const montoLetrasCell = worksheet.getCell(rowLetras, 1);
    montoLetrasCell.value = `El Monto Final asciende a la suma en pesos ($): ${montoEnLetras(data.total)}`;
    montoLetrasCell.font = { bold: true, italic: true, size: 10 };
    montoLetrasCell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
    worksheet.getRow(rowLetras).height = 24;

    // 6. Validez de Oferta
    const rowValidez = rowLetras + 2;
    const validezCell = worksheet.getCell(rowValidez, 1);
    validezCell.value = `Mantenimiento de la oferta: ${data.validezDias} días hábiles a partir de la fecha de emisión.`;
    validezCell.font = { italic: true, size: 9 };
    validezCell.alignment = { horizontal: "left", vertical: "middle" };
    worksheet.getRow(rowValidez).height = 20;

    // 7. Configuración de página para que al imprimir en Excel salga perfecto en A4
    worksheet.pageSetup = {
      paperSize: 9, // A4
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.5,
        right: 0.5,
        top: 0.6,
        bottom: 0.6,
        header: 0.3,
        footer: 0.3,
      },
    };

    // 8. Generar y disparar descarga
    const fileBuffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([fileBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const fechaFormato = new Date().toISOString().slice(0, 10);
    const nombreObraLimpio = (data.obra || "Obra")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .substring(0, 30);

    saveAs(blob, `Cotizacion-${nombreObraLimpio}-${fechaFormato}.xlsx`);
  } catch (error) {
    console.error("Error al exportar a Excel:", error);
    throw error;
  }
}