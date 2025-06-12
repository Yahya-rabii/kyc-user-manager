import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserstableComponent } from '../admin/userstable/userstable.component';
import { AnimationSnowflakeComponent } from '../../animations/animation-snowflake/animation-snowflake.component';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    UserstableComponent,
    AnimationSnowflakeComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  constructor() {}
}
