import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { RoleService } from '../../services/role.service';
import { RoleListRow } from '../../models/role.model';
import { I18nPipe } from '../../../../../core/i18n/i18n.pipe';
import { I18nService } from '../../../../../core/i18n/i18n.service';
import { NotificationService } from '../../../../../core/notifications/notification.service';
import { ADMIN_ROUTES } from '../../../admin-routes';
import { PermissionService } from '../../../../../core/auth/permission.service';
import { ConfirmationService } from '../../../../../core/confirmation/confirmation.service';

type SortDir = 'asc' | 'desc';
type SortField = 'code' | 'name' | 'createdAt' | 'updatedAt';
type PaginationItem = number | '...';

@Component({
  standalone: true,
  selector: 'app-role-list',
  imports: [CommonModule, RouterModule, FormsModule, I18nPipe],
  templateUrl: './role-list.component.html',
  styleUrl: './role-list.component.scss',
})
export class RoleListComponent implements OnInit {
  private readonly roles = inject(RoleService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly i18n = inject(I18nService);
  private readonly notifications = inject(NotificationService);
  private readonly permissions = inject(PermissionService);
  private readonly confirmation = inject(ConfirmationService);

  loading = false;
  backendError: string | null = null;

  query = {
    code: '',
    name: '',
  };

  pageData = {
    data: [] as RoleListRow[],
    page: 1,
    limit: 10,
    total: 0,
  };

  deletingId: string | null = null;
  canReadRole = false;
  canCreateRole = false;
  canUpdateRole = false;
  canDeleteRole = false;

  // ✅ Orden default: creado desc
  sort: { field: SortField; dir: SortDir } = { field: 'createdAt', dir: 'desc' };

  ngOnInit(): void {
    this.permissions.ensureLoaded().subscribe({
      next: () => {
        this.canReadRole = this.permissions.canRead('ROLE');
        this.canCreateRole = this.permissions.canCreate('ROLE');
        this.canUpdateRole = this.permissions.canUpdate('ROLE');
        this.canDeleteRole = this.permissions.canDelete('ROLE');

        if (!this.canReadRole) {
          this.router.navigate(ADMIN_ROUTES.ROOT.COMMANDS);
          return;
        }

        this.load();
      },
      error: () => {
        this.router.navigate(ADMIN_ROUTES.ROOT.COMMANDS);
      },
    });
  }

  load(page = this.pageData.page): void {
    this.loading = true;
    this.backendError = null;
    this.cdr.detectChanges(); // zoneless

    this.roles
      .list({
        page,
        limit: this.pageData.limit,
        search: this.searchFilters,
        order: this.orderParam,
      })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          this.pageData.page = res.page;
          this.pageData.limit = res.limit;
          this.pageData.total = res.total;
          this.pageData.data = res.data || [];
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.backendError = err?.error?.message || this.i18n.translate('roles', 'list.errorLoad');
          this.cdr.detectChanges();
        },
      });
  }

  get orderParam(): string {
    return `${this.sort.field}:${this.sort.dir}`;
  }

  toggleSort(field: SortField): void {
    if (this.sort.field === field) {
      this.sort.dir = this.sort.dir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sort.field = field;
      this.sort.dir = 'asc';
    }

    this.pageData.page = 1;
    this.load(1);
  }

  sortIcon(field: SortField): string {
    if (this.sort.field !== field) return 'bi bi-arrow-down-up';
    return this.sort.dir === 'asc' ? 'bi bi-sort-up' : 'bi bi-sort-down';
  }

  onSearch(): void {
    this.pageData.page = 1;
    this.load(1);
  }

  clearSearch(): void {
    this.query.code = '';
    this.query.name = '';
    this.onSearch();
  }

  get searchFilters(): string[] {
    const filters: string[] = [];

    const code = this.query.code.trim();
    const name = this.query.name.trim();

    if (code) filters.push(`code=${code}`);
    if (name) filters.push(`name=${name}`);

    return filters;
  }

  create(): void {
    if (!this.canCreateRole) return;
    this.router.navigate(ADMIN_ROUTES.ROLES.CREATE.COMMANDS);
  }

  edit(id: string): void {
    if (!this.canReadRole) return;
    this.router.navigate(ADMIN_ROUTES.ROLES.EDIT.commands(id));
  }

  async remove(id: string): Promise<void> {
    if (!this.canDeleteRole) return;
    if (this.deletingId) return;

    const ok = await this.confirmation.confirm({
      title: this.i18n.translate('layout', 'confirm.deleteTitle'),
      message: this.i18n.translate('roles', 'list.deleteConfirm'),
      confirmClass: 'btn-danger',
    });
    if (!ok) return;

    this.deletingId = id;
    this.backendError = null;
    this.cdr.detectChanges();

    this.roles
      .delete(id)
      .pipe(
        finalize(() => {
          this.deletingId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.notifications.success({ key: 'notifications.roles.deleted' });
          this.load();
        },
        error: (err) => {
          this.backendError = err?.error?.message || this.i18n.translate('roles', 'list.errorDelete');
          this.notifications.error(
            err?.error?.message || { key: 'notifications.roles.deleteError' },
            {
              details: err?.error?.errors instanceof Array ? err.error.errors : undefined,
            }
          );
          this.cdr.detectChanges();
        },
      });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil((this.pageData.total || 0) / (this.pageData.limit || 10)));
  }

  prev(): void {
    if (this.pageData.page <= 1) return;
    this.load(this.pageData.page - 1);
  }

  next(): void {
    if (this.pageData.page >= this.totalPages) return;
    this.load(this.pageData.page + 1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.pageData.page) return;
    this.load(page);
  }

  get paginationItems(): PaginationItem[] {
    const total = this.totalPages;
    const current = this.pageData.page;

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const items: PaginationItem[] = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    if (start > 2) items.push('...');
    for (let p = start; p <= end; p++) items.push(p);
    if (end < total - 1) items.push('...');

    items.push(total);
    return items;
  }

  trackById(_: number, item: RoleListRow): string {
    return item.id;
  }
}



