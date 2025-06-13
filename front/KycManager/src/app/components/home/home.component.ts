import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnimationSnowflakeComponent } from '../../animations/animation-snowflake/animation-snowflake.component';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    AnimationSnowflakeComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  constructor() {}
}
