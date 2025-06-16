// bulk-user-roles-modal.component.ts
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppLogicService } from '../../../../../services/app.logic.service';
import { User } from '../../../../../models/user.model';

@Component({
  selector: 'app-bulk-user-roles-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bulk-roles-modal.component.html',
  styleUrls: ['./bulk-roles-modal.component.css']
})
export class BulkUserRolesModalComponent implements OnInit {
  @Input() realm!: string;
  @Output() close = new EventEmitter<void>();
  @Output() rolesUpdated = new EventEmitter<void>();
  @Input() users: User[] = [];
  availableRoles: any[] = [];

  selectedUsers: { id: string; username: string }[] = [];
  selectedRoles: any[] = [];

  // Filters and pagination for users
  userSearchTerm: string = '';
  currentUserPage = 1;
  usersPerPage = 5;

  // Filters and pagination for roles
  selectedTypeFilter: string = '';
  roleSearchTerm: string = '';
  currentRolePage = 1;
  rolesPerPage = 5;

  loading = false;
  processing = false;
  error: string | null = null;

  constructor(private appLogicService: AppLogicService) {}

  async ngOnInit() {
    await this.loadAll();
  }

  async loadAll() {
    this.loading = true;
    this.error = null;

    try {
      // Load all users
      this.users = await this.appLogicService.getUsersInRealm(this.realm);

      // Load roles (similar to your previous logic)
      const rawRoles = await this.appLogicService.getAvailableRoles(this.realm);
      this.availableRoles = this.normalizeAvailable(rawRoles);

      // Reset selections and pages
      this.selectedUsers = [];
      this.selectedRoles = [];
      this.currentUserPage = 1;
      this.currentRolePage = 1;
    } catch (e) {
      console.error(e);
      this.error = 'Failed to load users or roles.';
    } finally {
      this.loading = false;
    }
  }

  private normalizeAvailable(raw: any): any[] {
    const realmRoles = (raw.realmRoles || []).map((r: any) => ({
      ...r,
      type: 'realm'
    }));
    const clientRoles = Object.entries(raw.clientRoles || {}).flatMap(
      ([client, roles]) =>
        (roles as any[]).map(role => ({
          ...role,
          type: `client:${client}`
        }))
    );
    return [...realmRoles, ...clientRoles];
  }

  // --- Users filtering & pagination ---
  filteredUsers() {
    return this.users.filter(user =>
      !this.userSearchTerm ||
      user.username.toLowerCase().includes(this.userSearchTerm.toLowerCase())
    );
  }

  paginatedFilteredUsers() {
    const start = (this.currentUserPage - 1) * this.usersPerPage;
    return this.filteredUsers().slice(start, start + this.usersPerPage);
  }

  totalUserPages() {
    return Math.max(1, Math.ceil(this.filteredUsers().length / this.usersPerPage));
  }

  changeUserPage(page: number) {
    if (page >= 1 && page <= this.totalUserPages()) {
      this.currentUserPage = page;
    }
  }

  toggleSelectUser(user: { id: string; username: string }) {
    const exists = this.selectedUsers.some(u => u.id === user.id);
    if (exists) {
      this.selectedUsers = this.selectedUsers.filter(u => u.id !== user.id);
    } else {
      this.selectedUsers.push(user);
    }
  }

  isUserSelected(user: { id: string; username: string }): boolean {
    return this.selectedUsers.some(u => u.id === user.id);
  }

  // --- Roles filtering & pagination ---
  getClientIds(): string[] {
    return Array.from(
      new Set(
        this.availableRoles
          .map(r => r.type)
          .filter(t => t.startsWith('client:'))
          .map(t => t.split(':')[1])
      )
    );
  }

  filteredRoles() {
    return this.availableRoles.filter(role =>
      (!this.selectedTypeFilter || role.type === this.selectedTypeFilter) &&
      (!this.roleSearchTerm ||
        role.name.toLowerCase().includes(this.roleSearchTerm.toLowerCase()))
    );
  }

  paginatedRoles() {
    const start = (this.currentRolePage - 1) * this.rolesPerPage;
    return this.filteredRoles().slice(start, start + this.rolesPerPage);
  }

  totalRolePages() {
    return Math.max(1, Math.ceil(this.filteredRoles().length / this.rolesPerPage));
  }

  changeRolePage(page: number) {
    if (page >= 1 && page <= this.totalRolePages()) {
      this.currentRolePage = page;
    }
  }

  toggleSelectRole(role: any) {
    const exists = this.selectedRoles.some(
      r => r.name === role.name && r.type === role.type
    );
    if (exists) {
      this.selectedRoles = this.selectedRoles.filter(
        r => !(r.name === role.name && r.type === role.type)
      );
    } else {
      this.selectedRoles.push(role);
    }
  }

  isRoleSelected(role: any): boolean {
    return this.selectedRoles.some(
      r => r.name === role.name && r.type === role.type
    );
  }

  private sanitizeRoles(roles: any[]): { id: string; name: string; type: string }[] {
    return roles.map(role => ({
      id: role.id,
      name: role.name,
      type: role.type
    }));
  }

  async bulkAddRoles() {
    if (this.selectedUsers.length === 0 || this.selectedRoles.length === 0) return;
    this.processing = true;
    this.error = null;
    try {
      const sanitizedRoles = this.sanitizeRoles(this.selectedRoles);

      for (const user of this.selectedUsers) {
        await this.appLogicService.addRolesToUser(this.realm, user.id, sanitizedRoles);
      }

      this.rolesUpdated.emit();
      // Optionally reload users/roles state if needed here
    } catch (e) {
      console.error(e);
      this.error = 'Failed to add roles to users.';
    } finally {
      this.processing = false;
    }
  }

  async bulkRemoveRoles() {
    if (this.selectedUsers.length === 0 || this.selectedRoles.length === 0) return;
    this.processing = true;
    this.error = null;
    try {
      const sanitizedRoles = this.sanitizeRoles(this.selectedRoles);

      for (const user of this.selectedUsers) {
        await this.appLogicService.removeRolesFromUser(this.realm, user.id, sanitizedRoles);
      }

      this.rolesUpdated.emit();
      // Optionally reload users/roles state if needed here
    } catch (e) {
      console.error(e);
      this.error = 'Failed to remove roles from users.';
    } finally {
      this.processing = false;
    }
  }

  onClose() {
    this.close.emit();
  }
}
