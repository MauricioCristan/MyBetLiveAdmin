import { Routes } from '@angular/router';
import { ADMIN_ROUTES } from '../admin-routes';
import { RoleComponent } from './role.component';

export const roleRoutes: Routes = [
  {
    path: '',
    component: RoleComponent,
    children: [
      {
        path: ADMIN_ROUTES.ROLES.LIST.PATH,
        loadComponent: () => import('./pages/list/role-list.component').then((m) => m.RoleListComponent),
      },
      {
        path: ADMIN_ROUTES.ROLES.CREATE.PATH,
        loadComponent: () => import('./pages/form/role-form.component').then((m) => m.RoleFormComponent),
      },
      {
        path: ADMIN_ROUTES.ROLES.EDIT.PATH,
        loadComponent: () => import('./pages/form/role-form.component').then((m) => m.RoleFormComponent),
      },
    ],
  },
];

export default roleRoutes;
