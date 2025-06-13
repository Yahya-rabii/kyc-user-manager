import { Component, Renderer2 } from '@angular/core';
import { AuthenticationService } from '../../services/authentication.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { User } from '../../models/user.model';
import { OnInit } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { CercularnavComponent } from '../cercularnav/cercularnav.component';
@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    CercularnavComponent,
  ],
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css'],
})
export class NavBarComponent implements OnInit {
  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private renderer: Renderer2,
  ) {}
  user: User = new User();
  ngOnInit() {

    const drawerNavigation = document.getElementById('drawer-navigation');
    if (drawerNavigation) {
      drawerNavigation.setAttribute('data-drawer-show', 'none');
    }
  }
  islogin: boolean = false;
  isLoggedIn() {
    this.islogin = this.authService.isLoggedIn();
    return this.authService.isLoggedIn();
  }
  login() {
    this.router.navigate(['/login']).then();
  }
  signup() {
    this.router.navigate(['/signup']).then();
  }
  emailVerified: boolean = false;

  logout() {
    this.authService.logout();
  }
  toggleUserDropdown() {
    const dropdownAvatar = document.getElementById('dropdownAvatar');
    if (dropdownAvatar) {
      const isDropdownOpen = dropdownAvatar.classList.contains('hidden');
      this.renderer.setStyle(
        dropdownAvatar,
        'display',
        isDropdownOpen ? 'block' : 'none',
      );
    }
  }
  showSidebar: boolean = false;
  toggleSidebar() {
    if (this.isLoggedIn()) {
      this.showSidebar = !this.showSidebar;
      if (this.showSidebar) {
        document.body.classList.add('sidebar-open');
      } else {
        document.body.classList.remove('sidebar-open');
      }
    }
  }
}
