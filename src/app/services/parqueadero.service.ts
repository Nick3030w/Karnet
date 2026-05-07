import { Injectable, signal, computed } from '@angular/core';
import {
  Vehiculo,
  SesionParqueadero,
  ResumenParqueadero,
  TARIFAS,
  TipoVehiculo,
} from '../models/vehiculo.model';

// ============================================================
//  ParqueaderoService
//
//  Toda la lógica de negocio vive aquí.
//  Los métodos están diseñados para ser reemplazados por
//  llamadas HTTP cuando se integre el backend:
//
//    MOCK:    return this._vehiculos().filter(...)
//    BACKEND: return this.http.get<Vehiculo[]>('/api/vehiculos/...')
//
// ============================================================

// ── Datos mock ───────────────────────────────────────────
// Nicolás tiene carro y moto; Valentina tiene bicicleta
const MOCK_VEHICULOS: Vehiculo[] = [
  {
    id: 'v1',
    estudianteId: '1',
    tipo: 'carro',
    placa: 'ABC123',
    descripcion: 'Chevrolet Spark azul',
    activo: true,
  },
  {
    id: 'v2',
    estudianteId: '1',
    tipo: 'moto',
    placa: 'XYZ789',
    descripcion: 'Honda CB190 negra',
    activo: true,
  },
  {
    id: 'v3',
    estudianteId: '2',
    tipo: 'bicicleta',
    placa: 'BIC-001',
    descripcion: 'Bicicleta Trek verde',
    activo: true,
  },
];

// Sesión activa de prueba para Nicolás (carro, entró hace ~2h)
const ahora = new Date();
const dosHorasAtras = new Date(ahora.getTime() - 2 * 60 * 60 * 1000 - 15 * 60 * 1000);

const MOCK_SESIONES: SesionParqueadero[] = [
  {
    id: 's1',
    vehiculoId: 'v1',
    estudianteId: '1',
    horaEntrada: dosHorasAtras.toISOString(),
    estado: 'activa',
  },
];

@Injectable({ providedIn: 'root' })
export class ParqueaderoService {

  // ── Estado interno (signals) ─────────────────────────
  private _vehiculos  = signal<Vehiculo[]>(MOCK_VEHICULOS);
  private _sesiones   = signal<SesionParqueadero[]>(MOCK_SESIONES);

  // ── API pública (readonly) ───────────────────────────
  readonly vehiculos  = this._vehiculos.asReadonly();
  readonly sesiones   = this._sesiones.asReadonly();

  // ── Vehículos ────────────────────────────────────────

  /** Devuelve los vehículos activos de un estudiante */
  getVehiculosPorEstudiante(estudianteId: string): Vehiculo[] {
    // BACKEND: GET /api/vehiculos?estudianteId=:id
    return this._vehiculos().filter(
      (v) => v.estudianteId === estudianteId && v.activo
    );
  }

  /** Agrega un vehículo nuevo */
  agregarVehiculo(vehiculo: Omit<Vehiculo, 'id' | 'activo'>): Vehiculo {
    // BACKEND: POST /api/vehiculos
    const nuevo: Vehiculo = {
      ...vehiculo,
      id: `v${Date.now()}`,
      activo: true,
    };
    this._vehiculos.update((list) => [...list, nuevo]);
    return nuevo;
  }

  /** Desactiva (elimina lógicamente) un vehículo */
  eliminarVehiculo(vehiculoId: string): void {
    // BACKEND: DELETE /api/vehiculos/:id
    this._vehiculos.update((list) =>
      list.map((v) => (v.id === vehiculoId ? { ...v, activo: false } : v))
    );
  }

  // ── Sesiones ─────────────────────────────────────────

  /** Sesión activa de un vehículo específico */
  getSesionActiva(vehiculoId: string): SesionParqueadero | undefined {
    // BACKEND: GET /api/sesiones/activa?vehiculoId=:id
    return this._sesiones().find(
      (s) => s.vehiculoId === vehiculoId && s.estado === 'activa'
    );
  }

  /** Todas las sesiones activas de un estudiante */
  getSesionesActivasPorEstudiante(estudianteId: string): SesionParqueadero[] {
    // BACKEND: GET /api/sesiones/activas?estudianteId=:id
    return this._sesiones().filter(
      (s) => s.estudianteId === estudianteId && s.estado === 'activa'
    );
  }

  /** Historial de sesiones finalizadas de un estudiante */
  getHistorialPorEstudiante(estudianteId: string): SesionParqueadero[] {
    // BACKEND: GET /api/sesiones/historial?estudianteId=:id
    return this._sesiones()
      .filter((s) => s.estudianteId === estudianteId && s.estado === 'finalizada')
      .sort((a, b) => new Date(b.horaEntrada).getTime() - new Date(a.horaEntrada).getTime());
  }

  /**
   * Registra la entrada de un vehículo al parqueadero.
   * En el flujo real, el celador escanea el QR → llama este método.
   */
  registrarEntrada(vehiculoId: string, estudianteId: string): SesionParqueadero {
    // BACKEND: POST /api/sesiones/entrada
    const sesionExistente = this.getSesionActiva(vehiculoId);
    if (sesionExistente) return sesionExistente;

    const nueva: SesionParqueadero = {
      id: `s${Date.now()}`,
      vehiculoId,
      estudianteId,
      horaEntrada: new Date().toISOString(),
      estado: 'activa',
    };
    this._sesiones.update((list) => [...list, nueva]);
    return nueva;
  }

  /**
   * Registra la salida y calcula el costo final.
   * En el flujo real, el celador escanea el QR al salir → llama este método.
   */
  registrarSalida(sesionId: string, tipoVehiculo: TipoVehiculo): SesionParqueadero {
    // BACKEND: PATCH /api/sesiones/:id/salida
    const horaSalida = new Date().toISOString();
    let sesionFinalizada!: SesionParqueadero;

    this._sesiones.update((list) =>
      list.map((s) => {
        if (s.id !== sesionId) return s;
        const resumen = this.calcularCosto(s.horaEntrada, horaSalida, tipoVehiculo);
        sesionFinalizada = {
          ...s,
          horaSalida,
          estado: 'finalizada',
          costoFinal: resumen.costoActual,
        };
        return sesionFinalizada;
      })
    );
    return sesionFinalizada;
  }

  // ── Cálculo de costo ─────────────────────────────────

  /**
   * Calcula el costo en tiempo real dado un rango de tiempo y tipo de vehículo.
   * Puro — no modifica estado, se puede llamar desde el template cada segundo.
   */
  calcularCosto(
    horaEntrada: string,
    horaSalida: string | null,
    tipoVehiculo: TipoVehiculo
  ): ResumenParqueadero {
    const entrada  = new Date(horaEntrada).getTime();
    const salida   = horaSalida ? new Date(horaSalida).getTime() : Date.now();
    const tarifa   = TARIFAS[tipoVehiculo];

    const minutos  = Math.floor((salida - entrada) / 60000);
    const horas    = minutos / 60;

    const esTarifaPlena = horas >= tarifa.maxHorasTarifa;
    const costoActual   = esTarifaPlena
      ? tarifa.tarifaPlena
      : Math.ceil(horas * tarifa.precioPorHora);

    return {
      minutosTranscurridos: minutos,
      horasTranscurridas:   horas,
      costoActual,
      esTarifaPlena,
      tarifaAplicada: tarifa,
    };
  }
}
