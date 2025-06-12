import { Routes } from '@angular/router';
import { AuthGuard } from '../guards/auth.guard';
import { NoAuthGuard } from '../guards/No.auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { UserGuard } from '../guards/user.guard';
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
    path: 'home',
    loadComponent: () =>
      import('../components/home/home.component').then((m) => m.HomeComponent),
    canActivate: [AuthGuard, UserGuard],
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin.routes').then((m) => m.ADMIN_ROUTES),
    canActivate: [AdminGuard],
  },

  { path: '**', redirectTo: 'home' },
];
