import { Injectable } from '@angular/core';
import { AuthTokens } from './auth.models';

const KEY_ACCESS = 'seed_access_token';
const KEY_REFRESH = 'seed_refresh_token';
const KEY_TOKEN_TYPE = 'seed_token_type';
const KEY_SESSION='mybetlive_admin_session';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  setTokens(tokens: AuthTokens, preserveSession=false): void {
    const session=preserveSession?this.getSessionId():null;
    localStorage.setItem(KEY_ACCESS, tokens.accessToken);
    localStorage.setItem(KEY_REFRESH, tokens.refreshToken);
    localStorage.setItem(KEY_TOKEN_TYPE, tokens.tokenType || 'Bearer');
    localStorage.setItem(KEY_SESSION,session||crypto.randomUUID());
  }

  clear(): void {
    localStorage.removeItem(KEY_ACCESS);
    localStorage.removeItem(KEY_REFRESH);
    localStorage.removeItem(KEY_TOKEN_TYPE);
    localStorage.removeItem(KEY_SESSION);
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
  getSessionId():string|null {
    if(!this.hasAccessToken())return null;
    let session=localStorage.getItem(KEY_SESSION);
    if(!session){session=crypto.randomUUID();localStorage.setItem(KEY_SESSION,session);}
    return session;
  }
}
