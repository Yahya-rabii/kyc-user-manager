import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { from } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AppLogicService } from '../../../../services/app.logic.service';
import { UserRolesModalComponent } from './roles-modal/roles-modal.component';
interface User {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

@Component({
  selector: 'app-realmstable',
  standalone: true,
  imports: [CommonModule, FormsModule , UserRolesModalComponent],
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

  // Selected realm and users
  selectedRealm: string | null = null;
  users: User[] = [];
  filteredUsers: User[] = [];
  userSearchTerm: string = '';
  userPage: number = 1;
  userPageSize: number = 5;

  loadingUsers: boolean = false;
  usersError: string | null = null;
 // For role editing modal
  editingUser: User | null = null;

  // When user clicks edit button for roles
  onEditUserRoles(user: User) {
    this.editingUser = user;
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
      next: (data) => {
        this.users = data || [];
        this.applyUserFilter();
        this.loadingUsers = false;
      },
      error: (err) => {
        this.usersError = 'Failed to load users.';
        this.loadingUsers = false;
      },
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

  get paginatedUsers(): User[] {
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
}
