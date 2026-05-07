import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
} from '@ionic/angular/standalone';
import QRCode from 'qrcode';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-carnet',
  templateUrl: 'carnet.page.html',
  styleUrls: ['carnet.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
  ],
})
export class CarnetPage implements OnInit {
  @ViewChild('qrCanvas', { static: false }) qrCanvas!: ElementRef<HTMLCanvasElement>;

  get user(): User | null {
    return this.auth.currentUser();
  }

  readonly vigencia = new Date().getFullYear();

  constructor(private auth: AuthService, private router: Router) {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  ngOnInit() {}

  // Se llama cuando la vista ya tiene el canvas en el DOM
  ionViewDidEnter() {
    this.generateQR();
  }

  private generateQR() {
    const user = this.user;
    if (!user || !this.qrCanvas) return;

    // Contenido del QR: JSON con datos del estudiante
    const qrData = JSON.stringify({
      codigo: user.codigo,
      nombre: `${user.nombre} ${user.apellido}`,
      carrera: user.carrera,
      tipo: user.role === 'admin' ? 'Administrativo' : 'Estudiante',
      estado: 'Estudiante activo',
      universidad: 'Fundación Universitaria Konrad Lorenz',
      vigencia: this.vigencia,
    });

    QRCode.toCanvas(this.qrCanvas.nativeElement, qrData, {
      width: 180,
      margin: 1,
      color: {
        dark: '#6B2D8B',  // morado institucional Konrad Lorenz
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  }
}
