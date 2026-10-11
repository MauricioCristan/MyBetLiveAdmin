import { Injectable, signal } from '@angular/core';

export type ConfirmationOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmClass?: string;
};

type ConfirmationState = {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  confirmClass: string;
};

const DEFAULT_STATE: ConfirmationState = {
  open: false,
  title: '',
  message: '',
  confirmText: '',
  cancelText: '',
  confirmClass: 'btn-danger',
};

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  private resolver: ((result: boolean) => void) | null = null;
  private readonly stateSignal = signal<ConfirmationState>(DEFAULT_STATE);

  readonly state = this.stateSignal.asReadonly();

  confirm(options: ConfirmationOptions): Promise<boolean> {
    if (this.resolver) {
      this.resolver(false);
      this.resolver = null;
    }

    this.stateSignal.set({
      open: true,
      title: options.title || '',
      message: options.message,
      confirmText: options.confirmText || '',
      cancelText: options.cancelText || '',
      confirmClass: options.confirmClass || 'btn-danger',
    });

    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  accept(): void {
    this.close(true);
  }

  cancel(): void {
    this.close(false);
  }

  private close(result: boolean): void {
    const resolve = this.resolver;
    this.resolver = null;
    this.stateSignal.set(DEFAULT_STATE);
    resolve?.(result);
  }
}
