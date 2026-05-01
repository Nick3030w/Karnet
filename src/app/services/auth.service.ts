import { Injectable, signal } from '@angular/core';
import { User } from '../models/user.model';

// Usuarios mock — reemplazar con llamadas a API/BD más adelante
const MOCK_USERS: (User & { password: string })[] = [
  {
    id: '1',
    nombre: 'Nicolás',
    apellido: 'Espitia',
    codigo: '506232073',
    email: 'nicolas.espitia@konradlorenz.edu.co',
    carrera: 'Ingeniería de Sistemas',
    role: 'estudiante',
    password: '123456',
    estadoBiblioteca: {
      estado: 'activo',
      itemsPrestados: 2,
      limitePrestamos: 5,
    },
  },
  {
    id: '2',
    nombre: 'Valentina',
    apellido: 'Herrera',
    codigo: '703232068',
    email: 'valentina.herrera@konradlorenz.edu.co',
    carrera: 'Psicología',
    role: 'estudiante',
    password: '123456',
    estadoBiblioteca: {
      estado: 'deuda',
      razon: 'Tienes una multa pendiente de $8.500 por devolución tardía.',
      itemsPrestados: 0,
      limitePrestamos: 5,
    },
  },
  {
    id: '3',
    nombre: 'Carlos',
    apellido: 'Rodríguez',
    codigo: '2021115023',
    email: 'carlos.rodriguez@konradlorenz.edu.co',
    carrera: 'Ingeniería de Sistemas',
    role: 'estudiante',
    password: '123456',
    estadoBiblioteca: {
      estado: 'suspendido',
      razon: 'Préstamo vencido: "Cálculo diferencial" (3 días de retraso).',
      hastaFecha: '10 de mayo de 2026',
      itemsPrestados: 1,
      limitePrestamos: 5,
    },
  },
  {
    id: '4',
    nombre: 'Admin',
    apellido: 'Universidad',
    codigo: 'ADM001',
    email: 'admin@konradlorenz.edu.co',
    carrera: 'Administración',
    role: 'admin',
    password: 'admin123',
    estadoBiblioteca: {
      estado: 'activo',
      itemsPrestados: 0,
      limitePrestamos: 10,
    },
  },
];

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _currentUser = signal<User | null>(null);

  readonly currentUser = this._currentUser.asReadonly();

  login(email: string, password: string): { success: boolean; message: string } {
    const found = MOCK_USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (!found) {
      return { success: false, message: 'Correo o contraseña incorrectos.' };
    }

    const { password: _, ...user } = found;
    this._currentUser.set(user);
    return { success: true, message: 'Bienvenido' };
  }

  logout(): void {
    this._currentUser.set(null);
  }

  isAuthenticated(): boolean {
    return this._currentUser() !== null;
  }

  isAdmin(): boolean {
    return this._currentUser()?.role === 'admin';
  }
}
