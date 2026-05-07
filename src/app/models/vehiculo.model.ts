// ============================================================
//  Modelos de Parqueadero
//  Diseñados para acoplarse fácilmente a un backend REST.
//  Cuando se integre la API, estos mismos tipos mapean 1:1
//  con las entidades de la base de datos.
// ============================================================

export type TipoVehiculo = 'carro' | 'moto' | 'bicicleta';

export interface Vehiculo {
  id: string;
  estudianteId: string;       // FK → User.id
  tipo: TipoVehiculo;
  placa: string;              // Bicicletas pueden usar un código interno
  descripcion: string;        // Ej: "Honda CB190 roja"
  activo: boolean;
}

// ── Tarifas ──────────────────────────────────────────────
export interface TarifaVehiculo {
  tipo: TipoVehiculo;
  precioPorHora: number;      // COP por hora
  // Si supera maxHorasTarifa horas, se cobra tarifaPlena en lugar de por hora
  maxHorasTarifa: number;
  tarifaPlena: number;        // COP tarifa máxima del día
}

export const TARIFAS: Record<TipoVehiculo, TarifaVehiculo> = {
  carro: {
    tipo: 'carro',
    precioPorHora: 2500,
    maxHorasTarifa: 8,
    tarifaPlena: 15000,
  },
  moto: {
    tipo: 'moto',
    precioPorHora: 1500,
    maxHorasTarifa: 8,
    tarifaPlena: 9000,
  },
  bicicleta: {
    tipo: 'bicicleta',
    precioPorHora: 500,
    maxHorasTarifa: 8,
    tarifaPlena: 3000,
  },
};

// ── Sesión de parqueadero ────────────────────────────────
export type EstadoSesion = 'activa' | 'finalizada';

export interface SesionParqueadero {
  id: string;
  vehiculoId: string;         // FK → Vehiculo.id
  estudianteId: string;       // FK → User.id (desnormalizado para queries rápidas)
  horaEntrada: string;        // ISO 8601 — se guarda como string para serializar fácil
  horaSalida?: string;        // ISO 8601 — undefined mientras está activa
  estado: EstadoSesion;
  costoFinal?: number;        // COP — se calcula al cerrar la sesión
  // Registrado por el celador (futuro: celadoresId)
  registradoPor?: string;
}

// ── Resultado del cálculo en tiempo real ─────────────────
export interface ResumenParqueadero {
  minutosTranscurridos: number;
  horasTranscurridas: number;
  costoActual: number;
  esTarifaPlena: boolean;
  tarifaAplicada: TarifaVehiculo;
}
