export interface StockConsumible {
  id: number;
  consumible: number;
  consumible_nombre: string;
  consumible_tipo: string;
  marca: number | null;
  marca_nombre: string;
  stock_actual: number;
  stock_minimo: number;
  bajo_minimo: boolean;
  orden_compra: string;
  costo_unitario: number | null;
  fecha_actualizacion: string;
  observaciones: string;
}

export interface MovimientoStock {
  id: number;
  stock_consumible: number;
  consumible_nombre: string;
  tipo: 'INGRESO' | 'SALIDA';
  cantidad: number;
  dispositivo: number | null;
  ticket: number | null;
  registrado_por: number;
  registrado_por_nombre: string;
  fecha: string;
  referencia: string;
  observacion: string;
}
