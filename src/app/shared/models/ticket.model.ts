export type EstadoTicket =
  | 'ENVIADO'
  | 'EN_REVISION'
  | 'ASIGNADO'
  | 'EN_ATENCION'
  | 'SOLUCIONADO'
  | 'EN_MANTENIMIENTO'
  | 'TERCERIZADO'
  | 'FINALIZADO'
  | 'RECHAZADO';

export type TipoResultado = 'MENOR' | 'MAYOR' | 'TERCERIZADO';

export interface TicketHistorial {
  id: number;
  estado_anterior: string;
  estado_anterior_display: string;
  estado_nuevo: string;
  estado_nuevo_display: string;
  comentario: string;
  usuario_nombre: string;
  fecha: string;
}

export interface TicketDiagnostico {
  id: number;
  tipo_falla: string;
  detalle_tecnico: string;
  tipo_resultado: TipoResultado;
  tiempo_estimado: string;
  fecha_registro: string;
  tecnico: number;
  tecnico_nombre: string;
}

export interface TicketAccion {
  id: number;
  tipo_accion: string;
  detalle: string;
  tecnico: number;
  tecnico_nombre: string;
  fecha_registro: string;
}

export interface TicketTercerizado {
  id: number;
  empresa: string;
  contacto: string;
  fecha_entrega_est: string | null;
  presupuesto: number | null;
  estado_tercerizado: 'ENVIADO' | 'RECIBIDO' | 'REPARADO' | 'NO_REPARABLE';
  observacion: string;
  registrado_por: number;
}

export interface TicketList {
  id: number;
  numero: string;
  estado: EstadoTicket;
  estado_display: string;
  dispositivo: number;
  dispositivo_cod: string;
  solicitante_nombre: string;
  tecnico_nombre: string;
  tipo_mantenimiento: string;
  fecha_creacion: string;
}

export interface TicketDetail {
  id: number;
  numero: string;
  estado: EstadoTicket;
  estado_display: string;
  dispositivo: number;
  dispositivo_cod: string;
  dispositivo_tipo: string;
  solicitante: number;
  solicitante_nombre: string;
  asignado_por: number | null;
  asignado_por_nombre: string;
  tecnico: number | null;
  tecnico_nombre: string;
  tipo_mantenimiento: string;
  detalle_falla: string;
  ip_solicitante: string | null;
  responsable_snapshot: number | null;
  nombre_responsable_snapshot: string;
  cargo_responsable_snapshot: string;
  fecha_creacion: string;
  fecha_asignacion: string | null;
  fecha_inicio: string | null;
  fecha_cierre: string | null;
  observaciones: string;
  diagnostico: TicketDiagnostico | null;
  acciones: TicketAccion[];
  historial: TicketHistorial[];
  tercerizado: TicketTercerizado | null;
  ip_warning?: boolean;
}

export interface TicketCreate {
  dispositivo: number;
  tipo_mantenimiento: 'PREVENTIVO' | 'CORRECTIVO';
  detalle_falla: string;
  observaciones?: string;
}

export interface TransicionPayload {
  nuevo_estado: EstadoTicket;
  comentario?: string;
  tecnico_id?: number | null;
}

export interface DiagnosticoPayload {
  tipo_falla: string;
  detalle_tecnico: string;
  tipo_resultado: TipoResultado;
  tiempo_estimado?: string;
}

export const ESTADOS_TERMINALES: EstadoTicket[] = ['SOLUCIONADO', 'FINALIZADO', 'RECHAZADO'];

export const ESTADO_COLOR: Record<EstadoTicket, string> = {
  ENVIADO: 'badge-enviado',
  EN_REVISION: 'badge-en_revision',
  ASIGNADO: 'badge-asignado',
  EN_ATENCION: 'badge-en_atencion',
  SOLUCIONADO: 'badge-solucionado',
  EN_MANTENIMIENTO: 'badge-en_mantenimiento',
  TERCERIZADO: 'badge-tercerizado',
  FINALIZADO: 'badge-finalizado',
  RECHAZADO: 'badge-rechazado',
};
