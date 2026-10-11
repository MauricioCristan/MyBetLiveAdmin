import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TokenStorageService } from './token-storage.service';

/**
 * Agrega Authorization: Bearer <token> a todos los requests
 * excepto a los endpoints de auth (login/refresh/logout).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(TokenStorageService);
  const router = inject(Router);

  const isAuthEndpoint =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/refresh') ||
    req.url.includes('/auth/logout');

  const token = storage.getAccessToken();
  const tokenType = storage.getTokenType();

  const requestToSend =
    !token || isAuthEndpoint
      ? req
      : req.clone({
          setHeaders: {
            Authorization: `${tokenType} ${token}`,
          },
        });

  return next(requestToSend).pipe(
    catchError((err) => {
      if (err?.status === 401 && !isAuthEndpoint) {
        storage.clear();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
