import userEs from '../../features/admin/users/i18n/user.es.json';
import userEn from '../../features/admin/users/i18n/user.en.json';
import roleEs from '../../features/admin/roles/i18n/role.es.json';
import roleEn from '../../features/admin/roles/i18n/role.en.json';
import settingsEs from '../../features/admin/settings/i18n/settings.es.json';
import settingsEn from '../../features/admin/settings/i18n/settings.en.json';
import authEs from '../../features/auth/i18n/auth.es.json';
import authEn from '../../features/auth/i18n/auth.en.json';
import layoutEs from '../../features/admin/layout/i18n/layout.es.json';
import layoutEn from '../../features/admin/layout/i18n/layout.en.json';
import notificationsEs from '../notifications/i18n/notifications.es.json';
import notificationsEn from '../notifications/i18n/notifications.en.json';

export type SupportedLang = 'es' | 'en';
export type I18nNamespace = 'users' | 'roles' | 'settings' | 'auth' | 'layout' | 'notifications';

export type TranslationDict = Record<string, unknown>;

export const I18N_MESSAGES: Record<SupportedLang, Record<I18nNamespace, TranslationDict>> = {
  es: {
    users: userEs,
    roles: roleEs,
    settings: settingsEs,
    auth: authEs,
    layout: layoutEs,
    notifications: notificationsEs,
  },
  en: {
    users: userEn,
    roles: roleEn,
    settings: settingsEn,
    auth: authEn,
    layout: layoutEn,
    notifications: notificationsEn,
  },
};
