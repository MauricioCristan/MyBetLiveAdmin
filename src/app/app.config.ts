import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { NOTIFICATION_CONFIG } from './core/notifications/notification.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: NOTIFICATION_CONFIG,
      useValue: {
        maxVisible: 5,
        dedupeWindowMs: 1000,
        durations: {
          success: 3500,
          info: 3500,
          warning: 5000,
          error: 8000,
        },
        preventDuplicateByDefault: true,
      },
    },
  ],
};
