import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminConfirmDialogComponent } from '../../shared/admin-confirm-dialog.component';
import { OperationsView, SettingDTO } from '../models/setting.model';
import { SettingsService } from '../services/settings.service';
import { I18nPipe } from '../../../../core/i18n/i18n.pipe';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { PermissionService } from '../../../../core/auth/permission.service';
import { ADMIN_ROUTES } from '../../admin-routes';

type SettingInputType = 'boolean' | 'number' | 'text' | 'select';

interface SettingView extends SettingDTO {
  inputType: SettingInputType;
  section: `section.${string}`;
}

@Component({
  standalone: true,
  selector: 'app-settings-page',
  imports: [CommonModule, FormsModule, I18nPipe, RouterLink, AdminConfirmDialogComponent],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
})
export class SettingsPageComponent implements OnInit {
  private readonly route=inject(ActivatedRoute);
  get settingView():string{return this.route.snapshot.data['settingView']??'all';}
  get selectedSport():string{return (this.route.snapshot.paramMap.get('sport')??'').toLowerCase();}
  get overview():boolean{return this.settingView==='operations'&&!this.selectedSport;}
  visibleGroups(){return this.groupedRows.map(group=>({...group,rows:this.settingView==='operations'?[...group.rows].sort((a,b)=>this.fieldOrder(a.key)-this.fieldOrder(b.key)):group.rows}));}
  private belongsToView(key:string):boolean{
    if(this.settingView==='operations')return !!this.selectedSport&&key.startsWith(`mybet.runtime.${this.selectedSport}.`);
    if(this.settingView==='ads')return key.startsWith('mybet.ads.');
    return !key.startsWith('mybet.runtime.')&&!key.startsWith('mybet.ads.');
  }
  private fieldOrder(key:string){return ['provider','pollSeconds','dailyBudget','eventCacheSeconds','statsCacheSeconds','paused'].indexOf(key.split('.').at(-1)??'');}
  operationSports(){const order=['MLB','NBA','NFL','NHL','SOCCER'];const rank=(sport:string)=>{const i=order.indexOf(sport);return i<0?100:i;};return [...(this.operations?.sports??[])].sort((a,b)=>rank(a.sport)-rank(b.sport));}
  providerMarkets(row:SettingView,name:string){return this.operation(row.section.slice('section.'.length))?.providers?.find(p=>p.name===name)?.markets;}
  providerQuota(row:SettingView,name:string){return this.operation(row.section.slice('section.'.length))?.providers?.find(p=>p.name===name)?.quota;}
  pageTitle(){return this.settingView==='operations'?this.selectedSport?this.sectionLabel('section.'+this.selectedSport).replace('MyBetLive · ','')+' · Configuración':'Operación de APIs':this.settingView==='ads'?'Publicidad':this.i18n.translate('settings','title');}
  pendingProviderConfirmation=false;
  providerChanges(){return this.rows.filter(row=>row.key.endsWith('.provider')&&this.changedKeys.has(row.key)).map(row=>({sport:this.sectionLabel(row.section).replace('MyBetLive · ',''),from:this.providerLabel(this.initialValues.get(row.key)??''),to:this.providerLabel(this.draftValues[row.key]??'')}));}
  confirmProviderSave(){this.pendingProviderConfirmation=false;this.save(true);}
  private readonly settingsService = inject(SettingsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  private readonly notifications = inject(NotificationService);
  private readonly permissions = inject(PermissionService);

  loading = false;
  saving = false;
  backendError: string | null = null;
  successMessage: string | null = null;
  canReadSettings = false;
  canUpdateSettings = false;

  operations: OperationsView | null = null;
  operationsError: string | null = null;
  get isAdmin(): boolean { return this.permissions.hasAnyAdminRole(); }

  rows: SettingView[] = [];
  groupedRows: Array<{ section: SettingView['section']; rows: SettingView[] }> = [];

  draftValues: Record<string, string> = {};
  private readonly initialValues = new Map<string, string>();
  private readonly changedKeys = new Set<string>();

  ngOnInit(): void {
    this.permissions.ensureLoaded().subscribe({
      next: () => {
        this.canReadSettings = this.permissions.canRead('SETTING');
        this.canUpdateSettings = this.permissions.canUpdate('SETTING');

        if (!this.canReadSettings || (this.settingView!=='all'&&!this.isAdmin)) {
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

  load(): void {
    this.loading = true;
    this.backendError = null;
    this.successMessage = null;
    this.cdr.detectChanges();
    this.loadOperations();

    this.settingsService
      .list()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (settings) => {
          const sorted = settings.filter(item=>this.belongsToView(item.key)).sort((a, b) => a.key.localeCompare(b.key));

          this.rows = sorted.map((item) => ({
            ...item,
            description: item.key==='mybet.runtime.soccer.statsCacheSeconds'
              ?this.i18n.translate('settings','soccerStatsCache'):item.description,
            inputType: item.type ?? this.resolveInputType(item.value),
            section: this.resolveSection(item.key),
          }));

          this.groupedRows = this.groupBySection(this.rows);

          this.draftValues = {};
          this.initialValues.clear();
          this.changedKeys.clear();

          this.rows.forEach((item) => {
            this.draftValues[item.key] = item.value ?? '';
            this.initialValues.set(item.key, item.value ?? '');
          });

          this.cdr.detectChanges();
        },
        error: (err) => {
          this.backendError = err?.error?.message ?? this.i18n.translate('settings', 'errorLoad');
          this.cdr.detectChanges();
        },
      });
  }

  onValueChange(key: string, value: string): void {
    if (!this.canUpdateSettings) return;
    this.draftValues[key] = value == null ? '' : String(value);
    this.recomputeDirtyState(key);
  }

  onBooleanChange(key: string, checked: boolean): void {
    if (!this.canUpdateSettings) return;
    this.draftValues[key] = checked ? 'true' : 'false';
    this.recomputeDirtyState(key);
  }

  isBooleanTrue(value: string | undefined): boolean {
    return (value ?? '').toLowerCase() === 'true';
  }

  isRowDirty(key: string): boolean {
    return this.changedKeys.has(key);
  }

  save(providerConfirmed = false): void {
    if (!this.canUpdateSettings) return;
    if (!this.hasChanges || this.saving || this.hasInvalidValues) return;

    if(!providerConfirmed && this.providerChanges().length){this.pendingProviderConfirmation=true;this.cdr.detectChanges();return;}
    this.saving = true;
    this.backendError = null;
    this.successMessage = null;
    this.cdr.detectChanges();

    const values: Record<string, string> = {};

    this.rows.forEach((row) => {
      if (!row.editable) return;
      if (!this.changedKeys.has(row.key)) return;
      values[row.key] = this.draftValues[row.key] ?? '';
    });

    const changesCount = Object.keys(values).length;
    if (changesCount === 0) {
      this.saving = false;
      this.cdr.detectChanges();
      return;
    }

    this.settingsService
      .update(values)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          Object.entries(values).forEach(([key, value]) => {
            this.initialValues.set(key, value);
            this.changedKeys.delete(key);
          });

          this.successMessage =
            changesCount === 1
              ? this.i18n.translate('settings', 'successOne', { count: changesCount })
              : this.i18n.translate('settings', 'successMany', { count: changesCount });
          this.loadOperations();
          this.notifications.success({ key: 'notifications.settings.updated' });

          this.cdr.detectChanges();
        },
        error: (err) => {
          this.backendError = err?.error?.message ?? this.i18n.translate('settings', 'errorSave');
          this.notifications.error(
            err?.error?.message || { key: 'notifications.settings.updateError' },
            {
              details: err?.error?.errors instanceof Array ? err.error.errors : undefined,
            }
          );
          this.cdr.detectChanges();
        },
      });
  }

  resetChanges(): void {
    if (!this.canUpdateSettings) return;
    this.rows.forEach((row) => {
      this.draftValues[row.key] = this.initialValues.get(row.key) ?? '';
    });

    this.changedKeys.clear();
    this.successMessage = null;
    this.backendError = null;
    this.cdr.detectChanges();
  }

  get dirtyCount(): number {
    return this.changedKeys.size;
  }

  get hasChanges(): boolean {
    return this.dirtyCount > 0;
  }

  loadOperations(): void {
    if (!this.isAdmin || this.settingView!=='operations') return;
    this.operationsError = null;
    this.settingsService.operations().subscribe({next: value => {this.operations=value; this.cdr.detectChanges();},
      error: () => {this.operationsError=this.i18n.translate('settings','operationsError'); this.cdr.detectChanges();}});
  }

  operation(sport: string) {return this.operations?.sports.find(item => item.sport.toLowerCase() === sport);}
  isRuntime(section: string): boolean {return this.rows.some(row=>row.section===section&&row.key.startsWith('mybet.runtime.'));}
  sectionLabel(section:string):string {const label=this.i18n.translate('settings',section);return label===section?section.slice('section.'.length).toUpperCase():label;}
  providerLabel(name: string): string {return name.startsWith('BALLDONTLIE_')?'BALLDONTLIE':name.startsWith('API_SPORTS_')?'API-Sports':name;}
  providerConfigured(row: SettingView,name: string): boolean {
    const sport=row.section.slice('section.'.length);return this.operation(sport)?.providers?.find(p=>p.name===name)?.configured ?? true;
  }
  invalid(row: SettingView): boolean {
    if(row.inputType==='select')return !row.options?.includes(this.draftValues[row.key] ?? '');
    if (!(row.key.startsWith('mybet.runtime.') || row.key.startsWith('mybet.ads.')) || row.inputType !== 'number') return false;
    const value=this.draftValues[row.key] ?? '';
    return !/^[0-9]{1,7}$/.test(value) || Number(value) < (row.min ?? 0) || Number(value) > (row.max ?? Infinity);
  }
  get hasInvalidValues(): boolean {return this.rows.some(row => this.invalid(row));}

  trackByKey(_: number, item: SettingView): string {
    return item.key;
  }

  private recomputeDirtyState(key: string): void {
    const initial = this.initialValues.get(key) ?? '';
    const current = this.draftValues[key] ?? '';

    if (initial === current) {
      this.changedKeys.delete(key);
    } else {
      this.changedKeys.add(key);
    }

    this.successMessage = null;
    this.cdr.detectChanges();
  }

  private resolveSection(key: string): SettingView['section'] {
    if(key.startsWith('mybet.ads.')) return 'section.ads';
    const sport=/^mybet\.runtime\.([^.]+)\./.exec(key);if(sport)return `section.${sport[1]}`;
    if (key.startsWith('email.')) return 'section.email';
    if (key.startsWith('frontend.')) return 'section.frontend';
    if (key.startsWith('security.')) return 'section.security';
    return 'section.general';
  }

  private resolveInputType(value: string | null | undefined): SettingInputType {
    const normalized = (value ?? '').trim().toLowerCase();

    if (normalized === 'true' || normalized === 'false') {
      return 'boolean';
    }

    if (/^-?\d+$/.test(normalized)) {
      return 'number';
    }

    return 'text';
  }

  private groupBySection(rows: SettingView[]): Array<{ section: SettingView['section']; rows: SettingView[] }> {
    const generalOrder=['section.general','section.email','section.frontend','section.security'];
    const rank=(section:string)=>section==='section.ads'?0:this.isRuntime(section)?1:2+generalOrder.indexOf(section);
    const map = new Map<SettingView['section'], SettingView[]>();

    rows.forEach((row) => {
      if (!map.has(row.section)) {
        map.set(row.section, []);
      }
      map.get(row.section)?.push(row);
    });

    return [...map.entries()]
      .sort((a, b) => rank(a[0])-rank(b[0]) ||
        (this.operationOrder(a[0])-this.operationOrder(b[0])) || a[0].localeCompare(b[0]))
      .map(([section, sectionRows]) => ({ section, rows: sectionRows }));
  }
  private operationOrder(section:string):number {const index=this.operations?.sports.findIndex(s=>`section.${s.sport.toLowerCase()}`===section)??-1;return index<0?100:index;}
}
