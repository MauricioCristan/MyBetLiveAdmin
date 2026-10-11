import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nNamespace } from './i18n.registry';
import { I18nService } from './i18n.service';

@Pipe({
  name: 't',
  standalone: true,
  pure: false,
})
export class I18nPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(
    key: string,
    namespace: I18nNamespace,
    params?: Record<string, string | number | boolean | null | undefined>
  ): string {
    return this.i18n.translate(namespace, key, params);
  }
}
