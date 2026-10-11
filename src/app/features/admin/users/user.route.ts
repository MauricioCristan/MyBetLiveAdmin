import { Routes } from '@angular/router';
import { ADMIN_ROUTES } from '../admin-routes';
import { UserComponent } from './user.component';

export const userRoutes: Routes = [
  {
    path: '',
    component: UserComponent,
    children: [
      {
        path: ADMIN_ROUTES.USERS.LIST.PATH,
        loadComponent: () => import('./pages/list/user-list.component').then((m) => m.UserListComponent),
      },
      {
        path: ADMIN_ROUTES.USERS.CREATE.PATH,
        loadComponent: () => import('./pages/form/user-form.component').then((m) => m.UserFormComponent),
      },
      {
        path: ADMIN_ROUTES.USERS.EDIT.PATH,
        loadComponent: () => import('./pages/form/user-form.component').then((m) => m.UserFormComponent),
      },
    ],
  },
];

export default userRoutes;
