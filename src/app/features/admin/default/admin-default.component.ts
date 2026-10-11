import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { I18nPipe } from '../../../core/i18n/i18n.pipe';
import { ADMIN_ROUTES } from '../admin-routes';

@Component({
  standalone: true,
  selector: 'app-admin-default',
  imports: [CommonModule, I18nPipe],
  templateUrl: './admin-default.component.html',
})
export class AdminDefaultComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly permissions = inject(PermissionService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  error = false;
  noAccess = false;

  ngOnInit(): void {
    this.resolveLanding();
  }

  retry(): void {
    this.resolveLanding();
  }

  async logout(): Promise<void> {
    this.auth.logoutLocal();
    await this.router.navigate(['/login']);
  }

  private resolveLanding(): void {
    this.loading = true;
    this.error = false;
    this.noAccess = false;
    this.cdr.detectChanges();

    this.permissions.ensureLoaded().subscribe({
      next: async () => {
        if (this.permissions.hasAnyAdminRole()) {
          await this.router.navigate(['/admin/mybet'], {replaceUrl:true});
          return;
        }
        if (this.permissions.canRead('USER')) {
          await this.router.navigate([...ADMIN_ROUTES.USERS.LIST.COMMANDS], { replaceUrl: true });
          return;
        }
        if (this.permissions.canRead('ROLE')) {
          await this.router.navigate([...ADMIN_ROUTES.ROLES.LIST.COMMANDS], { replaceUrl: true });
          return;
        }
        if (this.permissions.canRead('SETTING')) {
          await this.router.navigate([...ADMIN_ROUTES.SETTINGS.COMMANDS], { replaceUrl: true });
          return;
        }

        this.loading = false;
        this.noAccess = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.error = true;
        this.cdr.detectChanges();
      },
    });
  }
}
