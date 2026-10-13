import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../enviroment/environment';
import { TokenStorageService } from './token-storage.service';
import { SessionRenewalService } from './session-renewal.service';

export const authInterceptor:HttpInterceptorFn=(req,next)=>{
  const storage=inject(TokenStorageService),renewal=inject(SessionRenewalService);
  const url=new URL(req.url,window.location.origin),base=new URL(environment.apiBaseUrl,window.location.origin);
  const ownApi=url.origin===base.origin && url.pathname.startsWith(base.pathname.replace(/\/$/,'')+'/');
  const publicAuth=/\/api\/v1\/auth\/(?:admin\/)?(login|refresh|logout|register|google(?:\/challenge)?|password\/(forgot|reset)|email\/(verify|resend))$/.test(url.pathname);
  if(!ownApi || publicAuth)return next(req);
  const access=storage.getAccessToken();
  const sessionId=storage.getSessionId();
  const attach=(token:string)=>req.clone({setHeaders:{Authorization:`${storage.getTokenType()} ${token}`}});
  return next(access?attach(access):req).pipe(catchError((error:HttpErrorResponse)=>{
    if(error.status!==401 || !access)return throwError(()=>error);
    return renewal.renew(access,sessionId).pipe(switchMap(tokens=>next(attach(tokens.accessToken)).pipe(catchError(retryError=>{
      if(retryError.status===401)renewal.end(tokens.accessToken,tokens.refreshToken);
      return throwError(()=>retryError);
    }))));
  }));
};
