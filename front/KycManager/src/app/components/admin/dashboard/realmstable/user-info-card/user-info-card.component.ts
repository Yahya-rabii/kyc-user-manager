import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserWithRoles } from '../bulk-roles-modal/bulk-roles-modal.component';
@Component({
  selector: 'app-user-info-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-info-card.component.html',
  styleUrl: './user-info-card.component.css'
})
export class UserInfoCardComponent {
@Input() user!: UserWithRoles;
 @Input() realm!: string;
  @Output() close = new EventEmitter<void>();
  @Output() rolesUpdated = new EventEmitter<void>();

  constructor( ) {}
}
