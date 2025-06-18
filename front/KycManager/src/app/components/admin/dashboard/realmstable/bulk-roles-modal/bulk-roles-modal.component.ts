import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppLogicService } from '../../../../../services/app.logic.service';


interface UserWithRoles {
  id: string;
  username: string;
  email?: string;
  assignedRoles?: any[];
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

  availableRoles: any[] = [];
  selectedRoles: any[] = [];
  assignedRolesByUser: Map<string, any[]> = new Map();

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

      for (const user of this.users) {
        const raw = await this.appLogicService.getUserRoles(this.realm, user.id);
        const roles = this.normalizeUser(raw);
        this.assignedRolesByUser.set(user.id, roles);
        user['assignedRoles'] = roles;
      }
    } catch (e) {
      console.error(e);
      this.error = 'Failed to load roles.';
    } finally {
      this.loadingRoles = false;
    }
  }

  normalizeAvailable(raw: any): any[] {
    const realmRoles = (raw.realmRoles || []).map((r: any) => ({ ...r, type: 'realm' }));
    const clientRoles = Object.entries(raw.clientRoles || {}).flatMap(([client, roles]: [string, any]) =>
      (roles as any[]).map(role => ({ ...role, type: `client:${client}` }))
    );
    return [...realmRoles, ...clientRoles];
  }

  normalizeUser(raw: any): any[] {
    const realm = (raw.realmMappings || []).map((r: any) => ({ ...r, type: 'realm' }));
    const clients = Object.entries(raw.clientMappings || {}).flatMap(
      ([client, data]: [string, any]) => data.mappings.map((r: any) => ({ ...r, type: `client:${client}` }))
    );
    return [...realm, ...clients];
  }

  getClientIds(): string[] {
    return Array.from(new Set(this.availableRoles.filter(r => r.type.startsWith('client:')).map(r => r.type.split(':')[1])));
  }

  filteredAvailableRoles() {
    return this.availableRoles.filter(role =>
      (!this.selectedTypeFilter || role.type === this.selectedTypeFilter) &&
      (!this.roleSearchTerm || role.name.toLowerCase().includes(this.roleSearchTerm.toLowerCase()))
    );
  }

  paginatedRoles() {
    const start = (this.currentPage - 1) * this.rolesPerPage;
    return this.filteredAvailableRoles().slice(start, start + this.rolesPerPage);
  }

  totalPages() {
    return Math.ceil(this.filteredAvailableRoles().length / this.rolesPerPage);
  }

  filteredUsers() {
    return this.users.filter(u =>
      !this.userSearchTerm || u.username.toLowerCase().includes(this.userSearchTerm.toLowerCase())
    );
  }

  paginatedUsers() {
    const start = (this.userPage - 1) * this.usersPerPage;
    return this.filteredUsers().slice(start, start + this.usersPerPage);
  }

  totalUserPages() {
    return Math.ceil(this.filteredUsers().length / this.usersPerPage);
  }

  isRoleSelected(role: any): boolean {
    return this.selectedRoles.some(r => r.name === role.name && r.type === role.type);
  }

  toggleSelectRole(role: any) {
    if (this.isRoleSelected(role)) {
      this.selectedRoles = this.selectedRoles.filter(r => !(r.name === role.name && r.type === role.type));
    } else {
      this.selectedRoles.push(role);
    }
  }

  sanitizeRoles(roles: any[]): any[] {
    return roles.map(role => ({ id: role.id, name: role.name, type: role.type }));
  }

  async submitSelectedRoles() {
    this.processing = true;
    this.error = null;
    try {
      for (const user of this.users) {
        const currentRoles = this.assignedRolesByUser.get(user.id) || [];
        const rolesToAdd = this.selectedRoles.filter(r => !currentRoles.some(cr => cr.name === r.name && cr.type === r.type));
        const rolesToRemove = currentRoles.filter(r => !this.selectedRoles.some(sr => sr.name === r.name && sr.type === r.type));

        if (rolesToRemove.length) {
          await this.appLogicService.removeRolesFromUser(this.realm, user.id, this.sanitizeRoles(rolesToRemove));
        }
        if (rolesToAdd.length) {
          await this.appLogicService.addRolesToUser(this.realm, user.id, this.sanitizeRoles(rolesToAdd));
        }
      }
      await this.loadAll();
      this.rolesUpdated.emit();
    } catch (e) {
      console.error(e);
      this.error = 'Failed to update roles.';
    } finally {
      this.processing = false;
    }
  }

  onClose() {
    this.close.emit();
  }
}
