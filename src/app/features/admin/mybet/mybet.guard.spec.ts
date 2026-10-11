import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { PermissionService } from '../../../core/auth/permission.service';
import { myBetAdminGuard } from './mybet.guard';
import { Observable, firstValueFrom, of } from 'rxjs';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
describe('MyBet admin access',()=>{
 const permissions={ensureLoaded:()=>of(undefined),hasAnyAdminRole:()=>false};
 beforeEach(()=>TestBed.configureTestingModule({providers:[provideRouter([]),{provide:PermissionService,useValue:permissions}]}));
 async function check(){return firstValueFrom(TestBed.runInInjectionContext(()=>myBetAdminGuard({} as ActivatedRouteSnapshot,{} as RouterStateSnapshot)) as Observable<boolean|UrlTree>);}
 it('redirects an ordinary client away from the admin module',async()=>{
  const result=await check();expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/admin');
 });
 it('allows a role ADMIN',async()=>{
  const spy=vi.spyOn(permissions,'hasAnyAdminRole').mockReturnValue(true);expect(await check()).toBe(true);spy.mockRestore();
 });
});
