import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { UserService } from '../../services/user.service';
import { UserListRow } from '../../models/user.model';
import { I18nPipe } from '../../../../../core/i18n/i18n.pipe';
import { I18nService } from '../../../../../core/i18n/i18n.service';
import { NotificationService } from '../../../../../core/notifications/notification.service';
import { ADMIN_ROUTES } from '../../../admin-routes';
import { PermissionService } from '../../../../../core/auth/permission.service';
import { ConfirmationService } from '../../../../../core/confirmation/confirmation.service';

type SortDir = 'asc' | 'desc';
type SortField = 'username' | 'email' | 'enabled' | 'createdAt' | 'updatedAt';
type PaginationItem = number | '...';

@Component({
  standalone: true,
  selector: 'app-user-list',
  imports: [CommonModule, RouterModule, FormsModule, I18nPipe],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  private readonly users = inject(UserService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly i18n = inject(I18nService);
  private readonly notifications = inject(NotificationService);
  private readonly permissions = inject(PermissionService);
  private readonly confirmation = inject(ConfirmationService);

  loading = false;
  backendError: string | null = null;

  query = {
    username: '',
    email: '',
    enabled: '' as '' | 'true' | 'false',
  };

  pageData = {
    data: [] as UserListRow[],
    page: 1,
    limit: 10,
    total: 0,
  };

  deletingId: string | null = null;
  canReadUser = false;
  canCreateUser = false;
  canUpdateUser = false;
  canDeleteUser = false;

  // ✅ Orden default: creado desc
  sort: { field: SortField; dir: SortDir } = { field: 'createdAt', dir: 'desc' };

  ngOnInit(): void {
    this.permissions.ensureLoaded().subscribe({
      next: () => {
        this.canReadUser = this.permissions.canRead('USER');
        this.canCreateUser = this.permissions.canCreate('USER');
        this.canUpdateUser = this.permissions.canUpdate('USER');
        this.canDeleteUser = this.permissions.canDelete('USER');

        if (!this.canReadUser) {
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

    this.users
      .list({
        page,
        limit: this.pageData.limit,
        search: this.searchFilters,
        order: this.orderParam, // ✅ aquí va lo seleccionado
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
          this.backendError = err?.error?.message || this.i18n.translate('users', 'list.errorLoad');
          this.cdr.detectChanges();
        },
      });
  }

  // ✅ "createdAt:desc" etc
  get orderParam(): string {
    return `${this.sort.field}:${this.sort.dir}`;
  }

  // ✅ click en TH
  toggleSort(field: SortField): void {
    if (this.sort.field === field) {
      this.sort.dir = this.sort.dir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sort.field = field;
      this.sort.dir = 'asc'; // cuando cambias de columna, empieza en asc (puedes cambiarlo a desc si quieres)
    }

    this.pageData.page = 1;
    this.load(1);
  }

  // ✅ helper para pintar iconos / estado
  isSortedBy(field: SortField): boolean {
    return this.sort.field === field;
  }

  sortIcon(field: SortField): string {
    if (!this.isSortedBy(field)) return 'bi bi-arrow-down-up';
    return this.sort.dir === 'asc' ? 'bi bi-sort-up' : 'bi bi-sort-down';
  }

  onSearch(): void {
    this.pageData.page = 1;
    this.load(1);
  }

  clearSearch(): void {
    this.query.username = '';
    this.query.email = '';
    this.query.enabled = '';
    this.onSearch();
  }

  get searchFilters(): string[] {
    const filters: string[] = [];

    const username = this.query.username.trim();
    const email = this.query.email.trim();

    if (username) filters.push(`username=${username}`);
    if (email) filters.push(`email=${email}`);
    if (this.query.enabled) filters.push(`enabled=${this.query.enabled}`);

    return filters;
  }

  create(): void {
    if (!this.canCreateUser) return;
    this.router.navigate(ADMIN_ROUTES.USERS.CREATE.COMMANDS);
  }

  edit(id: string): void {
    if (!this.canReadUser) return;
    this.router.navigate(ADMIN_ROUTES.USERS.EDIT.commands(id));
  }

  async remove(id: string): Promise<void> {
    if (!this.canDeleteUser) return;
    if (this.deletingId) return;

    const ok = await this.confirmation.confirm({
      title: this.i18n.translate('layout', 'confirm.deleteTitle'),
      message: this.i18n.translate('users', 'list.deleteConfirm'),
      confirmClass: 'btn-danger',
    });
    if (!ok) return;

    this.deletingId = id;
    this.backendError = null;
    this.cdr.detectChanges();

    this.users
      .delete(id)
      .pipe(
        finalize(() => {
          this.deletingId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.notifications.success({ key: 'notifications.users.deleted' });
          this.load();
        },
        error: (err) => {
          this.backendError = err?.error?.message || this.i18n.translate('users', 'list.errorDelete');
          this.notifications.error(
            err?.error?.message || { key: 'notifications.users.deleteError' },
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

  trackById(_: number, item: UserListRow): string {
    return item.id;
  }
}



