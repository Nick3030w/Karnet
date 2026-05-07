import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    canActivate: [authGuard],
  },
  {
    path: 'carnet',
    loadComponent: () => import('./carnet/carnet.page').then((m) => m.CarnetPage),
    canActivate: [authGuard],
  },
  {
    path: 'parqueadero',
    loadComponent: () => import('./parqueadero/parqueadero.page').then((m) => m.ParqueaderoPage),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
