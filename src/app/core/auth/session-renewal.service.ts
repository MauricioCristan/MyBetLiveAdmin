import { Injectable, inject } from '@angular/core';
import { HttpBackend, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, defer, finalize, firstValueFrom, from, of, shareReplay, switchMap, throwError, catchError } from 'rxjs';
import { environment } from '../../../enviroment/environment';
import { AuthTokens } from './auth.models';
import { TokenStorageService } from './token-storage.service';

/** One rotation for concurrent requests, with no recursive interception of the refresh itself. */
@Injectable({providedIn:'root'})
export class SessionRenewalService {
  private readonly http=new HttpClient(inject(HttpBackend));
  private readonly storage=inject(TokenStorageService);
  private readonly router=inject(Router);
  private inflight:Observable<AuthTokens>|null=null;

  renew(failedAccess:string|null,sessionId=this.storage.getSessionId()):Observable<AuthTokens> {
    if(sessionId!==this.storage.getSessionId())return throwError(()=>new HttpErrorResponse({status:409,statusText:'Session changed'}));
    if(this.inflight)return this.inflight;
    this.inflight=defer(()=>{
      // Web Locks serialize rotations across tabs sharing localStorage.
      if(typeof navigator!=='undefined' && navigator.locks)
        return from(navigator.locks.request('mybetlive-admin-refresh',()=>firstValueFrom(this.rotate(failedAccess,sessionId))));
      return this.rotate(failedAccess,sessionId);
    }).pipe(finalize(()=>this.inflight=null),shareReplay({bufferSize:1,refCount:false}));
    return this.inflight;
  }

  private rotate(failedAccess:string|null,sessionId:string|null):Observable<AuthTokens> {
    if(sessionId!==this.storage.getSessionId())return throwError(()=>new HttpErrorResponse({status:409,statusText:'Session changed'}));
    const access=this.storage.getAccessToken(),refresh=this.storage.getRefreshToken();
    if(access && access!==failedAccess)return of(this.snapshot(access,refresh));
    if(!refresh){this.end(access,refresh);return throwError(()=>new HttpErrorResponse({status:401}));}
    return this.http.post<AuthTokens>(environment.apiBaseUrl+'/auth/admin/refresh',{refreshToken:refresh}).pipe(
      switchMap(tokens=>{
        if(!tokens?.accessToken || !tokens?.refreshToken)return throwError(()=>new HttpErrorResponse({status:503,statusText:'Incomplete session response'}));
        if(this.storage.getRefreshToken()!==refresh || this.storage.getAccessToken()!==access)
          return throwError(()=>new HttpErrorResponse({status:409,statusText:'Session changed'}));
        this.storage.setTokens(tokens,true);return of(tokens);
      }),
      catchError(error=>{
        if(error.status===401 || error.status===403)this.end(access,refresh);
        // Connectivity and service errors keep the saved session for the next attempt.
        return throwError(()=>error);
      })
    );
  }
  private snapshot(access:string,refresh:string|null):AuthTokens {
    return {accessToken:access,refreshToken:refresh||'',tokenType:this.storage.getTokenType(),expiresInSeconds:0,refreshExpiresInSeconds:0};
  }
  end(access:string|null,refresh:string|null):void {
    if(this.storage.getAccessToken()!==access || this.storage.getRefreshToken()!==refresh)return;
    this.storage.clear();void this.router.navigate(['/login']);
  }
}
