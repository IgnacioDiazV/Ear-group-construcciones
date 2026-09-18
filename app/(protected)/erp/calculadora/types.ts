import { ReactNode } from "react";

export interface ItemCotizacion {
  id: number;
  concepto: string;
  unidad: string;
  cantidad: number;
  precioMaterial: number;
  precioManoObra: number;
}

export interface TipoComputo {
  id: string;
  label: string;
}

export interface FieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export interface NumFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
}

export interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  className?: string;
}

export interface AsistenteComputoProps {
  onClose: () => void;
  onAdd: (item: Omit<ItemCotizacion, "id">) => void;
}

export interface ComputoResult {
  cantidad: number;
  unidad: string;
  conceptoSugerido: string;
}
