import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  imports: [
    FormsModule,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonSpinner,
  ],
})
export class LoginPage {
  email = '';
  password = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  async onLogin() {
    if (!this.email || !this.password) {
      await this.showToast('Por favor completa todos los campos.', 'warning');
      return;
    }

    this.loading = true;
    // Simula un pequeño delay como si fuera una llamada a API
    await new Promise((r) => setTimeout(r, 600));

    const result = this.auth.login(this.email.trim(), this.password);
    this.loading = false;

    if (result.success) {
      this.router.navigate(['/home'], { replaceUrl: true });
    } else {
      await this.showToast(result.message, 'danger');
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'top',
    });
    await toast.present();
  }
}
