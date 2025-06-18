import { Routes } from '@angular/router';
import { AuthGuard } from '../guards/auth.guard';
import { NoAuthGuard } from '../guards/No.auth.guard';
export const routes: Routes = [

  {
    path: 'login',
    loadComponent: () =>
      import('../components/login/login.component').then(
        (m) => m.LoginComponent,
      ),
    canActivate: [NoAuthGuard],
  },

  {
    path: 'kyc',
    loadChildren: () => import('./kyc.routes').then((m) => m.ADMIN_ROUTES),
    canActivate: [AuthGuard],
  },

  { path: '**', redirectTo: '/kyc/realms' },


];
