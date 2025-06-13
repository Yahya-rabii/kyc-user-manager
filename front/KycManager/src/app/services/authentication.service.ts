import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';
import { User } from '../models/user.model';
import { catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {

  constructor(private httpClient: HttpClient,private router: Router,) {}

  async login(username: string, password: string): Promise<any> {
    const loginUrl = `${environment.AuthapiUrl}${environment.loginEndpoint}`;
    const credentials = { username, password };
    try {
      const response = await this.httpClient
        .post<any>(loginUrl, credentials)
        .toPromise();
      this.setsessionStorage(response);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async logout(): Promise<void> {
    const logoutUrl = `${environment.AuthapiUrl}${environment.logoutEndpoint}`;
    const userId = this.getUserId();
    try {
      const token = sessionStorage.getItem('access_token');
      const headers = new Headers();
      headers.append('Authorization', `Bearer ${token}`);
      const response = await fetch(logoutUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,

        },
        body: JSON.stringify({ userId }),
      });
      if (response.ok) {
        this.clearsessionStorage();
        this.router.navigate(['/login']).then();
      } else {
        console.error('Error logging out:', response.statusText);
        this.clearsessionStorage();
        this.router.navigate(['/login']).then();
      }
    } catch (error) {
      this.clearsessionStorage();
      console.error('Error logging out:', error);
    }
  }

  isLoggedIn(): boolean {
    const accessToken = sessionStorage.getItem('access_token');
    console.log('the user is logged in service:', accessToken !== null);
    return accessToken !== null;
  }

  getUserId(): string {
    const accessToken = sessionStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('No access token found in session storage');
    }
    const tokenParts = accessToken.split('.');
    if (tokenParts.length < 2) {
      throw new Error('Invalid JWT token');
    }
    const encodedPayload = tokenParts[1];
    const decodedPayload = atob(
      encodedPayload.replace(/-/g, '+').replace(/_/g, '/'),
    );
    const payloadJson = JSON.parse(decodedPayload);
    return payloadJson.sub;
  }

  public setsessionStorage(response: any): void {
  const now = Date.now();
  const expiresInMs = now + response.expires_in * 1000;
  const refreshExpiresInMs = now + response.refresh_expires_in * 1000;

  sessionStorage.setItem('access_token', response.access_token);
  sessionStorage.setItem('refresh_token', response.refresh_token);
  sessionStorage.setItem('expires_at', expiresInMs.toString());
  sessionStorage.setItem('refresh_expires_at', refreshExpiresInMs.toString());
  sessionStorage.setItem('token_type', response.token_type);
}


  private clearsessionStorage(): void {
    sessionStorage.clear();
  }

}
