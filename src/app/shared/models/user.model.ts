export type Rol = 'ADMIN' | 'JEFE_INFO' | 'ENCARGADO_INFO' | 'TECNICO' | 'USUARIO';

export interface UserCargo {
  id: number;
  car_ide_siggo: number;
  uni_ide_siggo: number;
  uni_nombre_siggo: string;
  cargo_descripcion: string;
  es_principal: boolean;
  activo: boolean;
}

export interface UserProfile {
  id: number;
  dni: string;
  nombre_completo: string;
  email: string;
  telefono: string;
  rol: Rol;
  rol_display: string;
  sede: number | null;
  activo: boolean;
  ultimo_sync_siggo: string | null;
  cargos?: UserCargo[];
  cargo_descripcion?: string;
}

export interface LoginResponse {
  id: number;
  nombre_completo: string;
  rol: Rol;
  rol_display: string;
  ip_warning?: boolean;
}

export interface EncargadoActivo {
  id: number;
  encargado: number;
  encargado_nombre: string;
  autorizado_por: number;
  autorizado_por_nombre: string;
  desde: string;
  hasta: string | null;
  motivo: string;
  activo: boolean;
}
