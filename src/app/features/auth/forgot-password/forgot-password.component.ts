import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { PasswordService } from '../password.service';
import { I18nPipe } from '../../../core/i18n/i18n.pipe';
import { I18nService } from '../../../core/i18n/i18n.service';

@Component({
  standalone: true,
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, I18nPipe],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly password = inject(PasswordService);
  private readonly i18n = inject(I18nService);

  // ✅ Signals (zoneless-friendly)
  loading = signal(false);
  backendError = signal<string | null>(null);
  sent = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
  });

  submit(): void {
    this.backendError.set(null);
    this.sent.set(false);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = (this.form.value.email || '').trim();

    this.loading.set(true);

    this.password
      .forgot(email)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.sent.set(true),
        error: (err) => {
          this.backendError.set(
            err?.error?.message || this.i18n.translate('auth', 'forgot.errorGeneric')
          );
        },
      });
  }
}

