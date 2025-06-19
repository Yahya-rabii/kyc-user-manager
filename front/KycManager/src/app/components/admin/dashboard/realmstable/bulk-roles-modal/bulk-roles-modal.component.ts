import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppLogicService } from '../../../../../services/app.logic.service';

interface Role {
  id: string;
  name: string;
  type: string; // e.g., 'realm' or 'client:clientId'
}

export interface UserWithRoles {
  id: string;
  username: string;
  email?: string;
  roles: Role[];
  selected?: boolean;
  showActionsMenu?: boolean;
    roleSearchTerm?: string;
}

@Component({
  selector: 'app-bulk-user-roles-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bulk-roles-modal.component.html',
  styleUrls: ['./bulk-roles-modal.component.css']
})
export class BulkUserRolesModalComponent implements OnInit {
  @Input() realm!: string;
  @Input() users: UserWithRoles[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() rolesUpdated = new EventEmitter<void>();

  availableRoles: Role[] = [];
  selectedTypeFilter = '';
  roleSearchTerm = '';
  userSearchTerm = '';
  currentPage = 1;
  rolesPerPage = 10;
  userPage = 1;
  usersPerPage = 10;
  step = 1;

  loadingRoles = false;
  processing = false;
  error: string | null = null;

  constructor(private appLogicService: AppLogicService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  async loadAll() {
    this.loadingRoles = true;
    this.error = null;
    try {
      const availableRaw = await this.appLogicService.getAvailableRoles(this.realm);
      this.availableRoles = this.normalizeAvailable(availableRaw);

      for (const user of this.users) {
        const raw = await this.appLogicService.getUserRoles(this.realm, user.id);
        const roles = this.normalizeUser(raw);
        user.roles = roles;
      }
    } catch (e) {
      console.error(e);
      this.error = 'Failed to load roles.';
    } finally {
      this.loadingRoles = false;
    }
  }

  normalizeAvailable(raw: any): Role[] {
    const realmRoles: Role[] = (raw.realmRoles || []).map((r: any) => ({ ...r, type: 'realm' }));
    const clientRoles: Role[] = Object.entries(raw.clientRoles || {}).flatMap(
      ([client, roles]: [string, any]) =>
        (roles as any[]).map(role => ({ ...role, type: `client:${client}` }))
    );
    return [...realmRoles, ...clientRoles];
  }

  normalizeUser(raw: any): Role[] {
    const realm: Role[] = (raw.realmMappings || []).map((r: any) => ({ ...r, type: 'realm' }));
    const clients: Role[] = Object.entries(raw.clientMappings || {}).flatMap(
      ([client, data]: [string, any]) =>
        data.mappings.map((r: any) => ({ ...r, type: `client:${client}` }))
    );
    return [...realm, ...clients];
  }

  getClientIds(): string[] {
    return Array.from(new Set(this.availableRoles.filter(r => r.type.startsWith('client:')).map(r => r.type.split(':')[1])));
  }

  filteredAvailableRoles(): Role[] {
    return this.availableRoles.filter(
      role => (!this.selectedTypeFilter || role.type === this.selectedTypeFilter) &&
              (!this.roleSearchTerm || role.name.toLowerCase().includes(this.roleSearchTerm.toLowerCase()))
    );
  }

  paginatedRoles(): Role[] {
    const start = (this.currentPage - 1) * this.rolesPerPage;
    return this.filteredAvailableRoles().slice(start, start + this.rolesPerPage);
  }

  totalPages(): number {
    return Math.ceil(this.filteredAvailableRoles().length / this.rolesPerPage);
  }

  filteredUsers(): UserWithRoles[] {
    return this.users.filter(u => !this.userSearchTerm || u.username.toLowerCase().includes(this.userSearchTerm.toLowerCase()));
  }

  paginatedUsers(): UserWithRoles[] {
    const start = (this.userPage - 1) * this.usersPerPage;
    return this.filteredUsers().slice(start, start + this.usersPerPage);
  }

  totalUserPages(): number {
    return Math.ceil(this.filteredUsers().length / this.usersPerPage);
  }

  isBulkRoleSelected(role: Role): boolean {
    return this.users.every(user => user.roles.some(r => r.name === role.name && r.type === role.type));
  }

  async toggleBulkRole(role: Role) {
    this.processing = true;
    this.error = null;
    try {
      if (this.isBulkRoleSelected(role)) {
        await Promise.all(this.users.map(user => this.removeRoleFromUser(user, role, true)));
      } else {
        await Promise.all(this.users.map(user => this.addRoleToUser(user, role, true)));
      }
    } catch (e) {
      console.error(e);
      this.error = 'Failed to update roles.';
    } finally {
      this.processing = false;
    }
  }

  async removeRoleFromUser(user: UserWithRoles, role: Role, silent = false) {
    if (!user.roles.find(r => r.name === role.name && r.type === role.type)) return;
    if (!silent) this.processing = true;
    this.error = null;
    try {
      await this.appLogicService.removeRolesFromUser(this.realm, user.id, [this.sanitizeRole(role)]);
      user.roles = user.roles.filter(r => !(r.name === role.name && r.type === role.type));
      if (!silent) this.rolesUpdated.emit();
    } catch (e) {
      console.error(e);
      this.error = 'Failed to remove role from user.';
    } finally {
      if (!silent) this.processing = false;
    }
  }

  async addRoleToUser(user: UserWithRoles, role: Role, silent = false) {
    if (user.roles.find(r => r.name === role.name && r.type === role.type)) return;
    if (!silent) this.processing = true;
    this.error = null;
    try {
      await this.appLogicService.addRolesToUser(this.realm, user.id, [this.sanitizeRole(role)]);
      user.roles.push(role);
      if (!silent) this.rolesUpdated.emit();
    } catch (e) {
      console.error(e);
      this.error = 'Failed to add role to user.';
    } finally {
      if (!silent) this.processing = false;
    }
  }

  sanitizeRole(role: Role) {
    return { id: role.id, name: role.name, type: role.type };
  }

  onRoleSearchTermChange() {
    this.currentPage = 1;
  }

  onUserSearchTermChange() {
    this.userPage = 1;
  }

  onRoleFilterChange() {
    this.currentPage = 1;
  }

  goToStep(stepNum: number) {
    this.step = stepNum;
  }

  async submitRoles() {
    this.processing = true;
    try {
      for (const user of this.users) {
        await this.appLogicService.updateUserRoles(this.realm, user.id, user.roles.map(r => this.sanitizeRole(r)));
      }
      this.rolesUpdated.emit();
      this.close.emit();
    } catch (e) {
      console.error(e);
      this.error = 'Failed to submit changes.';
    } finally {
      this.processing = false;
    }
  }

  onClose() {
    this.close.emit();
  }
// Step 1: Search + Pagination per user (displayed roles)
roleSearchTermPerUser: string = '';
assignedRolesPerUserPage: number = 5;
assignedRolesPerUserCurrentPage: { [userId: string]: number } = {};

getFilteredRolesForUser(user: UserWithRoles): Role[] {
  return user.roles.filter(role =>
    role.name.toLowerCase().includes(this.roleSearchTermPerUser.toLowerCase())
  );
}

getPaginatedRolesForUser(user: UserWithRoles): Role[] {
  const roles = this.getFilteredRolesForUser(user);
  const currentPage = this.assignedRolesPerUserCurrentPage[user.id] || 1;
  const start = (currentPage - 1) * this.assignedRolesPerUserPage;
  return roles.slice(start, start + this.assignedRolesPerUserPage);
}

getTotalPagesForUser(user: UserWithRoles): number {
  return Math.ceil(this.getFilteredRolesForUser(user).length / this.assignedRolesPerUserPage);
}

changeUserRolePage(userId: string, page: number) {
  this.assignedRolesPerUserCurrentPage[userId] = page;
}
getFilteredRoles(user: UserWithRoles): Role[] {
  const term = user.roleSearchTerm?.toLowerCase() || '';
  return user.roles.filter(role => role.name.toLowerCase().includes(term));
}

}
