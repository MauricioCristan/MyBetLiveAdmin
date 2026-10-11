import { Injectable } from '@angular/core';
import { AuthTokens } from './auth.models';

const KEY_ACCESS = 'seed_access_token';
const KEY_REFRESH = 'seed_refresh_token';
const KEY_TOKEN_TYPE = 'seed_token_type';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  setTokens(tokens: AuthTokens): void {
    localStorage.setItem(KEY_ACCESS, tokens.accessToken);
    localStorage.setItem(KEY_REFRESH, tokens.refreshToken);
    localStorage.setItem(KEY_TOKEN_TYPE, tokens.tokenType || 'Bearer');
  }

  clear(): void {
    localStorage.removeItem(KEY_ACCESS);
    localStorage.removeItem(KEY_REFRESH);
    localStorage.removeItem(KEY_TOKEN_TYPE);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(KEY_ACCESS);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(KEY_REFRESH);
  }

  getTokenType(): string {
    return localStorage.getItem(KEY_TOKEN_TYPE) || 'Bearer';
  }

  hasAccessToken(): boolean {
    const t = this.getAccessToken();
    return !!t && t.trim().length > 0;
  }
}
