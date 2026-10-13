import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, finalize, map, of, tap, shareReplay } from 'rxjs';

import { environment } from '../../../enviroment/environment';
import { MeResponse } from './auth.models';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly http = inject(HttpClient);

  private readonly meState = signal<MeResponse | null>(null);
  private readonly loadedState = signal(false);
  private inflight$: Observable<void> | null = null;
  private revision=0;

  readonly me = computed(() => this.meState());
  readonly loaded = computed(() => this.loadedState());

  ensureLoaded(): Observable<void> {
    if (this.loadedState()) return of(void 0);
    if (this.inflight$) return this.inflight$;

    const revision=this.revision;
    this.inflight$ = this.fetchMe(revision).pipe(
      finalize(() => { if(revision===this.revision)this.inflight$ = null; }),
      shareReplay({bufferSize:1,refCount:false})
    );

    return this.inflight$;
  }

  refresh(): Observable<void> {
    if(this.inflight$)return this.inflight$;
    this.loadedState.set(false);
    this.inflight$ = null;
    return this.ensureLoaded();
  }

  clear(): void {
    this.revision++;
    this.meState.set(null);
    this.loadedState.set(false);
    this.inflight$ = null;
  }

  hasAuthority(authority: string): boolean {
    const me = this.meState();
    if (!me) return false;
    return me.authorities.includes(authority);
  }

  hasAnyAdminRole(): boolean {
    return this.hasAuthority('ROLE_ADMIN');
  }

  hasPermission(module: string, action: string): boolean {
    if (this.hasAnyAdminRole()) return true;
    const m = module.trim().toUpperCase().replaceAll(' ', '_');
    const a = action.trim().toUpperCase().replaceAll(' ', '_');
    return this.hasAuthority(`PERM:${m}:${a}`);
  }

  canRead(module: string): boolean {
    return this.hasPermission(module, 'READ');
  }

  canCreate(module: string): boolean {
    return this.hasPermission(module, 'CREATE');
  }

  canUpdate(module: string): boolean {
    return this.hasPermission(module, 'UPDATE');
  }

  canDelete(module: string): boolean {
    return this.hasPermission(module, 'DELETE');
  }

  private fetchMe(revision:number): Observable<void> {
    return this.http.get<MeResponse>(`${environment.apiBaseUrl}/me`).pipe(
      tap((me) => {
        if(revision!==this.revision)throw new HttpErrorResponse({status:409,statusText:'Session changed'});
        this.meState.set({
          username: me.username,
          authorities: (me.authorities || []).map((a) => `${a}`.trim()).filter((a) => a.length > 0),
        });
        this.loadedState.set(true);
      }),
      map(() => void 0)
    );
  }
}
