import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { TokenStorageService } from '../../../core/auth/token-storage.service';
import { environment } from '../../../../enviroment/environment';
import { provideRouter } from '@angular/router';
describe('MyBet permissions across sessions',()=>{
 it('clears cached admin permissions after another account signs in',()=>{
  const permissions={clear:vi.fn()},storage={setTokens:vi.fn()};
  TestBed.configureTestingModule({providers:[provideRouter([]),provideHttpClient(),provideHttpClientTesting(),
   {provide:PermissionService,useValue:permissions},{provide:TokenStorageService,useValue:storage}]});
  TestBed.inject(AuthService).login({username:'client',password:'local-test'}).subscribe();
  const http=TestBed.inject(HttpTestingController);
  http.expectOne(environment.apiBaseUrl+'/auth/admin/login').flush({accessToken:'test-access',refreshToken:'test-refresh'});
  expect(permissions.clear).toHaveBeenCalledOnce();expect(storage.setTokens).toHaveBeenCalledOnce();http.verify();
 });
});
