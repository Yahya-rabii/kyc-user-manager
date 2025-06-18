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
  assignedRoles: Role[];
  selected?: boolean;
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
  // Instead of selectedRoles globally, we keep track of selected roles on all users
  selectedTypeFilter = '';
  roleSearchTerm = '';
  userSearchTerm = '';
  currentPage = 1;
  rolesPerPage = 5;
  userPage = 1;
  usersPerPage = 5;

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

      // Load assigned roles per user
      for (const user of this.users) {
        const raw = await this.appLogicService.getUserRoles(this.realm, user.id);
        const roles = this.normalizeUser(raw);
        user.assignedRoles = roles;
      }
    } catch (e) {
      console.error(e);
      this.error = 'Failed to load roles.';
    } finally {
      this.loadingRoles = false;
    }
  }

  normalizeAvailable(raw: any): Role[] {
    const realmRoles: Role[] = (raw.realmRoles || []).map((r: any) => ({
      ...r,
      type: 'realm'
    }));
    const clientRoles: Role[] = Object.entries(raw.clientRoles || {}).flatMap(
      ([client, roles]: [string, any]) =>
        (roles as any[]).map(role => ({ ...role, type: `client:${client}` }))
    );
    return [...realmRoles, ...clientRoles];
  }

  normalizeUser(raw: any): Role[] {
    const realm: Role[] = (raw.realmMappings || []).map((r: any) => ({
      ...r,
      type: 'realm'
    }));
    const clients: Role[] = Object.entries(raw.clientMappings || {}).flatMap(
      ([client, data]: [string, any]) =>
        data.mappings.map((r: any) => ({ ...r, type: `client:${client}` }))
    );
    return [...realm, ...clients];
  }

  getClientIds(): string[] {
    return Array.from(
      new Set(
        this.availableRoles
          .filter(r => r.type.startsWith('client:'))
          .map(r => r.type.split(':')[1])
      )
    );
  }

  filteredAvailableRoles(): Role[] {
    return this.availableRoles.filter(
      role =>
        (!this.selectedTypeFilter || role.type === this.selectedTypeFilter) &&
        (!this.roleSearchTerm ||
          role.name.toLowerCase().includes(this.roleSearchTerm.toLowerCase()))
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
    return this.users.filter(u =>
      !this.userSearchTerm ||
      u.username.toLowerCase().includes(this.userSearchTerm.toLowerCase())
    );
  }

  paginatedUsers(): UserWithRoles[] {
    const start = (this.userPage - 1) * this.usersPerPage;
    return this.filteredUsers().slice(start, start + this.usersPerPage);
  }

  totalUserPages(): number {
    return Math.ceil(this.filteredUsers().length / this.usersPerPage);
  }

  /** Checks if this role is selected by ALL users (bulk selection) */
  isBulkRoleSelected(role: Role): boolean {
    // If every user has this role assigned, then role is selected bulk
    return this.users.every(user =>
      user.assignedRoles.some(r => r.name === role.name && r.type === role.type)
    );
  }

  /** Toggle role for ALL users at once */
  async toggleBulkRole(role: Role) {
    this.processing = true;
    this.error = null;
    try {
      if (this.isBulkRoleSelected(role)) {
        // Remove role from ALL users
        await Promise.all(
          this.users.map(user =>
            this.removeRoleFromUser(user, role, true /*silent*/)
          )
        );
      } else {
        // Add role to ALL users
        await Promise.all(
          this.users.map(user =>
            this.addRoleToUser(user, role, true /*silent*/)
          )
        );
      }
    } catch (e) {
      console.error(e);
      this.error = 'Failed to update roles.';
    } finally {
      this.processing = false;
    }
  }

  /** Remove a role from a single user with optional silent flag to avoid multiple reloads */
  async removeRoleFromUser(user: UserWithRoles, role: Role, silent = false) {
    if (!user.assignedRoles.find(r => r.name === role.name && r.type === role.type)) {
      return; // role not assigned
    }

    if (!silent) this.processing = true;
    this.error = null;

    try {
      await this.appLogicService.removeRolesFromUser(this.realm, user.id, [
        this.sanitizeRole(role)
      ]);
      // Update UI
      user.assignedRoles = user.assignedRoles.filter(
        r => !(r.name === role.name && r.type === role.type)
      );
      if (!silent) this.rolesUpdated.emit();
    } catch (e) {
      console.error(e);
      this.error = 'Failed to remove role from user.';
    } finally {
      if (!silent) this.processing = false;
    }
  }

  /** Add a role to a single user */
  async addRoleToUser(user: UserWithRoles, role: Role, silent = false) {
    if (user.assignedRoles.find(r => r.name === role.name && r.type === role.type)) {
      return; // already assigned
    }

    if (!silent) this.processing = true;
    this.error = null;

    try {
      await this.appLogicService.addRolesToUser(this.realm, user.id, [
        this.sanitizeRole(role)
      ]);
      user.assignedRoles.push(role);
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

  onClose() {
    this.close.emit();
  }


}
