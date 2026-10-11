import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { I18nPipe } from '../../../core/i18n/i18n.pipe';
import { I18nService } from '../../../core/i18n/i18n.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { ADMIN_ROUTES } from '../../admin/admin-routes';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, I18nPipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  private readonly notifications = inject(NotificationService);

  loading = false;
  errorMsg: string | null = null;
  showPassword = false;

  form = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  submit(): void {
    this.errorMsg = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    const payload = {
      username: this.form.value.username!.trim(),
      password: this.form.value.password!,
    };

    this.auth
      .login(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: async () => {
          this.notifications.success({ key: 'notifications.loginSuccess' });
          await this.router.navigate(ADMIN_ROUTES.ROOT.COMMANDS);
        },
        error: (err) => {
          this.errorMsg =
            err?.error?.message ||
            this.i18n.translate('auth', 'login.errorGeneric');
          this.notifications.error(
            err?.error?.message || { key: 'notifications.error.generic' },
            {
              details: err?.error?.errors instanceof Array ? err.error.errors : undefined,
            }
          );
        },
      });
  }
}


