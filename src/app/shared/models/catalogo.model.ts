export interface Marca {
  id: number;
  nombre: string;
}

export interface TipoDispositivo {
  id: number;
  codigo: string;
  nombre: string;
  tiene_subtabla: boolean;
}

export interface SistemaOperativo {
  id: number;
  nombre: string;
}

export interface Procesador {
  id: number;
  nombre: string;
}

export interface MemoriaRam {
  id: number;
  capacidad: string;
}

export interface Consumible {
  id: number;
  nombre: string;
  tipo: string;
  tipo_display: string;
}
