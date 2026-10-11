import { inject, Injectable, InjectionToken } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, timer } from 'rxjs';
import { I18nService } from '../i18n/i18n.service';
import { I18nNamespace } from '../i18n/i18n.registry';
import {
  Notification,
  NotificationConfig,
  NotificationMessage,
  NotificationOptions,
  NotificationType,
  NotificationViewModel,
} from './models/notification.model';

export const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  maxVisible: 5,
  dedupeWindowMs: 1000,
  durations: {
    success: 3500,
    info: 3500,
    warning: 5000,
    error: 7000,
  },
  preventDuplicateByDefault: true,
};

export const NOTIFICATION_CONFIG = new InjectionToken<Partial<NotificationConfig>>(
  'NOTIFICATION_CONFIG'
);

const I18N_NAMESPACES: ReadonlySet<string> = new Set<I18nNamespace>([
  'users',
  'roles',
  'settings',
  'auth',
  'layout',
  'notifications',
]);

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly i18n = inject(I18nService, { optional: true });
  private readonly configOverride = inject(NOTIFICATION_CONFIG, { optional: true });

  private readonly config: NotificationConfig = {
    ...DEFAULT_NOTIFICATION_CONFIG,
    ...(this.configOverride ?? {}),
    durations: {
      ...DEFAULT_NOTIFICATION_CONFIG.durations,
      ...(this.configOverride?.durations ?? {}),
    },
  };

  private readonly toastsSubject = new BehaviorSubject<readonly NotificationViewModel[]>([]);
  private readonly dismissTimers = new Map<string, Subscription>();
  private readonly recentFingerprints = new Map<string, number>();

  readonly toasts$: Observable<readonly NotificationViewModel[]> = this.toastsSubject.asObservable();

  success(message: NotificationMessage, options?: NotificationOptions): string | null {
    return this.show({ type: 'success', message, ...options });
  }

  info(message: NotificationMessage, options?: NotificationOptions): string | null {
    return this.show({ type: 'info', message, ...options });
  }

  warning(message: NotificationMessage, options?: NotificationOptions): string | null {
    return this.show({ type: 'warning', message, ...options });
  }

  error(message: NotificationMessage, options?: NotificationOptions): string | null {
    return this.show({ type: 'error', message, ...options });
  }

  show(notification: Notification): string | null {
    const createdAt = notification.createdAt ?? Date.now();
    const id = notification.id ?? this.createId(createdAt);

    const message = this.resolveMessage(notification.message);
    const title = notification.title ? this.resolveMessage(notification.title) : undefined;

    const preventDuplicate =
      notification.preventDuplicate ?? this.config.preventDuplicateByDefault;

    if (preventDuplicate && this.isDuplicate(notification.type, message, createdAt)) {
      return null;
    }

    const sticky = notification.sticky ?? this.defaultSticky(notification.type);
    const durationMs = sticky
      ? undefined
      : Math.max(0, notification.durationMs ?? this.config.durations[notification.type]);

    const toast: NotificationViewModel = {
      id,
      type: notification.type,
      message,
      title,
      sticky,
      durationMs,
      details: notification.details ?? [],
      action: notification.action
        ? {
            label: this.resolveMessage(notification.action.label),
            callback: notification.action.callback,
            dismissOnClick: notification.action.dismissOnClick ?? true,
          }
        : undefined,
      createdAt,
    };

    const current = this.toastsSubject.value;
    const next = [...current, toast];

    while (next.length > this.config.maxVisible) {
      const oldest = next.shift();
      if (oldest) this.cancelDismissTimer(oldest.id);
    }

    this.toastsSubject.next(next);

    if (!sticky && durationMs && durationMs > 0) {
      this.startDismissTimer(id, durationMs);
    }

    return id;
  }

  dismiss(id: string): void {
    this.cancelDismissTimer(id);
    this.toastsSubject.next(this.toastsSubject.value.filter((item) => item.id !== id));
  }

  clearAll(): void {
    for (const id of this.dismissTimers.keys()) {
      this.cancelDismissTimer(id);
    }
    this.toastsSubject.next([]);
  }

  private resolveMessage(input: NotificationMessage): string {
    if (typeof input === 'string') return input;

    if (!this.i18n) {
      return input.key;
    }

    const keyParts = input.key.split('.');
    const namespace = keyParts[0];

    if (namespace && I18N_NAMESPACES.has(namespace) && keyParts.length > 1) {
      const scopedKey = keyParts.slice(1).join('.');
      return this.i18n.translate(namespace as I18nNamespace, scopedKey, input.params);
    }

    // fallback: if key does not include namespace, use notifications namespace
    return this.i18n.translate('notifications', input.key, input.params);
  }

  private defaultSticky(type: NotificationType): boolean {
    return type === 'error';
  }

  private createId(createdAt: number): string {
    const random = Math.random().toString(36).slice(2, 10);
    return `ntf_${createdAt}_${random}`;
  }

  private startDismissTimer(id: string, durationMs: number): void {
    this.cancelDismissTimer(id);
    const subscription = timer(durationMs).subscribe(() => this.dismiss(id));
    this.dismissTimers.set(id, subscription);
  }

  private cancelDismissTimer(id: string): void {
    const existing = this.dismissTimers.get(id);
    if (!existing) return;

    existing.unsubscribe();
    this.dismissTimers.delete(id);
  }

  private isDuplicate(type: NotificationType, message: string, now: number): boolean {
    const fingerprint = `${type}:${message}`;
    const previous = this.recentFingerprints.get(fingerprint);

    this.cleanupFingerprints(now);

    if (typeof previous === 'number' && now - previous < this.config.dedupeWindowMs) {
      return true;
    }

    this.recentFingerprints.set(fingerprint, now);
    return false;
  }

  private cleanupFingerprints(now: number): void {
    for (const [fingerprint, timestamp] of this.recentFingerprints.entries()) {
      if (now - timestamp > this.config.dedupeWindowMs) {
        this.recentFingerprints.delete(fingerprint);
      }
    }
  }
}
