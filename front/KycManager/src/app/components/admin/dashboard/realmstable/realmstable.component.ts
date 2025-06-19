import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { from } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AppLogicService } from '../../../../services/app.logic.service';
import { UserRolesModalComponent } from './roles-modal/roles-modal.component';
import { BulkUserRolesModalComponent } from './bulk-roles-modal/bulk-roles-modal.component';
import { User } from '../../../../models/user.model';
import { MatIconModule } from '@angular/material/icon';
import { Role } from '../../../../models/role.model';
import { UserWithRoles } from './bulk-roles-modal/bulk-roles-modal.component';
import { UserInfoCardComponent } from "./user-info-card/user-info-card.component";


@Component({
  selector: 'app-realmstable',
  standalone: true,
  imports: [CommonModule, FormsModule, UserRolesModalComponent, BulkUserRolesModalComponent, MatIconModule, UserInfoCardComponent],
  templateUrl: './realmstable.component.html',
  styleUrls: ['./realmstable.component.css'],
})
export class RealmstableComponent implements OnInit {

  // Realms data and search
  realms: string[] = [];
  filteredRealms: string[] = [];
  searchTerm: string = '';
  page: number = 1;
  pageSize: number = 12;
  bulkRolesModalOpen = false;
  // Selected realm and users
  selectedRealm: string | null = null;
  users: UserWithRoles[] = [];
  filteredUsers: UserWithRoles[] = [];
  userSearchTerm: string = '';
  userPage: number = 1;
  userPageSize: number = 5;

  loadingUsers: boolean = false;
  usersError: string | null = null;
 // For role editing modal
  editingUser: UserWithRoles| null = null;
  displayUser : UserWithRoles | null = null;

  // Open bulk roles modal
  openBulkRolesModal() {
    this.bulkRolesModalOpen = true;
  }

  // Close bulk roles modal
  closeBulkRolesModal() {
    this.bulkRolesModalOpen = false;
  }

  // Check if any user is selected
  hasSelectedUsers(): boolean {
    return this.filteredUsers.some(u => u.selected);
  }

  // Select/deselect all visible users
  toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.paginatedUsers.forEach(u => (u.selected = checked));
  }

  // Optionally update "select all" checkbox state or other logic
  onUserSelectionChange(user: UserWithRoles) {
    // you can add logic here if needed, e.g. updating select all checkbox state
  }

  // Get selected users array for modal input
  get selectedUsersForBulk() {
    return this.filteredUsers.filter(u => u.selected);
  }
  // When user clicks edit button for roles
  onEditUserRoles(user: UserWithRoles) {
    this.editingUser = user;
  }


  openUserInfoCard(user: UserWithRoles) {
    this.displayUser = user;
  }

  closeRolesModal() {
    this.editingUser = null;
  }

  // Optionally refresh users or roles when roles updated:
  onRolesUpdated() {
    if (this.selectedRealm && this.editingUser) {
      // Reload users or user roles if needed
      this.loadUsers(this.selectedRealm);
    }
  }

  onUserInfoCardOpen(user: UserWithRoles) {
    this.displayUser = user;
  }

  onUserInfoCardClose() {
    this.displayUser = null;
  }

  constructor(private appLogicService: AppLogicService) {}

  ngOnInit(): void {
    this.getRealms();
  }

  // Realms methods
  getRealms() {
    from(this.appLogicService.getRealms()).subscribe((data) => {
      this.realms = data || [];
      this.applyFilter();
    });
  }

  applyFilter() {
    const term = this.searchTerm.trim().toLowerCase();
    if (term === '') {
      this.filteredRealms = [...this.realms];
    } else {
      this.filteredRealms = this.realms.filter((r) =>
        r.toLowerCase().includes(term)
      );
    }
    this.page = 1;
  }

  get paginatedRealms(): string[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredRealms.slice(start, start + this.pageSize);
  }

  totalPages(): number {
    return Math.ceil(this.filteredRealms.length / this.pageSize);
  }

  goToPage(n: number) {
    if (n < 1 || n > this.totalPages()) return;
    this.page = n;
  }

  onRealmClick(realm: string) {
    if (this.selectedRealm !== realm) {
      this.selectedRealm = realm;
      this.userSearchTerm = '';
      this.userPage = 1;
      this.users = [];
      this.filteredUsers = [];
      this.usersError = null;
      this.loadUsers(realm);
    }
  }

  // Users methods
  loadUsers(realm: string) {
  this.loadingUsers = true;
  this.usersError = null;

  from(this.appLogicService.getUsersInRealm(realm)).subscribe({
    next: (usersData) => {
      const users = usersData || [];

      Promise.all(
        users.map(async (user: any) => {
          const userRolesRaw = await this.appLogicService.getUserRoles(realm, user.id) as any;
          const realmRoles = (userRolesRaw && !Array.isArray(userRolesRaw) && userRolesRaw.realmMappings ? userRolesRaw.realmMappings : []).map((r: any) => ({ ...r, type: 'realm' }));
          const hasClientMappings = userRolesRaw && typeof userRolesRaw === 'object' && !Array.isArray(userRolesRaw) && 'clientMappings' in userRolesRaw && userRolesRaw.clientMappings;
          const clientRoles = hasClientMappings
            ? Object.entries(userRolesRaw.clientMappings).flatMap(
                ([client, data]: [string, any]) =>
                  data.mappings.map((r: any) => ({ ...r, type: `client:${client}` }))
              )
            : [];
          return {
            ...user,
            roles: [...realmRoles, ...clientRoles]
          };
        })
      ).then((usersWithRoles) => {
        this.users = usersWithRoles;
        this.applyUserFilter();
        this.loadingUsers = false;
      });
    },
    error: (err) => {
      this.usersError = 'Failed to load users.';
      this.loadingUsers = false;
    }
  });
}


  applyUserFilter() {
    const term = this.userSearchTerm.trim().toLowerCase();
    if (term === '') {
      this.filteredUsers = [...this.users];
    } else {
      this.filteredUsers = this.users.filter((u) =>
        u.username.toLowerCase().includes(term)
      );
    }
    this.userPage = 1;
  }

  get paginatedUsers(): UserWithRoles[] {
    const start = (this.userPage - 1) * this.userPageSize;
    return this.filteredUsers.slice(start, start + this.userPageSize);
  }

  totalUserPages(): number {
    return Math.ceil(this.filteredUsers.length / this.userPageSize);
  }

  goToUserPage(n: number) {
    if (n < 1 || n > this.totalUserPages()) return;
    this.userPage = n;
  }

  allUsersSelected(): boolean {
    return this.filteredUsers.length > 0 && this.filteredUsers.every(u => u.selected);
  }


}
