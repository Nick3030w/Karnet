import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonButtons,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cardOutline,
  logOutOutline,
  personCircleOutline,
  chevronForwardOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  warningOutline,
  timeOutline,
  informationCircleOutline,
  calendarOutline,
  bookOutline,
  gameControllerOutline,
  laptopOutline,
  lockClosedOutline,
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    NgClass,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonButtons,
  ],
})
export class HomePage {
  get user(): User | null {
    return this.auth.currentUser();
  }

  get estaActivo(): boolean {
    return this.user?.estadoBiblioteca?.estado === 'activo';
  }

  get estadoClase(): string {
    return `estado-${this.user?.estadoBiblioteca?.estado ?? 'activo'}`;
  }

  get estadoIcono(): string {
    const mapa: Record<string, string> = {
      activo:     'checkmark-circle-outline',
      suspendido: 'close-circle-outline',
      deuda:      'warning-outline',
      vencido:    'time-outline',
    };
    return mapa[this.user?.estadoBiblioteca?.estado ?? 'activo'];
  }

  get estadoTitulo(): string {
    const mapa: Record<string, string> = {
      activo:     'Habilitado para préstamos',
      suspendido: 'Cuenta suspendida',
      deuda:      'Pago pendiente',
      vencido:    'Préstamo vencido',
    };
    return mapa[this.user?.estadoBiblioteca?.estado ?? 'activo'];
  }

  get estadoSubtitulo(): string {
    const mapa: Record<string, string> = {
      activo:     'Puedes solicitar material en biblioteca y ludoteca.',
      suspendido: 'No puedes realizar nuevos préstamos en este momento.',
      deuda:      'Regulariza tu situación en la biblioteca para continuar.',
      vencido:    'Tienes material con fecha de devolución vencida.',
    };
    return mapa[this.user?.estadoBiblioteca?.estado ?? 'activo'];
  }

  get barWidth(): number {
    const prestados = this.user?.estadoBiblioteca?.itemsPrestados ?? 0;
    const limite    = this.user?.estadoBiblioteca?.limitePrestamos ?? 5;
    return Math.round((prestados / limite) * 100);
  }

  constructor(
    private auth: AuthService,
    private router: Router,
    private alertCtrl: AlertController
  ) {
    addIcons({
      cardOutline,
      logOutOutline,
      personCircleOutline,
      chevronForwardOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      warningOutline,
      timeOutline,
      informationCircleOutline,
      calendarOutline,
      bookOutline,
      gameControllerOutline,
      laptopOutline,
      lockClosedOutline,
    });
  }

  goToCarnet() {
    this.router.navigate(['/carnet']);
  }

  async confirmLogout() {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar sesión',
      message: '¿Estás seguro de que deseas salir?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salir',
          role: 'destructive',
          handler: () => {
            this.auth.logout();
            this.router.navigate(['/login'], { replaceUrl: true });
          },
        },
      ],
    });
    await alert.present();
  }
}
