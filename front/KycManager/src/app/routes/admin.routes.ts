import { Routes } from '@angular/router';
import { DashboardComponent } from '../components/admin/dashboard/dashboard.component';
import { RealmstableComponent } from '../components/admin/dashboard/realmstable/realmstable.component';

export const ADMIN_ROUTES: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'realms', component: RealmstableComponent },
];
