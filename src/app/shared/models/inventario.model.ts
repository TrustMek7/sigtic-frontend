export type EstadoDispositivo = 'OPERATIVO' | 'EN_MANTENIMIENTO' | 'DE_BAJA' | 'ALMACEN';

export interface DispositivoList {
  id: number;
  cod_inventario: string;
  tipo_codigo: string;
  tipo_nombre: string;
  marca_nombre: string;
  modelo: string;
  serie: string;
  estado: EstadoDispositivo;
  sede_nombre: string;
  responsable_nombre: string;
  activo: boolean;
}

export interface DispComputadora {
  sistema_operativo: number | null;
  procesador: number | null;
  memoria_ram: number | null;
  almacenamiento: string;
  ip: string | null;
  mac: string;
  nombre_equipo: string;
  dominio: string;
  tipo_pc: 'DESKTOP' | 'LAPTOP' | 'ALL_IN_ONE' | 'SERVIDOR' | '';
  cod_monitor: string;
  cod_teclado: string;
  licencia_office: boolean;
  licencia_windows: boolean;
  antivirus: boolean;
}

export interface DispImpresora {
  tipo: string;
  ip: string | null;
  mac: string;
  nombre_red: string;
  consumible: number | null;
}

export interface DispMonitor {
  tamanio_pulgadas: number | null;
  resolucion: string;
  tipo_panel: string;
  conexion: string;
}

export interface DispPeriferico {
  subtipo: string;
  conexion: string;
}

export interface DispRed {
  subtipo: string;
  ip: string | null;
  mac: string;
  nombre_red: string;
  puertos: number | null;
}

export interface DispCamara {
  tipo_camara: string;
  ip: string | null;
  mac: string;
  usuario_acceso: string;
  clave_acceso: string;
  nvr: number | null;
}

export interface DispTelefono {
  extension: string;
  ip: string | null;
  mac: string;
}

export interface DispositivoDetail {
  id: number;
  tipo_dispositivo: number;
  tipo_codigo: string;
  tipo_nombre: string;
  marca: number | null;
  modelo: string;
  serie: string;
  cod_inventario: string;
  color: string;
  estado: EstadoDispositivo;
  sede: number | null;
  unidad_organica: number | null;
  subgerencia: number | null;
  dependencia: number | null;
  responsable: number | null;
  dni_responsable: string;
  proveedor: string;
  orden_compra: string;
  observacion: string;
  activo: boolean;
  fecha_registro: string;
  computadora?: DispComputadora;
  impresora?: DispImpresora;
  monitor?: DispMonitor;
  periferico?: DispPeriferico;
  red?: DispRed;
  camara?: DispCamara;
  telefono?: DispTelefono;
}

export interface BienBaja {
  id: number;
  dispositivo: number | null;
  dispositivo_cod: string;
  sin_registro: boolean;
  sr_cod_inventario: string;
  sr_descripcion: string;
  sr_marca: string;
  sr_modelo: string;
  sr_serie: string;
  cod_inventario_ref: string;
  motivo: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'PROCESADO';
  fecha: string;
  lugar_origen: string;
  observacion: string;
  registrado_por: number;
  registrado_por_nombre: string;
  fotos: BienBajaFoto[];
}

export interface BienBajaFoto {
  id: number;
  archivo: string;
  fecha: string;
  slot: number;
}

export const ESTADO_DISPOSITIVO_COLOR: Record<EstadoDispositivo, string> = {
  OPERATIVO: 'badge-operativo',
  EN_MANTENIMIENTO: 'badge-en_mantenimiento',
  DE_BAJA: 'badge-de_baja',
  ALMACEN: 'badge-almacen',
};
