import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../enviroment/environment';
import { AuthTokens, LoginRequest } from './auth.models';
import { TokenStorageService } from './token-storage.service';
import { PermissionService } from './permission.service';
import { SessionRenewalService } from './session-renewal.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(TokenStorageService);
  private readonly permissions = inject(PermissionService);
  private readonly renewal=inject(SessionRenewalService);

  login(payload: LoginRequest): Observable<AuthTokens> {
    return this.http
      .post<AuthTokens>(`${environment.apiBaseUrl}/auth/admin/login`, payload)
      .pipe(tap((tokens) => {
        this.storage.setTokens(tokens);
        this.permissions.clear();
      }));
  }

  refresh(): Observable<AuthTokens> {
    return this.renewal.renew(this.storage.getAccessToken());
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

