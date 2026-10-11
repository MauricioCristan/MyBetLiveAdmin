import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { PasswordService } from '../password.service';
import { I18nPipe } from '../../../core/i18n/i18n.pipe';
import { I18nService } from '../../../core/i18n/i18n.service';

@Component({
  standalone: true,
  selector: 'app-password-confirm',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, I18nPipe],
  templateUrl: './password-confirm.component.html',
  styleUrl: './password-confirm.component.scss',
})
export class PasswordConfirmComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly password = inject(PasswordService);
  private readonly i18n = inject(I18nService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  backendError: string | null = null;
  success = false;

  token = (this.route.snapshot.queryParamMap.get('token') || '').trim();

  // cambia texto según ruta
  mode: 'set' | 'reset' = this.router.url.startsWith('/set-password') ? 'set' : 'reset';

  form = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
    confirm: ['', [Validators.required]],
  });

  submit(): void {
    this.backendError = null;
    this.success = false;

    if (!this.token) {
      this.backendError = this.i18n.translate('auth', 'password.tokenMissing');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const newPassword = (this.form.value.newPassword || '').trim();
    const confirm = (this.form.value.confirm || '').trim();

    if (newPassword !== confirm) {
      this.backendError = this.i18n.translate('auth', 'password.notMatch');
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.password
      .reset(this.token, newPassword)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.success = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.backendError =
            err?.error?.message || this.i18n.translate('auth', 'password.errorGeneric');
          this.cdr.detectChanges();
        },
      });
  }
}
