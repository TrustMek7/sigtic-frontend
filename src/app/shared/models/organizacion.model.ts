export interface Sede {
  id: number;
  nombre: string;
  direccion: string;
  sed_ide_siggo?: number | null;
}

export interface UnidadOrganica {
  id: number;
  nombre: string;
  abreviatura: string;
  nivel: number;
  superior: number | null;
}

export interface Subgerencia {
  id: number;
  nombre: string;
  unidad_organica: number;
}

export interface Dependencia {
  id: number;
  nombre: string;
  subgerencia: number;
}
