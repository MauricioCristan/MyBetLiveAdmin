import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroment/environment';

@Injectable({ providedIn: 'root' })
export class PasswordService {
  private readonly http = inject(HttpClient);

  forgot(email: string): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/auth/password/forgot`, { email });
  }

  reset(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/auth/password/reset`, { token, newPassword });
  }
}
