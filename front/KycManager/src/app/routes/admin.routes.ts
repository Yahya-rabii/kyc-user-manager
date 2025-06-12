import { Routes } from '@angular/router';
import { DashboardComponent } from '../components/admin/dashboard/dashboard.component';
import { UserstableComponent } from '../components/admin/userstable/userstable.component';
export const ADMIN_ROUTES: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'users', component: UserstableComponent },
];
