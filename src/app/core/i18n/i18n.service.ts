import { Injectable, signal } from '@angular/core';
import { I18N_MESSAGES, I18nNamespace, SupportedLang } from './i18n.registry';

const LANG_STORAGE_KEY = 'seed_lang';
type I18nParams = Record<string, string | number | boolean | null | undefined>;

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly langSignal = signal<SupportedLang>(this.readInitialLanguage());

  readonly lang = this.langSignal.asReadonly();

  setLanguage(lang: SupportedLang): void {
    if (this.langSignal() === lang) return;
    this.langSignal.set(lang);
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  }

  translate(namespace: I18nNamespace, key: string, params?: I18nParams): string {
    const lang = this.langSignal();
    const template = this.resolveKey(I18N_MESSAGES[lang]?.[namespace], key);
    const text = typeof template === 'string' ? template : key;

    if (!params) return text;

    return text.replace(/\{(\w+)\}/g, (_, token: string) => String(params[token] ?? `{${token}}`));
  }

  private readInitialLanguage(): SupportedLang {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === 'es' || stored === 'en') return stored;

    const browser = (navigator.language || 'es').toLowerCase();
    return browser.startsWith('en') ? 'en' : 'es';
  }

  private resolveKey(source: Record<string, unknown> | undefined, dottedKey: string): unknown {
    if (!source) return undefined;
    return dottedKey
      .split('.')
      .reduce<unknown>(
        (acc, part) =>
          acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)
            ? (acc as Record<string, unknown>)[part]
            : undefined,
        source
      );
  }
}
