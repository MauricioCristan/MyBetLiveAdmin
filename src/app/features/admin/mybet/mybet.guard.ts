import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { PermissionService } from '../../../core/auth/permission.service';
export const myBetAdminGuard:CanActivateFn=()=>{
 const permissions=inject(PermissionService),router=inject(Router);
 return permissions.ensureLoaded().pipe(map(()=>permissions.hasAnyAdminRole()||router.createUrlTree(['/admin'])),catchError(()=>of(router.createUrlTree(['/login']))));
};
