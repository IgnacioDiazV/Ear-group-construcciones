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

    // 2. Inyectar datos de cabecera (ajustá las filas según tu plantilla)
    // Asumiendo filas fijas para: Obra, Cliente, Dirección, Fecha
    // Estos valores se escriben en las celdas correspondientes
    if (worksheet.getCell("B4")) worksheet.getCell("B4").value = data.obra;
    if (worksheet.getCell("B5")) worksheet.getCell("B5").value = data.cliente;
    if (worksheet.getCell("B6")) worksheet.getCell("B6").value = data.direccion;
    if (worksheet.getCell("B7")) worksheet.getCell("B7").value = data.fecha;

    // 3. Inyectar ítems a partir de la fila 18 (ajustá según tu plantilla)
    let currentRow = 18;
    const firstDataRow = currentRow;

    data.items.forEach((item, idx) => {
      // Columna B: Número correlativo
      const nCell = worksheet.getCell(currentRow, 2); // Columna B
      nCell.value = idx + 1;
      nCell.alignment = { horizontal: "center" as const };

      // Columna C: Concepto
      const conceptoCell = worksheet.getCell(currentRow, 3); // Columna C
      conceptoCell.value = item.concepto;
      conceptoCell.alignment = { horizontal: "left" as const, wrapText: true };

      // Columna D: Unidad
      const unidadCell = worksheet.getCell(currentRow, 4); // Columna D
      unidadCell.value = item.unidad;
      unidadCell.alignment = { horizontal: "center" as const };

      // Columna E: Cantidad
      const cantidadCell = worksheet.getCell(currentRow, 5); // Columna E
      cantidadCell.value = item.cantidad;
      cantidadCell.alignment = { horizontal: "right" as const };
      cantidadCell.numFmt = "0.00";

      // Columna F: Precio Unitario Material
      const pMaterialCell = worksheet.getCell(currentRow, 6); // Columna F
      pMaterialCell.value = item.precioMaterial;
      pMaterialCell.alignment = { horizontal: "right" as const };
      pMaterialCell.numFmt = '"$ "#,##0.00';

      // Columna G: Precio Mano de Obra
      const pManoObraCell = worksheet.getCell(currentRow, 7); // Columna G
      pManoObraCell.value = item.precioManoObra;
      pManoObraCell.alignment = { horizontal: "right" as const };
      pManoObraCell.numFmt = '"$ "#,##0.00';

      // Columna H: Costo Total (fórmula)
      const totalCell = worksheet.getCell(currentRow, 8); // Columna H
      totalCell.value = {
        formula: `(E${currentRow}*F${currentRow})+(E${currentRow}*G${currentRow})`,
        result: item.cantidad * (item.precioMaterial + item.precioManoObra),
      };
      totalCell.alignment = { horizontal: "right" as const };
      totalCell.numFmt = '"$ "#,##0.00';

      // Mantener altura de fila
      worksheet.getRow(currentRow).height = 25;

      currentRow++;
    });

    const lastDataRow = currentRow - 1;
    const rowTotal = currentRow + 1;

    // 4. Fila de Total
    const totalLabelCell = worksheet.getCell(rowTotal, 7); // Columna G
    totalLabelCell.value = "PRECIO TOTAL $";
    totalLabelCell.font = { bold: true };
    totalLabelCell.alignment = { horizontal: "right" as const };

    const totalValueCell = worksheet.getCell(rowTotal, 8); // Columna H
    totalValueCell.value = {
      formula: `SUM(H${firstDataRow}:H${lastDataRow})`,
      result: data.total,
    };
    totalValueCell.font = { bold: true };
    totalValueCell.numFmt = '"$ "#,##0.00';
    totalValueCell.alignment = { horizontal: "right" as const };

    // 5. Fila de Monto en Letras (plantilla ya tiene merge de fábrica)
    const rowLetras = rowTotal + 2;
    const montoLetrasCell = worksheet.getCell(rowLetras, 1); // Columna A
    montoLetrasCell.value = `El Monto Final asciende a la suma en pesos ($): ${montoEnLetras(data.total)}`;
    montoLetrasCell.font = { bold: true, italic: true, size: 10 };
    montoLetrasCell.alignment = {
      horizontal: "left" as const,
      vertical: "middle" as const,
      wrapText: true,
    };
    worksheet.getRow(rowLetras).height = 25;

    // 6. Fila de Validez de Oferta (plantilla ya tiene merge de fábrica)
    const rowValidez = rowLetras + 2;
    const validezCell = worksheet.getCell(rowValidez, 1); // Columna A
    validezCell.value = `Mantenimiento de la oferta ${data.validezDias} días hábiles`;
    validezCell.font = { italic: true, size: 9 };
    validezCell.alignment = { horizontal: "left" as const, wrapText: true };
    worksheet.getRow(rowValidez).height = 20;

    // 7. Descargar archivo
    const fileBuffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([fileBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const fechaFormato = new Date(data.fecha)
      .toLocaleDateString("es-AR")
      .replace(/\//g, "-");
    const nombreObra = data.obra
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 30) || "Obra";

    saveAs(blob, `Cotizacion-${nombreObra}-${fechaFormato}.xlsx`);
  } catch (error) {
    console.error("Error al exportar a Excel:", error);
    throw error;
  }
}
