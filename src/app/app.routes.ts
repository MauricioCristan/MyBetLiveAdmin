import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { ADMIN_ROUTES } from './features/admin/admin-routes';
import { myBetAdminGuard } from './features/admin/mybet/mybet.guard';
import { settingsPendingGuard } from './features/admin/settings/settings-pending.guard';
import { MYBET_ROUTES } from './features/admin/mybet/mybet.routes';

export const routes: Routes = [
  {
    path:'verify-email',
    loadComponent:()=>import('./features/auth/email-confirm/email-confirm.component').then(m=>m.EmailConfirmComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/password-confirm/password-confirm.component').then((m) => m.PasswordConfirmComponent),
  },
  {
    path: 'set-password',
    loadComponent: () =>
      import('./features/auth/password-confirm/password-confirm.component').then((m) => m.PasswordConfirmComponent),
  },

  {
    path: ADMIN_ROUTES.ROOT.PATH,
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      ...MYBET_ROUTES,
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/admin/default/admin-default.component').then((m) => m.AdminDefaultComponent),
      },

      {
        path: ADMIN_ROUTES.USERS.PATH,
        loadChildren: () =>
          import('./features/admin/users/user.route').then((m) => m.userRoutes),
      },

      {
        path: ADMIN_ROUTES.ROLES.PATH,
        loadChildren: () =>
          import('./features/admin/roles/role.route').then((m) => m.roleRoutes),
      },

      ...['operations', 'ads'].map(view => ({
        path: 'settings/' + view, canActivate: [myBetAdminGuard], canDeactivate:[settingsPendingGuard], data:{settingView:view},
        loadComponent: () => import('./features/admin/settings/pages/settings.page').then(m => m.SettingsPageComponent),
      })),
      {path:'settings/operations/:sport',canActivate:[myBetAdminGuard],canDeactivate:[settingsPendingGuard],data:{settingView:'operations'},
        loadComponent:()=>import('./features/admin/settings/pages/settings.page').then(m=>m.SettingsPageComponent)},
      {
        path: ADMIN_ROUTES.SETTINGS.PATH,
        canDeactivate:[settingsPendingGuard],
        loadComponent: () =>
          import('./features/admin/settings/pages/settings.page').then((m) => m.SettingsPageComponent),
      },
    ],
  },

  { path: '', pathMatch: 'full', redirectTo: ADMIN_ROUTES.ROOT.PATH },
  { path: '**', redirectTo: ADMIN_ROUTES.ROOT.PATH },
];
