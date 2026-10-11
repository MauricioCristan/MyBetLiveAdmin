import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../enviroment/environment';
import { AuthTokens, LoginRequest } from './auth.models';
import { TokenStorageService } from './token-storage.service';
import { PermissionService } from './permission.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(TokenStorageService);
  private readonly permissions = inject(PermissionService);

  login(payload: LoginRequest): Observable<AuthTokens> {
    return this.http
      .post<AuthTokens>(`${environment.apiBaseUrl}/auth/login`, payload)
      .pipe(tap((tokens) => {
        this.storage.setTokens(tokens);
        this.permissions.clear();
      }));
  }

  refresh(): Observable<AuthTokens> {
    const refreshToken = this.storage.getRefreshToken();
    if (!refreshToken) {
      // No hacemos throw aquí para no romper flujos; quien llame decide.
      return this.http.post<AuthTokens>(`${environment.apiBaseUrl}/auth/refresh`, { refreshToken: '' });
    }

    return this.http
      .post<AuthTokens>(`${environment.apiBaseUrl}/auth/refresh`, { refreshToken })
      .pipe(tap((tokens) => this.storage.setTokens(tokens)));
  }

  logout(): Observable<void> {
    const refreshToken = this.storage.getRefreshToken() || '';
    // aunque falle backend, limpiamos tokens localmente
    return this.http.post<void>(`${environment.apiBaseUrl}/auth/logout`, { refreshToken }).pipe(
      tap(() => {
        this.storage.clear();
        this.permissions.clear();
      })
    );
  }

  logoutLocal(): void {
    this.storage.clear();
    this.permissions.clear();
  }

  isLoggedIn(): boolean {
    return this.storage.hasAccessToken();
  }
}

