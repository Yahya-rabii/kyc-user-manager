import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppLogicService } from '../../../../../services/app.logic.service';

@Component({
  selector: 'app-user-roles-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles-modal.component.html',
  styleUrls: ['./roles-modal.component.css']
})
export class UserRolesModalComponent implements OnInit {
  @Input() realm!: string;
  @Input() user!: { id: string; username: string };
  @Output() close = new EventEmitter<void>();
  @Output() rolesUpdated = new EventEmitter<void>();

  userRoles: any[] = [];
  availableRoles: any[] = [];
  selectedRoles: any[] = [];

  selectedTypeFilter: string = '';
  roleSearchTerm: string = '';

  currentPage = 1;
  rolesPerPage = 5;

  loadingRoles = false;
  processing = false;
  error: string | null = null;

  constructor(private appLogicService: AppLogicService) {}

  ngOnInit(): void {
    this.loadAll();
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

  private normalizeUser(raw: any): any[] {
    const realm = (raw.realmMappings || []).map((r: any) => ({
      ...r,
      type: 'realm'
    }));
    const clients = Object.entries(raw.clientMappings || {}).flatMap(
      ([client, data]: [string, any]) =>
        data.mappings.map((r: any) => ({
          ...r,
          type: `client:${client}`
        }))
    );
    return [...realm, ...clients];
  }

  async loadAll() {
    this.loadingRoles = true;
    this.error = null;
    try {
      const [userRaw, availableRaw] = await Promise.all([
        this.appLogicService.getUserRoles(this.realm, this.user.id),
        this.appLogicService.getAvailableRoles(this.realm),
      ]);

      this.userRoles = this.normalizeUser(userRaw);
      this.availableRoles = this.normalizeAvailable(availableRaw);
      this.selectedRoles = [...this.userRoles];
    } catch (e) {
      console.error(e);
      this.error = 'Failed to load roles.';
    } finally {
      this.loadingRoles = false;
    }
  }

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

  filteredAvailableRoles() {
    return this.availableRoles.filter(role =>
      (!this.selectedTypeFilter || role.type === this.selectedTypeFilter) &&
      (!this.roleSearchTerm ||
        role.name.toLowerCase().includes(this.roleSearchTerm.toLowerCase()))
    );
  }

  paginatedRoles() {
    const start = (this.currentPage - 1) * this.rolesPerPage;
    return this.filteredAvailableRoles().slice(start, start + this.rolesPerPage);
  }

  totalPages(): number {
    return Math.ceil(this.filteredAvailableRoles().length / this.rolesPerPage);
  }

  isRoleSelected(role: any): boolean {
    return this.selectedRoles.some(
      r => r.name === role.name && r.type === role.type
    );
  }

  toggleSelectRole(role: any) {
    if (this.isRoleSelected(role)) {
      this.selectedRoles = this.selectedRoles.filter(
        r => !(r.name === role.name && r.type === role.type)
      );
    } else {
      this.selectedRoles.push(role);
    }
  }

 private sanitizeRoles(roles: any[]): { id: string; name: string; type: string }[] {
  return roles.map(role => ({
    id: role.id,
    name: role.name,
    type: role.type
  }));
}

async submitSelectedRoles() {
  this.processing = true;
  this.error = null;
  try {
    const rolesToRemove = this.userRoles.filter(
      r => !this.selectedRoles.some(
        sr => sr.name === r.name && sr.type === r.type
      )
    );
    const rolesToAdd = this.selectedRoles.filter(
      r => !this.userRoles.some(
        ur => ur.name === r.name && ur.type === r.type
      )
    );

    if (rolesToRemove.length > 0) {
      await this.appLogicService.removeRolesFromUser(
        this.realm,
        this.user.id,
        this.sanitizeRoles(rolesToRemove)
      );
    }

    if (rolesToAdd.length > 0) {
      await this.appLogicService.addRolesToUser(
        this.realm,
        this.user.id,
        this.sanitizeRoles(rolesToAdd)
      );
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

  assignedRolesSearchTerm: string = '';
assignedCurrentPage: number = 1;
assignedRolesPerPage: number = 5;

get filteredAssignedRoles(): any[] {
  return this.selectedRoles.filter(role =>
    role.name.toLowerCase().includes(this.assignedRolesSearchTerm.toLowerCase())
  );
}

get paginatedAssignedRoles(): any[] {
  const start = (this.assignedCurrentPage - 1) * this.assignedRolesPerPage;
  return this.filteredAssignedRoles.slice(start, start + this.assignedRolesPerPage);
}

get assignedTotalPages(): number {
  return Math.ceil(this.filteredAssignedRoles.length / this.assignedRolesPerPage);
}

goToAssignedPage(page: number) {
  this.assignedCurrentPage = page;
}

}
