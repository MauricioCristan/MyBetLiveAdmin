import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { startWith } from 'rxjs';

import { RoleService } from '../../services/role.service';
import { ROLE_CONSTRAINTS, RoleFormDTO } from '../../models/role.model';
import { PermissionService, OptionDTO } from '../../services/permission.service';
import { I18nPipe } from '../../../../../core/i18n/i18n.pipe';
import { I18nService } from '../../../../../core/i18n/i18n.service';
import { NotificationService } from '../../../../../core/notifications/notification.service';
import { ADMIN_ROUTES } from '../../../admin-routes';
import { PermissionService as AccessPermissionService } from '../../../../../core/auth/permission.service';
import { trimmedRequired } from '../../../../../core/forms/validators';

/**
 * Grupo de permisos por módulo (UI tipo accordion)
 */
type PermissionGroup = {
  key: string; // MODULE (BRAND, USER, etc.)
  items: OptionDTO<string>[];
  open: boolean;
};

@Component({
  standalone: true,
  selector: 'app-role-form',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, I18nPipe],
  templateUrl: './role-form.component.html',
})
export class RoleFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly roles = inject(RoleService);
  private readonly perms = inject(PermissionService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly i18n = inject(I18nService);
  private readonly notifications = inject(NotificationService);
  private readonly permissions = inject(AccessPermissionService);

  // UI state
  loading = false;
  backendError: string | null = null;

  roleId: string | null = null;
  canReadRole = false;
  canCreateRole = false;
  canUpdateRole = false;

  // permisos
  permissionsLoading = false;
  permissionOptions: OptionDTO<string>[] = [];

  // agrupado tipo ejemplo
  groups: PermissionGroup[] = [];

  // search PRO (reactivo)
  permSearchCtrl = new FormControl<string>('', { nonNullable: true });

  // form
  readonly limits = ROLE_CONSTRAINTS;
  form = this.fb.group({
    code: ['', [trimmedRequired(), Validators.maxLength(ROLE_CONSTRAINTS.CODE_MAX)]],
    name: ['', [trimmedRequired(), Validators.maxLength(ROLE_CONSTRAINTS.NAME_MAX)]],
    permissionIds: this.fb.control<string[]>([], { nonNullable: true }),
  });

  // ======================================================
  // LIFECYCLE
  // ======================================================
  ngOnInit(): void {
    this.roleId = this.route.snapshot.paramMap.get('id');

    this.permissions.ensureLoaded().subscribe({
      next: () => {
        this.canReadRole = this.permissions.canRead('ROLE');
        this.canCreateRole = this.permissions.canCreate('ROLE');
        this.canUpdateRole = this.permissions.canUpdate('ROLE');

        if (!this.canReadRole) {
          this.router.navigate(ADMIN_ROUTES.ROOT.COMMANDS);
          return;
        }

        if (!this.roleId && !this.canCreateRole) {
          this.router.navigate(ADMIN_ROUTES.ROLES.LIST.COMMANDS);
          return;
        }

        if (this.roleId && !this.canUpdateRole) {
          this.form.disable({ emitEvent: false });
          this.permSearchCtrl.disable({ emitEvent: false });
        }

        // startWith('') para construir grupos desde primer render
        this.permSearchCtrl.valueChanges
          .pipe(startWith(this.permSearchCtrl.value))
          .subscribe(() => this.rebuildGroups());

        this.loadPermissionOptions();

        if (this.roleId) {
          this.loadRole(this.roleId);
        }
      },
      error: () => {
        this.router.navigate(ADMIN_ROUTES.ROOT.COMMANDS);
      },
    });
  }

  get isEdit(): boolean {
    return !!this.roleId;
  }

  get canSave(): boolean {
    return this.isEdit ? this.canUpdateRole : this.canCreateRole;
  }

  // ======================================================
  // LOADERS
  // ======================================================
  private loadPermissionOptions(): void {
    this.permissionsLoading = true;

    this.perms.options().subscribe({
      next: (opts) => {
        this.permissionOptions = opts ?? [];
        this.permissionsLoading = false;

        // ✅ para que salgan desde el primer render
        this.rebuildGroups();
        this.cdr.detectChanges();
      },
      error: () => {
        this.permissionsLoading = false;
      },
    });
  }

  private loadRole(id: string): void {
    this.loading = true;

    this.roles.read(id).subscribe({
      next: (dto) => {
        this.form.patchValue({
          code: dto.code,
          name: dto.name,
          permissionIds: dto.permissionIds ?? [],
        });

        this.loading = false;

        // para reflejar checks ya seleccionados
        this.rebuildGroups();
      },
      error: (err) => {
        this.backendError =
          err?.error?.message || this.i18n.translate('roles', 'form.errorLoad');
        this.loading = false;
      },
    });
  }

  // ======================================================
  // PERMISSIONS – SELECCIÓN
  // ======================================================
  get selectedPermissionIds(): string[] {
    return this.form.controls.permissionIds.value ?? [];
  }

  isSelected(pid: string): boolean {
    return this.selectedPermissionIds.includes(pid);
  }

  togglePermission(pid: string, checked: boolean): void {
    if (!this.canSave) return;
    const current = new Set(this.selectedPermissionIds);
    checked ? current.add(pid) : current.delete(pid);

    this.form.controls.permissionIds.setValue([...current]);
    this.form.controls.permissionIds.markAsDirty();
  }

  clearPermissions(): void {
    if (!this.canSave) return;
    this.form.controls.permissionIds.setValue([]);
    this.form.controls.permissionIds.markAsDirty();
  }

  // ======================================================
  // PERMISSIONS – ACCIONES PRO (como el ejemplo)
  // ======================================================
  selectAllVisible(): void {
    if (!this.canSave) return;
    const current = new Set(this.selectedPermissionIds);
    for (const g of this.groups) {
      for (const p of g.items) current.add(p.id);
    }
    this.form.controls.permissionIds.setValue([...current]);
  }

  clearVisible(): void {
    if (!this.canSave) return;
    const current = new Set(this.selectedPermissionIds);
    for (const g of this.groups) {
      for (const p of g.items) current.delete(p.id);
    }
    this.form.controls.permissionIds.setValue([...current]);
  }

  toggleGroup(groupKey: string, checked: boolean): void {
    if (!this.canSave) return;
    const group = this.groups.find((g) => g.key === groupKey);
    if (!group) return;

    const current = new Set(this.selectedPermissionIds);
    for (const p of group.items) {
      checked ? current.add(p.id) : current.delete(p.id);
    }

    this.form.controls.permissionIds.setValue([...current]);
  }

  isGroupFullySelected(groupKey: string): boolean {
    const group = this.groups.find((g) => g.key === groupKey);
    if (!group || group.items.length === 0) return false;

    const current = new Set(this.selectedPermissionIds);
    return group.items.every((p) => current.has(p.id));
  }

  // ======================================================
  // AGRUPADO + SEARCH (CORE DEL EJEMPLO)
  // ======================================================
  private rebuildGroups(): void {
    const q = this.permSearchCtrl.value.trim().toLowerCase();

    const filtered = !q
      ? this.permissionOptions
      : this.permissionOptions.filter((p) =>
          (p.label || '').toLowerCase().includes(q)
        );

    const buckets = new Map<string, OptionDTO<string>[]>();

    for (const p of filtered) {
      const key = this.groupKeyFromLabel(p.label);
      const list = buckets.get(key) ?? [];
      list.push(p);
      buckets.set(key, list);
    }

    const keys = Array.from(buckets.keys()).sort((a, b) =>
      a.localeCompare(b)
    );

    this.groups = keys.map((k) => ({
      key: k,
      items: (buckets.get(k) ?? []).slice().sort((a, b) =>
        (a.label || '').localeCompare(b.label || '')
      ),
      open: !!q,
    }));
  }

  /**
   * Extrae el módulo desde el label.
   * Ej: "Brand - Read" => BRAND
   */
  private groupKeyFromLabel(label: string): string {
    const s = (label ?? '').trim();
    if (!s) return 'OTROS';

    const left = s.split(' - ')[0] ?? s;
    return left.trim().toUpperCase();
  }

  // ======================================================
  // SUBMIT
  // ======================================================
  submit(): void {
    if (!this.canSave) return;
    this.backendError = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: RoleFormDTO = {
      code: this.form.value.code!.trim(),
      name: this.form.value.name!.trim(),
      permissionIds: this.selectedPermissionIds,
    };

    this.loading = true;

    const req$ = this.roleId
      ? this.roles.update(this.roleId, payload)
      : this.roles.create(payload);

    req$.subscribe({
      next: () => {
        this.notifications.success({
          key: this.roleId ? 'notifications.roles.updated' : 'notifications.roles.created',
        });
        this.loading = false;
        this.router.navigate(ADMIN_ROUTES.ROLES.LIST.COMMANDS);
      },
      error: (err) => {
        this.backendError =
          err?.error?.message || this.i18n.translate('roles', 'form.errorSave');
        this.notifications.error(
          err?.error?.message || { key: 'notifications.roles.saveError' },
          {
            details: err?.error?.errors instanceof Array ? err.error.errors : undefined,
          }
        );
        this.loading = false;
      },
    });
  }

  cancel(): void {
    this.router.navigate(ADMIN_ROUTES.ROLES.LIST.COMMANDS);
  }
}


