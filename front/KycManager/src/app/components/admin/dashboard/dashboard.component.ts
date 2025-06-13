import { formatDate } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { CommonModule } from '@angular/common';
import { RealmstableComponent } from './realmstable/realmstable.component';
Chart.register(...registerables);
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [
    CommonModule,
    RealmstableComponent,
  ],
  standalone: true,
})
export class DashboardComponent {}
