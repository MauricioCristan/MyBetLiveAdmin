import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { UserService } from '../../services/user.service';
import { RoleOptionDTO, USER_CONSTRAINTS, UserUpsertPayload } from '../../models/user.model';
import { I18nPipe } from '../../../../../core/i18n/i18n.pipe';
import { I18nService } from '../../../../../core/i18n/i18n.service';
import { NotificationService } from '../../../../../core/notifications/notification.service';
import { ADMIN_ROUTES } from '../../../admin-routes';
import { PermissionService } from '../../../../../core/auth/permission.service';
import { trimmedRequired } from '../../../../../core/forms/validators';

@Component({
  standalone: true,
  selector: 'app-user-form',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, I18nPipe],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
})
export class UserFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly users = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly i18n = inject(I18nService);
  private readonly notifications = inject(NotificationService);
  private readonly permissions = inject(PermissionService);

  loading = false;
  backendError: string | null = null;

  id: string | null = null;
  canReadUser = false;
  canCreateUser = false;
  canUpdateUser = false;
  canChangeRole = false;
  currentRoleId: string | null = null;

  rolesLoading = false;
  roleOptions: RoleOptionDTO[] = [];
  readonly limits = USER_CONSTRAINTS;

  form = this.fb.group({
    username: ['', [trimmedRequired(), Validators.minLength(USER_CONSTRAINTS.USERNAME_MIN), Validators.maxLength(USER_CONSTRAINTS.USERNAME_MAX)]],
    email: ['', [Validators.email, Validators.maxLength(USER_CONSTRAINTS.EMAIL_MAX)]],
    enabled: [true, [Validators.required]],
    roleId: [null as string | null, [Validators.required]],
  });

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');

    this.permissions.ensureLoaded().subscribe({
      next: () => {
        this.canReadUser = this.permissions.canRead('USER');
        this.canCreateUser = this.permissions.canCreate('USER');
        this.canUpdateUser = this.permissions.canUpdate('USER');
        this.canChangeRole = this.permissions.hasPermission('USER', 'CHANGEROLE');

        if (!this.canReadUser) {
          this.router.navigate(ADMIN_ROUTES.ROOT.COMMANDS);
          return;
        }

        if (!this.id && !this.canCreateUser) {
          this.router.navigate(ADMIN_ROUTES.USERS.LIST.COMMANDS);
          return;
        }

        this.form.controls.roleId.disable({ emitEvent: false });

        if (this.id && !this.canUpdateUser) {
          this.form.disable({ emitEvent: false });
        } else if (!this.canChangeRole) {
          this.form.controls.roleId.disable({ emitEvent: false });
          this.form.controls.roleId.clearValidators();
          this.form.controls.roleId.updateValueAndValidity({ emitEvent: false });
        }

        if (this.id) {
          this.loadEdit();
        } else {
          this.loadCreate();
        }
      },
      error: () => {
        this.router.navigate(ADMIN_ROUTES.ROOT.COMMANDS);
      },
    });
  }

  get isEdit(): boolean {
    return !!this.id;
  }

  get isReadOnlyMode(): boolean {
    return this.isEdit && !this.canUpdateUser;
  }

  get canSave(): boolean {
    return this.isEdit ? this.canUpdateUser : this.canCreateUser;
  }

  get canEditRole(): boolean {
    return this.canChangeRole && !this.isReadOnlyMode;
  }

  private loadCreate(): void {
    this.rolesLoading = true;
    this.backendError = null;

    this.users
      .roleOptions(undefined, 200)
      .pipe(finalize(() => (this.rolesLoading = false)))
      .subscribe({
        next: (opts) => {
          this.roleOptions = opts || [];
          if (this.canEditRole) {
            this.form.controls.roleId.enable({ emitEvent: false });
          } else {
            this.currentRoleId = this.currentRoleId ?? this.defaultUserRoleId(this.roleOptions);
            this.form.controls.roleId.setValue(this.currentRoleId, { emitEvent: false });
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.backendError =
            err?.error?.message || this.i18n.translate('users', 'form.errorLoadRoles');
        },
      });
  }

  private loadEdit(): void {
    if (!this.id) return;

    this.loading = true;
    this.rolesLoading = true;
    this.backendError = null;

    forkJoin({
      roles: this.users.roleOptions(undefined, 200),
      user: this.users.read(this.id),
    })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.rolesLoading = false;
        })
      )
      .subscribe({
        next: ({ roles, user }) => {
          this.roleOptions = roles || [];

          // Campos base
          this.form.patchValue({
            username: user.username,
            email: user.email || '',
            enabled: !!user.enabled,
          });

          this.currentRoleId = user.roleId || null;

          // ✅ Habilita control y setea value DESPUÉS de tener options
          if (this.canEditRole) {
            this.form.controls.roleId.enable({ emitEvent: false });
          } else {
            this.form.controls.roleId.disable({ emitEvent: false });
          }
          this.form.controls.roleId.setValue(user.roleId || null, { emitEvent: false });

          // ✅ fuerza repaint para que pinte al instante (ya no ocupa click)
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.backendError =
            err?.error?.message || this.i18n.translate('users', 'form.errorLoadEdit');
        },
      });
  }

  save(): void {
    if (!this.canSave) return;
    this.backendError = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const selectedRoleId = this.canChangeRole
      ? this.form.controls.roleId.value || null
      : this.currentRoleId;

    const payload: UserUpsertPayload = {
      username: (this.form.value.username || '').trim(),
      email: (this.form.value.email || '').trim() || null,
      enabled: !!this.form.value.enabled,
      roleId: selectedRoleId ?? null,
    };

    this.loading = true;

    const obs = this.id
      ? this.users.update(this.id, payload)
      : this.users.create(payload);

    obs.pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.notifications.success({
          key: this.id ? 'notifications.users.updated' : 'notifications.users.created',
        });
        this.router.navigate(ADMIN_ROUTES.USERS.LIST.COMMANDS);
      },
      error: (err) => {
        this.backendError = err?.error?.message || this.i18n.translate('users', 'form.errorSave');
        this.notifications.error(
          err?.error?.message || { key: 'notifications.users.saveError' },
          {
            details: err?.error?.errors instanceof Array ? err.error.errors : undefined,
          }
        );
      },
    });
  }

  cancel(): void {
    this.router.navigate(ADMIN_ROUTES.USERS.LIST.COMMANDS);
  }

  private defaultUserRoleId(options: RoleOptionDTO[]): string | null {
    const userRole = options.find((r) => r.label?.trim().toUpperCase() === 'USER');
    return userRole?.id ?? null;
  }
}


