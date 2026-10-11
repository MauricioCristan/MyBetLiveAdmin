import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SettingsPageComponent } from './settings.page';
import { SettingsService } from '../services/settings.service';
import { PermissionService } from '../../../../core/auth/permission.service';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { settingsPendingGuard } from '../settings-pending.guard';

describe('MyBetLive provider and advertising views',()=>{
 const rows=[{key:'mybet.runtime.mlb.provider',value:'API_SPORTS_MLB',description:'Proveedor',editable:true,type:'select',options:['API_SPORTS_MLB','BALLDONTLIE_MLB']},
 {key:'mybet.runtime.mlb.pollSeconds',value:'600',description:'Intervalo',editable:true,type:'number',min:3,max:86400},
 {key:'mybet.runtime.nfl.pollSeconds',value:'600',description:'NFL',editable:true,type:'number',min:3,max:86400},
 {key:'mybet.ads.enabled',value:'true',description:'Publicidad Free',editable:true,type:'boolean'},
 {key:'frontend.name',value:'MyBetLive',description:'Nombre del sitio',editable:true}];
 const operations={generatedAt:'2026-10-08T06:00:00Z',appliedAt:'2026-10-08T05:00:00Z',pollingEnabled:true,sports:[{sport:'MLB',state:'OPERATING',selectedProvider:'API_SPORTS_MLB',config:{dailyBudget:90},quota:{localRequestsToday:24,dailyBudget:90},providers:[{name:'API_SPORTS_MLB',configured:true,quota:{localRequestsToday:24,dailyBudget:90}},{name:'BALLDONTLIE_MLB',configured:true,quota:{localRequestsToday:1,dailyBudget:90}}]}]};
 const api={list:vi.fn(()=>of(rows)),operations:vi.fn(()=>of(operations)),update:vi.fn(()=>of(void 0))};
 const route={snapshot:{data:{settingView:'operations'},paramMap:convertToParamMap({})}};
 beforeEach(async()=>{vi.clearAllMocks();route.snapshot.data.settingView='operations';route.snapshot.paramMap=convertToParamMap({});
  await TestBed.configureTestingModule({imports:[SettingsPageComponent],providers:[provideRouter([]),{provide:ActivatedRoute,useValue:route},
   {provide:SettingsService,useValue:api},{provide:PermissionService,useValue:{ensureLoaded:()=>of(void 0),canRead:()=>true,canUpdate:()=>true,hasAnyAdminRole:()=>true}},
   {provide:NotificationService,useValue:{success:vi.fn(),error:vi.fn()}}]}).compileComponents();});
 async function page(){const f=TestBed.createComponent(SettingsPageComponent);f.detectChanges();await f.whenStable();f.detectChanges();return f;}
 it('keeps general configuration separate from API and advertising controls',async()=>{
  route.snapshot.data.settingView='all';const f=await page();const c=f.componentInstance;
  expect(c.rows.map(r=>r.key)).toEqual(['frontend.name']);expect(api.operations).not.toHaveBeenCalled();
  expect(f.nativeElement.querySelector('.runtime-card')).toBeNull();expect(f.nativeElement.querySelector('.operation-help')).toBeNull();
  c.onValueChange('frontend.name','Nuevo nombre');c.save();expect(api.update).toHaveBeenCalledWith({'frontend.name':'Nuevo nombre'});
 });
 it('shows provider summaries without an editable advertising section or external checks',async()=>{
  const f=await page();expect(f.nativeElement.querySelector('.operation-card').textContent).toContain('24 / 90');
  expect(f.nativeElement.querySelector('a[href="/admin/settings/operations/mlb"]')).not.toBeNull();
  expect(f.nativeElement.querySelector('input[type="radio"]')).toBeNull();expect(f.nativeElement.textContent).not.toContain('Publicidad Free');expect(api.update).not.toHaveBeenCalled();
 });
 it('confirms provider changes and preserves the draft when canceled',async()=>{
  route.snapshot.paramMap=convertToParamMap({sport:'mlb'});const f=await page();const c=f.componentInstance;
  expect(f.nativeElement.querySelectorAll('input[type="radio"]')).toHaveLength(2);expect(c.visibleGroups().map(g=>g.section)).toEqual(['section.mlb']);
  c.onValueChange('mybet.runtime.mlb.provider','BALLDONTLIE_MLB');c.save();f.detectChanges();
  expect(f.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();expect(api.update).not.toHaveBeenCalled();
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));f.detectChanges();
  expect(c.pendingProviderConfirmation).toBe(false);expect(c.hasChanges).toBe(true);expect(api.update).not.toHaveBeenCalled();
  c.save();f.detectChanges();const buttons=f.nativeElement.querySelectorAll('[role="dialog"] button') as NodeListOf<HTMLButtonElement>;
  buttons[1].focus();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));expect(document.activeElement).toBe(buttons[0]);
  c.confirmProviderSave();expect(api.update).toHaveBeenCalledWith({'mybet.runtime.mlb.provider':'BALLDONTLIE_MLB'});
 });
 it('limits the advertising view to its settings and discards drafts',async()=>{
  route.snapshot.data.settingView='ads';const f=await page();const c=f.componentInstance;
  expect(c.visibleGroups().map(g=>g.section)).toEqual(['section.ads']);expect(f.nativeElement.querySelector('.provider-choice')).toBeNull();
  c.onBooleanChange('mybet.ads.enabled',false);expect(c.hasChanges).toBe(true);c.resetChanges();expect(c.hasChanges).toBe(false);expect(c.draftValues['mybet.ads.enabled']).toBe('true');
 });
 it('blocks leaving a dirty view until discard is accepted',()=>{
  const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);const guard=settingsPendingGuard as (component:any,...args:any[])=>boolean;
  expect(guard({hasChanges:false})).toBe(true);expect(confirm).not.toHaveBeenCalled();expect(guard({hasChanges:true})).toBe(false);
  confirm.mockReturnValue(true);expect(guard({hasChanges:true})).toBe(true);confirm.mockRestore();
 });
 it('allows logout even when a configuration draft is dirty',()=>{
  const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);const guard=settingsPendingGuard as (component:any,...args:any[])=>boolean;
  expect(guard({hasChanges:true},null,null,{url:'/login'})).toBe(true);expect(confirm).not.toHaveBeenCalled();confirm.mockRestore();
 });
});
