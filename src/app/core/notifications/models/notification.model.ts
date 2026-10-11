export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export type NotificationParams = Record<string, string | number | boolean | null | undefined>;

export interface NotificationI18nMessage {
  key: string;
  params?: NotificationParams;
}

export type NotificationMessage = string | NotificationI18nMessage;

export interface NotificationAction {
  label: NotificationMessage;
  callback: () => void | Promise<void>;
  dismissOnClick?: boolean;
}

export interface NotificationOptions {
  title?: NotificationMessage;
  sticky?: boolean;
  durationMs?: number;
  preventDuplicate?: boolean;
  details?: readonly string[];
  action?: NotificationAction;
}

export interface Notification {
  id?: string;
  type: NotificationType;
  message: NotificationMessage;
  title?: NotificationMessage;
  sticky?: boolean;
  durationMs?: number;
  preventDuplicate?: boolean;
  details?: readonly string[];
  action?: NotificationAction;
  createdAt?: number;
}

export interface NotificationViewModel {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  sticky: boolean;
  durationMs?: number;
  details: readonly string[];
  action?: {
    label: string;
    callback: () => void | Promise<void>;
    dismissOnClick: boolean;
  };
  createdAt: number;
}

export interface NotificationConfig {
  maxVisible: number;
  dedupeWindowMs: number;
  durations: Record<NotificationType, number>;
  preventDuplicateByDefault: boolean;
}
