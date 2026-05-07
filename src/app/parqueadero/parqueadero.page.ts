import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonButton, IonIcon,
  IonModal, IonItem, IonLabel, IonInput, IonSelect,
  IonSelectOption, AlertController, ToastController,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  carOutline, bicycleOutline, timeOutline,
  addCircleOutline, trashOutline, checkmarkCircleOutline,
  closeCircleOutline, cashOutline, enterOutline,
  exitOutline, alertCircleOutline,
} from 'ionicons/icons';

import { AuthService } from '../services/auth.service';
import { ParqueaderoService } from '../services/parqueadero.service';
import { Vehiculo, SesionParqueadero, ResumenParqueadero, TipoVehiculo, TARIFAS } from '../models/vehiculo.model';
import { User } from '../models/user.model';

@Component({
  selector: 'app-parqueadero',
  templateUrl: 'parqueadero.page.html',
  styleUrls: ['parqueadero.page.scss'],
  imports: [
    FormsModule, CurrencyPipe, DatePipe,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonBackButton, IonButton, IonIcon,
    IonModal, IonItem, IonLabel, IonInput, IonSelect,
    IonSelectOption,
  ],
})
export class ParqueaderoPage implements OnInit, OnDestroy {

  get user(): User | null { return this.auth.currentUser(); }

  vehiculos: Vehiculo[] = [];
  sesionesActivas: SesionParqueadero[] = [];
  historial: SesionParqueadero[] = [];

  // Resúmenes en tiempo real (vehiculoId → ResumenParqueadero)
  resumenes: Record<string, ResumenParqueadero> = {};

  // Modal agregar vehículo
  modalAbierto = false;
  nuevoTipo: TipoVehiculo = 'carro';
  nuevaPlaca = '';
  nuevaDescripcion = '';

  readonly tarifas = TARIFAS;
  readonly tiposVehiculo: TipoVehiculo[] = ['carro', 'moto', 'bicicleta'];

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private auth: AuthService,
    private parqueaderoSvc: ParqueaderoService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private router: Router,
  ) {
    addIcons({
      carOutline, bicycleOutline, timeOutline,
      addCircleOutline, trashOutline, checkmarkCircleOutline,
      closeCircleOutline, cashOutline, enterOutline,
      exitOutline, alertCircleOutline,
    });
  }

  ngOnInit() {
    this.cargarDatos();
    // Actualiza los costos cada 30 segundos
    this.timer = setInterval(() => this.actualizarResumenes(), 30000);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  ionViewWillEnter() {
    this.cargarDatos();
  }

  private cargarDatos() {
    const uid = this.user?.id;
    if (!uid) return;
    this.vehiculos       = this.parqueaderoSvc.getVehiculosPorEstudiante(uid);
    this.sesionesActivas = this.parqueaderoSvc.getSesionesActivasPorEstudiante(uid);
    this.historial       = this.parqueaderoSvc.getHistorialPorEstudiante(uid);
    this.actualizarResumenes();
  }

  private actualizarResumenes() {
    for (const sesion of this.sesionesActivas) {
      const vehiculo = this.vehiculos.find((v) => v.id === sesion.vehiculoId);
      if (!vehiculo) continue;
      this.resumenes[sesion.vehiculoId] = this.parqueaderoSvc.calcularCosto(
        sesion.horaEntrada, null, vehiculo.tipo
      );
    }
  }

  getVehiculo(vehiculoId: string): Vehiculo | undefined {
    return this.vehiculos.find((v) => v.id === vehiculoId);
  }

  getResumen(vehiculoId: string): ResumenParqueadero | undefined {
    return this.resumenes[vehiculoId];
  }

  formatTiempo(minutos: number): string {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    if (h === 0) return `${m} min`;
    return `${h}h ${m}min`;
  }

  iconoVehiculo(tipo: TipoVehiculo): string {
    const mapa: Record<TipoVehiculo, string> = {
      carro:      'car-outline',
      moto:       'car-sport-outline',
      bicicleta:  'bicycle-outline',
    };
    return mapa[tipo];
  }

  labelTipo(tipo: TipoVehiculo): string {
    return { carro: 'Carro', moto: 'Moto', bicicleta: 'Bicicleta' }[tipo];
  }

  // ── Agregar vehículo ─────────────────────────────────
  abrirModal() {
    this.nuevoTipo = 'carro';
    this.nuevaPlaca = '';
    this.nuevaDescripcion = '';
    this.modalAbierto = true;
  }

  cerrarModal() { this.modalAbierto = false; }

  async guardarVehiculo() {
    if (!this.nuevaPlaca.trim() || !this.nuevaDescripcion.trim()) {
      await this.showToast('Completa todos los campos.', 'warning');
      return;
    }
    this.parqueaderoSvc.agregarVehiculo({
      estudianteId: this.user!.id,
      tipo: this.nuevoTipo,
      placa: this.nuevaPlaca.trim().toUpperCase(),
      descripcion: this.nuevaDescripcion.trim(),
    });
    this.cerrarModal();
    this.cargarDatos();
    await this.showToast('Vehículo registrado correctamente.', 'success');
  }

  // ── Eliminar vehículo ────────────────────────────────
  async confirmarEliminar(vehiculo: Vehiculo) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar vehículo',
      message: `¿Eliminar ${vehiculo.descripcion} (${vehiculo.placa})?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.parqueaderoSvc.eliminarVehiculo(vehiculo.id);
            this.cargarDatos();
          },
        },
      ],
    });
    await alert.present();
  }

  // ── Registrar entrada (simulación celador) ───────────
  async registrarEntrada(vehiculo: Vehiculo) {
    const sesionExistente = this.parqueaderoSvc.getSesionActiva(vehiculo.id);
    if (sesionExistente) {
      await this.showToast('Este vehículo ya tiene una sesión activa.', 'warning');
      return;
    }
    this.parqueaderoSvc.registrarEntrada(vehiculo.id, this.user!.id);
    this.cargarDatos();
    await this.showToast(`Entrada registrada para ${vehiculo.placa}.`, 'success');
  }

  // ── Registrar salida ─────────────────────────────────
  async registrarSalida(sesion: SesionParqueadero) {
    const vehiculo = this.getVehiculo(sesion.vehiculoId);
    if (!vehiculo) return;

    const resumen = this.parqueaderoSvc.calcularCosto(sesion.horaEntrada, null, vehiculo.tipo);
    const costoFormateado = new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(resumen.costoActual);

    const alert = await this.alertCtrl.create({
      header: 'Registrar salida',
      message: `Tiempo: ${this.formatTiempo(resumen.minutosTranscurridos)}\nCosto total: ${costoFormateado}`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar salida',
          handler: () => {
            this.parqueaderoSvc.registrarSalida(sesion.id, vehiculo.tipo);
            this.cargarDatos();
          },
        },
      ],
    });
    await alert.present();
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message, duration: 2500, color, position: 'top',
    });
    await toast.present();
  }
}
