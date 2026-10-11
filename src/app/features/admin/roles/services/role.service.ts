import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../enviroment/environment';
import { BackendlessPage, RoleListRow, RoleFormDTO } from '../models/role.model';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly http = inject(HttpClient);

  private readonly roleResource = 'Role';
  private readonly roleBase = `${environment.apiBaseUrl}/backendless/${this.roleResource}`;


  list(params: {
    page?: number;
    limit?: number;
    search?: string[];
    order?: string;
    fields?: string[];
  }): Observable<BackendlessPage<RoleListRow>> {
    let httpParams = new HttpParams();

    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);

    if (params.search?.length) {
      params.search.forEach((term) => {
        if (term?.trim()) {
          httpParams = httpParams.append('search', term.trim());
        }
      });
    }

    if (params.order) httpParams = httpParams.set('order', params.order);

    if (params.fields?.length) {
      params.fields.forEach((f) => (httpParams = httpParams.append('fields', f)));
    }

    return this.http.get<BackendlessPage<RoleListRow>>(`${this.roleBase}/quick`, { params: httpParams });
  }


  read(id: string): Observable<RoleFormDTO> {
    return this.http.get<RoleFormDTO>(`${environment.apiBaseUrl}/backendless/Role/${id}`);
  }

  create(payload: RoleFormDTO): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/backendless/Role`, payload);
  }

  update(id: string, payload: RoleFormDTO): Observable<any> {
    return this.http.put(`${environment.apiBaseUrl}/backendless/Role/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.roleBase}/${id}`);
  }
}
