import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../../services/authentication.service';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, LoadingSpinnerComponent],
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading: boolean = false;
  showPassword: boolean = false; // Needed for toggle functionality

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthenticationService,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(5)]],
    });
  }

  toggleShowPassword(): void {
    this.showPassword = !this.showPassword;
  }

  public async Submit() {
    if (this.loginForm.invalid) {
      const usernameErrors = this.loginForm.controls['username'].errors;
      const passwordErrors = this.loginForm.controls['password'].errors;

      if (passwordErrors?.['minlength']) {
        alert('Password must be at least 8 characters long');
      }
      if (usernameErrors?.['required']) {
        alert('Username is required');
      }
      if (passwordErrors?.['required']) {
        alert('Password is required');
      }
      return;
    }

    this.isLoading = true;
    const formData = this.loginForm.value;
    try {
      await this.login(formData.username, formData.password);
    } catch (error) {
      console.error('Error during login:', error);
      alert('An error occurred during login');
    } finally {
      this.isLoading = false;
    }
  }

  private async login(username: string, password: string): Promise<void> {
    try {
      await this.authService.login(username, password);
      this.router.navigate(['/kyc/realms']).then(() => {
        window.location.reload();
      });
    } catch (error) {
      throw error;
    }
  }
}
