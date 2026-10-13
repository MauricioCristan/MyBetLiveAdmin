import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { TokenStorageService } from './token-storage.service';
import { PermissionService } from './permission.service';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const storage = inject(TokenStorageService);
  const router = inject(Router);

  const permissions=inject(PermissionService);
  if(!storage.hasAccessToken())return router.createUrlTree(['/login']);
  const sessionId=storage.getSessionId();
  return permissions.refresh().pipe(map(()=>{
    if(sessionId!==storage.getSessionId())return router.createUrlTree(['/login']);
    if(permissions.hasAnyAdminRole())return true;
    storage.clear();permissions.clear();return router.createUrlTree(['/login']);
  }),catchError(error=>{
    if(sessionId===storage.getSessionId() && (error.status===401 || error.status===403)){storage.clear();permissions.clear();}
    return of(router.createUrlTree(['/login']));
  }));
};
