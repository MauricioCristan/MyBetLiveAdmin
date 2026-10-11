import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../enviroment/environment';
import { BackendlessPage, BackendlessStd, RoleOptionDTO, UserFormView, UserListRow, UserUpsertPayload } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  private readonly userResource = 'AppUser';
  private readonly roleResource = 'Role';

  private readonly userBase = `${environment.apiBaseUrl}/backendless/${this.userResource}`;
  private readonly roleBase = `${environment.apiBaseUrl}/backendless/${this.roleResource}`;

  // ---------------- USERS (Backendless) ----------------

  // src/app/features/admin/users/services/user.service.ts

  list(params: {
    page?: number;
    limit?: number;
    search?: string[];
    order?: string;
    fields?: string[];
  }): Observable<BackendlessPage<UserListRow>> {
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

    return this.http.get<BackendlessPage<UserListRow>>(`${this.userBase}/quick`, { params: httpParams });
  }


  read(id: string): Observable<UserFormView> {
    return this.http.get<BackendlessStd<UserFormView>>(`${this.userBase}/${id}`).pipe(
      map((res) => (res.data?.[0] ? res.data[0] : (null as any)))
    );
  }

  create(payload: UserUpsertPayload): Observable<UserFormView> {
    return this.http.post<BackendlessStd<UserFormView>>(this.userBase, payload).pipe(
      map((res) => (res.data?.[0] ? res.data[0] : (null as any)))
    );
  }

  update(id: string, payload: UserUpsertPayload): Observable<UserFormView> {
    return this.http.put<BackendlessStd<UserFormView>>(`${this.userBase}/${id}`, payload).pipe(
      map((res) => (res.data?.[0] ? res.data[0] : (null as any)))
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete(`${this.userBase}/${id}`).pipe(map(() => void 0));
  }

  // ---------------- ROLES (Options endpoint) ----------------
  // GET /api/v1/backendless/Role/options?q=...&limit=...
  roleOptions(q?: string, limit = 50): Observable<RoleOptionDTO[]> {
    let params = new HttpParams().set('limit', limit);
    if (q?.trim()) params = params.set('q', q.trim());

    return this.http.get<RoleOptionDTO[]>(`${this.roleBase}/options`, { params });
  }
}
