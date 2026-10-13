import { TestBed } from '@angular/core/testing';
import { provideHttpClient,withInterceptors,HttpClient } from '@angular/common/http';
import { provideHttpClientTesting,HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { describe,it,expect,afterEach } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { TokenStorageService } from './token-storage.service';
describe('Public account requests',()=>{
  afterEach(()=>localStorage.clear());
  it('does not send stale credentials on recovery, verification or registration',()=>{
    TestBed.configureTestingModule({providers:[provideRouter([]),provideHttpClient(withInterceptors([authInterceptor])),provideHttpClientTesting()]});
    TestBed.inject(TokenStorageService).setTokens({accessToken:'expired-token',refreshToken:'refresh',tokenType:'Bearer',expiresInSeconds:1,refreshExpiresInSeconds:1});
    const http=TestBed.inject(HttpClient),requests=TestBed.inject(HttpTestingController);
    for(const path of ['register','password/forgot','password/reset','email/verify','email/resend']) {
      http.post('https://api.example.test/api/v1/auth/'+path,{}).subscribe();
      const req=requests.expectOne('https://api.example.test/api/v1/auth/'+path);expect(req.request.headers.has('Authorization')).toBe(false);req.flush({success:true});
    }
    requests.verify();
  });
});
