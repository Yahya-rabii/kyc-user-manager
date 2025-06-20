import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, interval } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';
@Injectable({
  providedIn: 'root',
})
export class TokenRefreshService {
  private readonly refreshTokenInterval = 60000;
  private readonly tokenExpirationThreshold = 300000;
  constructor(private httpClient: HttpClient) {
    this.startRefreshTokenTimer();
  }
  private startRefreshTokenTimer() {
    interval(this.refreshTokenInterval)
      .pipe(
        tap(() => console.log('Checking token expiration')),
        switchMap(() => this.checkTokenExpiration()),
      )
      .subscribe(
        () => {
          console.log('Token check complete');
        },
        (error) => {
          console.error('Error in token check interval:', error);
        },
      );
  }
  private checkTokenExpiration(): Observable<void> {
  return new Observable<void>((observer) => {
    const expiresAtStr = sessionStorage.getItem('expires_at');
    const currentTime = Date.now();

    if (
      expiresAtStr &&
      currentTime >= parseInt(expiresAtStr) - this.tokenExpirationThreshold
    ) {
      const refreshToken = sessionStorage.getItem('refresh_token');
      if (refreshToken) {
        this.refreshAccessToken(refreshToken).then(
          (response) => {
            const now = Date.now();
            const newExpiresAt = now + response.expires_in * 1000;
            const newRefreshExpiresAt = now + response.refresh_expires_in * 1000;

            sessionStorage.setItem('access_token', response.access_token);
            sessionStorage.setItem('refresh_token', response.refresh_token);
            sessionStorage.setItem('expires_at', newExpiresAt.toString());
            sessionStorage.setItem('refresh_expires_at', newRefreshExpiresAt.toString());
            sessionStorage.setItem('token_type', response.token_type);

            console.log('Token refreshed successfully');
            observer.next();
            observer.complete();
          },
          (error) => {
            console.error('Error refreshing token:', error);
            observer.error(error);
          },
        );
      } else {
        console.log('No refresh token found');
        observer.complete();
      }
    } else {
      observer.complete();
    }
  });
}

  private async refreshAccessToken(refreshToken: string): Promise<any> {
  const refreshTokenUrl = `${environment.AuthapiUrl}${environment.refreshEndpoint}`;
  const response = await fetch(refreshTokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (response.ok) {
    return response.json();
  } else {
    throw new Error(`Error refreshing token: ${response.statusText}`);
  }
}

}
