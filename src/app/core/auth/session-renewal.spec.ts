import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach,afterEach,describe,it,expect,vi } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { TokenStorageService } from './token-storage.service';
import { environment } from '../../../enviroment/environment';
import { AuthTokens } from './auth.models';
import { PermissionService } from './permission.service';
import { authGuard } from './auth.guard';
import { firstValueFrom, Observable } from 'rxjs';

describe('Admin session renewal',()=>{
  let http:HttpClient,requests:HttpTestingController,storage:TokenStorageService;
  const tokens=(access='old',refresh='refresh'):AuthTokens=>({accessToken:access,refreshToken:refresh,tokenType:'Bearer',expiresInSeconds:120,refreshExpiresInSeconds:604800});
  beforeEach(()=>{
    localStorage.clear();TestBed.configureTestingModule({providers:[provideRouter([]),provideHttpClient(withInterceptors([authInterceptor])),provideHttpClientTesting()]});
    http=TestBed.inject(HttpClient);requests=TestBed.inject(HttpTestingController);storage=TestBed.inject(TokenStorageService);
    vi.spyOn(TestBed.inject(Router),'navigate').mockResolvedValue(true);storage.setTokens(tokens());
  });
  afterEach(()=>{requests.verify();localStorage.clear();});
  it('renews once for concurrent 401 responses and retries with the rotated token',()=>{
    const result:unknown[]=[];
    for(const path of ['settings','users'])http.get(environment.apiBaseUrl+'/'+path).subscribe(value=>result.push(value));
    const originals=requests.match(req=>['settings','users'].some(path=>req.url===environment.apiBaseUrl+'/'+path));
    originals.forEach(req=>req.flush({}, {status:401,statusText:'Expired'}));
    const refresh=requests.expectOne(environment.apiBaseUrl+'/auth/admin/refresh');
    expect(refresh.request.headers.has('Authorization')).toBe(false);refresh.flush(tokens('new','rotated'));
    const retries=requests.match(req=>['settings','users'].some(path=>req.url===environment.apiBaseUrl+'/'+path));
    expect(retries).toHaveLength(2);retries.forEach(req=>{expect(req.request.headers.get('Authorization')).toBe('Bearer new');req.flush({ok:true});});
    expect(result).toHaveLength(2);expect(storage.getRefreshToken()).toBe('rotated');
  });
  it('ends the session when the refresh is rejected, without looping',()=>{
    const error=vi.fn();http.get(environment.apiBaseUrl+'/settings').subscribe({error});
    requests.expectOne(environment.apiBaseUrl+'/settings').flush({}, {status:401,statusText:'Expired'});
    requests.expectOne(environment.apiBaseUrl+'/auth/admin/refresh').flush({}, {status:401,statusText:'Revoked'});
    expect(storage.getAccessToken()).toBeNull();expect(error).toHaveBeenCalledOnce();
  });
  it('keeps the session on temporary refresh errors and ignores forbidden business requests',()=>{
    http.get(environment.apiBaseUrl+'/settings').subscribe({error:()=>{}});
    requests.expectOne(environment.apiBaseUrl+'/settings').flush({}, {status:401,statusText:'Expired'});
    requests.expectOne(environment.apiBaseUrl+'/auth/admin/refresh').flush({}, {status:503,statusText:'Unavailable'});
    expect(storage.getRefreshToken()).toBe('refresh');
    http.get(environment.apiBaseUrl+'/users').subscribe({error:()=>{}});
    requests.expectOne(environment.apiBaseUrl+'/users').flush({}, {status:403,statusText:'Forbidden'});
    requests.expectNone(environment.apiBaseUrl+'/auth/admin/refresh');expect(storage.getAccessToken()).toBe('old');
  });
  it('does not restore the previous account when logout or a new login happens during renewal',()=>{
    http.get(environment.apiBaseUrl+'/settings').subscribe({error:()=>{}});
    requests.expectOne(environment.apiBaseUrl+'/settings').flush({}, {status:401,statusText:'Expired'});
    const pending=requests.expectOne(environment.apiBaseUrl+'/auth/admin/refresh');
    storage.clear();storage.setTokens(tokens('other','other-refresh'));pending.flush(tokens('stale','stale-refresh'));
    expect(storage.getAccessToken()).toBe('other');expect(storage.getRefreshToken()).toBe('other-refresh');
  });
  it('never sends credentials to another origin or renews a public recovery request',()=>{
    http.get('https://external.example.test/api/v1/settings').subscribe();const external=requests.expectOne('https://external.example.test/api/v1/settings');
    expect(external.request.headers.has('Authorization')).toBe(false);external.flush({});
    http.post(environment.apiBaseUrl+'/auth/password/forgot',{}).subscribe({error:()=>{}});
    const forgot=requests.expectOne(environment.apiBaseUrl+'/auth/password/forgot');expect(forgot.request.headers.has('Authorization')).toBe(false);
    forgot.flush({}, {status:401,statusText:'Rejected'});requests.expectNone(environment.apiBaseUrl+'/auth/admin/refresh');expect(storage.hasAccessToken()).toBe(true);
  });
  it('blocks a saved client session at the root guard and allows a server-confirmed administrator',async()=>{
    const run=()=>TestBed.runInInjectionContext(()=>authGuard({} as never,{} as never)) as Observable<boolean>;
    let result=firstValueFrom(run());requests.expectOne(environment.apiBaseUrl+'/me').flush({username:'client',authorities:['ROLE_MYBET_CLIENT']});
    expect(await result).not.toBe(true);expect(storage.hasAccessToken()).toBe(false);
    storage.setTokens(tokens());TestBed.inject(PermissionService).clear();result=firstValueFrom(run());
    requests.expectOne(environment.apiBaseUrl+'/me').flush({username:'owner',authorities:['ROLE_ADMIN']});expect(await result).toBe(true);
  });
  it('does not clear a new login when an old permission request completes late',async()=>{
    const result=firstValueFrom(TestBed.runInInjectionContext(()=>authGuard({} as never,{} as never)) as Observable<boolean>);
    const old=requests.expectOne(environment.apiBaseUrl+'/me');
    storage.clear();storage.setTokens(tokens('other','other-refresh'));TestBed.inject(PermissionService).clear();
    old.flush({username:'old-client',authorities:['ROLE_MYBET_CLIENT']});
    expect(await result).not.toBe(true);expect(storage.getAccessToken()).toBe('other');expect(TestBed.inject(PermissionService).loaded()).toBe(false);
  });
});
