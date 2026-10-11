import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../enviroment/environment';
import { OperationsView, SettingDTO, SettingUpdatePayload } from '../models/setting.model';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/settings`;

  operations(): Observable<OperationsView> {
    return this.http.get<OperationsView>(environment.apiBaseUrl + '/admin/mybet/operations');
  }

  list(): Observable<SettingDTO[]> {
    return this.http.get<SettingDTO[]>(this.baseUrl);
  }

  update(values: Record<string, string>): Observable<void> {
    const payload: SettingUpdatePayload = { values };
    return this.http.post<void>(this.baseUrl, payload);
  }
}

