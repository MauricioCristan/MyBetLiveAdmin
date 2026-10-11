import { CanDeactivateFn } from '@angular/router';
import { SettingsPageComponent } from './pages/settings.page';
export const settingsPendingGuard:CanDeactivateFn<SettingsPageComponent> = (component,_route,_current,next) =>
 !!next && !next.url.startsWith('/admin') || !component.hasChanges || window.confirm('Hay cambios sin guardar. ¿Quieres descartarlos y salir?');
