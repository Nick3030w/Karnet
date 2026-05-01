export type UserRole = 'estudiante' | 'admin';

export type EstadoPrestamo = 'activo' | 'suspendido' | 'deuda' | 'vencido';

export interface EstadoBiblioteca {
  estado: EstadoPrestamo;
  // Razón solo aplica cuando no está activo
  razon?: string;
  // Fecha hasta la que aplica la suspensión (si aplica)
  hastaFecha?: string;
  // Número de ítems actualmente prestados
  itemsPrestados?: number;
  // Límite máximo de préstamos simultáneos
  limitePrestamos: number;
}

export interface User {
  id: string;
  nombre: string;
  apellido: string;
  codigo: string;
  email: string;
  carrera: string;
  role: UserRole;
  fotoUrl?: string;
  estadoBiblioteca: EstadoBiblioteca;
}
