import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationViewModel } from '../models/notification.model';
import { NotificationService } from '../notification.service';

@Component({
  standalone: true,
  selector: 'app-notification-container',
  imports: [CommonModule],
  templateUrl: './notification-container.component.html',
  styleUrl: './notification-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationContainerComponent {
  private readonly notifications = inject(NotificationService);

  readonly toasts$ = this.notifications.toasts$;

  dismiss(id: string): void {
    this.notifications.dismiss(id);
  }

  dismissAll(): void {
    this.notifications.clearAll();
  }

  async runAction(toast: NotificationViewModel): Promise<void> {
    if (!toast.action) return;

    await toast.action.callback();

    if (toast.action.dismissOnClick) {
      this.dismiss(toast.id);
    }
  }

  toastClass(type: NotificationViewModel['type']): string {
    switch (type) {
      case 'success':
        return 'text-bg-success';
      case 'info':
        return 'text-bg-info';
      case 'warning':
        return 'text-bg-warning';
      case 'error':
        return 'text-bg-danger';
      default:
        return 'text-bg-secondary';
    }
  }

  liveRole(type: NotificationViewModel['type']): 'status' | 'alert' {
    return type === 'error' ? 'alert' : 'status';
  }

  livePoliteness(type: NotificationViewModel['type']): 'polite' | 'assertive' {
    return type === 'error' ? 'assertive' : 'polite';
  }

  trackById(_: number, item: NotificationViewModel): string {
    return item.id;
  }
}
