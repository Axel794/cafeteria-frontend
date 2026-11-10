/**
 * Modelos TypeScript que reflejan los DTO del backend (carpeta dto de cafeteria-backend).
 * Si el backend cambia un campo, se cambia aqui y el compilador avisa donde se usa.
 */

export type EstadoPedido = 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO' | 'ENTREGADO';
export type TipoPedido = 'LOCAL' | 'PICKUP';
export type Rol = 'ADMINISTRADOR' | 'BARISTA';

/** Orden en que avanza un pedido; el backend solo permite avanzar un paso a la vez. */
export const ESTADOS: readonly EstadoPedido[] = ['PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO'];

export const ETIQUETA_ESTADO: Record<EstadoPedido, string> = {
  PENDIENTE: 'Pendiente',
  EN_PREPARACION: 'En preparación',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
};

export const ETIQUETA_TIPO: Record<TipoPedido, string> = {
  LOCAL: 'Para consumir en local',
  PICKUP: 'Para llevar (pick-up)',
};

/** Devuelve el estado que sigue, o null si el pedido ya esta entregado. */
export function siguienteEstado(estado: EstadoPedido): EstadoPedido | null {
  const indice = ESTADOS.indexOf(estado);
  return indice >= 0 && indice < ESTADOS.length - 1 ? ESTADOS[indice + 1] : null;
}

export interface Categoria {
  id: number;
  nombre: string;
  activa: boolean;
}

export interface CategoriaRequest {
  nombre: string;
  activa?: boolean;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  disponible: boolean;
  categoriaId: number;
  categoria: string;
  imagenUrl: string | null;
  alergenos: string | null;
}

export interface ProductoRequest {
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoriaId: number;
  imagenUrl: string | null;
  alergenos: string | null;
  disponible: boolean;
}

export interface DetallePedidoRequest {
  productoId: number;
  cantidad: number;
  notas: string | null;
}

export interface PedidoRequest {
  tipoPedido: TipoPedido;
  numeroMesa: number | null;
  nombreCliente: string | null;
  telefonoCliente: string | null;
  detalles: DetallePedidoRequest[];
}

export interface DetallePedido {
  productoId: number;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  notas: string | null;
}

export interface Pedido {
  id: number;
  codigoTicket: string;
  fechaHora: string;
  estado: EstadoPedido;
  tipoPedido: TipoPedido;
  numeroMesa: number | null;
  nombreCliente: string | null;
  telefonoCliente: string | null;
  total: number;
  detalles: DetallePedido[];
}

export interface Tracker {
  id: number;
  codigoTicket: string;
  estado: EstadoPedido;
  tipoPedido: TipoPedido;
  fechaHora: string;
  mensaje: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tipo: string;
  username: string;
  rol: Rol;
  expiraEnMinutos: number;
}

/** Formato unico de error que devuelve el backend (tambien en 401 y 403). */
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  mensaje: string;
  detalles: string[];
}
