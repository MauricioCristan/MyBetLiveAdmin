import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../enviroment/environment';

export type OptionDTO<T> = { id: T; label: string };

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly http = inject(HttpClient);

  options(): Observable<OptionDTO<string>[]> {
    return this.http.get<OptionDTO<string>[]>(
      `${environment.apiBaseUrl}/backendless/Permission/options`
    );
  }
}
