import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SettingsPageComponent } from './settings.page';
import { SettingsService } from '../services/settings.service';
import { PermissionService } from '../../../../core/auth/permission.service';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { I18nService } from '../../../../core/i18n/i18n.service';

describe('MyBetLive operational settings', () => {
  it('renders provider choices, blocks missing credentials, and saves through Settings',async()=>{
    const providerKey='mybet.runtime.nfl.provider';
    api.list.mockReturnValue(of([...rows,{key:providerKey,value:'API_SPORTS_NFL',description:'Proveedor de datos deportivos',editable:true,type:'select',options:['API_SPORTS_NFL','BALLDONTLIE_NFL']} ]));
    api.operations.mockReturnValue(of({...state,sports:[{...state.sports[0],selectedProvider:'API_SPORTS_NFL',providers:[
      {name:'API_SPORTS_NFL',configured:true,markets:['MONEYLINE'],quota:null},
      {name:'BALLDONTLIE_NFL',configured:false,markets:['MONEYLINE'],quota:null}]}]}));
    const fixture=await page();const choices=fixture.nativeElement.querySelectorAll('input[type="radio"]');
    expect(choices.length).toBe(2);expect(choices[1].disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('proveedor original');
    const component=fixture.componentInstance;component.onValueChange(providerKey,'not-a-provider');
    component.save();expect(api.update).not.toHaveBeenCalled();
    component.onValueChange(providerKey,'BALLDONTLIE_NFL');component.save();
    expect(component.pendingProviderConfirmation).toBe(true);expect(api.update).not.toHaveBeenCalled();component.confirmProviderSave();
    expect(api.update).toHaveBeenCalledWith({[providerKey]:'BALLDONTLIE_NFL'});
  });
  const key = 'mybet.runtime.nfl.pollSeconds';
  const rows = [
    {key,value:'600',description:'Intervalo de consulta automática',editable:true,type:'number',unit:'seconds',min:3,max:86400},
    {key:'mybet.runtime.soccer.paused',value:'false',description:'Pausar consultas',editable:true,type:'boolean'},
    {key:'mybet.runtime.mlb.dailyBudget',value:'90',description:'Presupuesto diario',editable:true,type:'number',unit:'requests/day',min:1,max:1000000},
    {key:'mybet.runtime.nba.pollSeconds',value:'60',description:'Intervalo NBA',editable:true,type:'number',unit:'seconds',min:3,max:86400},
  ];
  const state = {generatedAt:'2026-10-04T09:00:00Z',appliedAt:'2026-10-04T08:00:00Z',pollingEnabled:true,
    sports:[{sport:'NFL',integrated:true,state:'OPERATING',config:{},quota:{localRequestsToday:2,dailyBudget:90,remoteDailyRemaining:null,lastSuccessAt:null,minuteBudget:8}},
      {sport:'SOCCER',integrated:true,state:'OPERATING',config:{},quota:null},
      {sport:'MLB',integrated:true,state:'OPERATING',config:{},quota:null},
      {sport:'NBA',integrated:true,state:'OPERATING',config:{},playerStatsEnabled:true,quota:null}]};
  const api = {list:vi.fn(),update:vi.fn(),operations:vi.fn()};
  const route={snapshot:{data:{settingView:'operations'},paramMap:convertToParamMap({sport:'nfl'})}};
  const permissions = {ensureLoaded:()=>of(void 0),canRead:()=>true,canUpdate:()=>true,hasAnyAdminRole:vi.fn()};
  beforeEach(async()=>{
    vi.clearAllMocks();api.list.mockReturnValue(of(rows));api.update.mockReturnValue(of(void 0));api.operations.mockReturnValue(of(state));permissions.hasAnyAdminRole.mockReturnValue(true);
    route.snapshot.data.settingView='operations';route.snapshot.paramMap=convertToParamMap({sport:'nfl'});
    await TestBed.configureTestingModule({imports:[SettingsPageComponent],providers:[provideRouter([]),
      {provide:SettingsService,useValue:api},{provide:PermissionService,useValue:permissions},{provide:ActivatedRoute,useValue:route},
      {provide:NotificationService,useValue:{success:vi.fn(),error:vi.fn()}}]}).compileComponents();
    TestBed.inject(I18nService).setLanguage('es');
  });
  async function page(){const fixture=TestBed.createComponent(SettingsPageComponent);fixture.detectChanges();await fixture.whenStable();fixture.detectChanges();return fixture;}
  it('groups by sport and shows status without making manual provider checks',async()=>{
    const fixture=await page();expect(api.operations).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.groupedRows.map(g=>g.section)).toEqual(['section.nfl']);
    expect(fixture.nativeElement.textContent).toContain('Operativo');
    const input=fixture.nativeElement.querySelector('input[type="number"]');expect(input.min).toBe('3');expect(input.max).toBe('86400');
  });
  it('accepts 3 and 60 seconds and normalizes number values into the existing string payload',async()=>{
    const fixture=await page();const component=fixture.componentInstance;
    component.onValueChange(key,3 as unknown as string);expect(component.hasInvalidValues).toBe(false);component.save();
    expect(api.update).toHaveBeenCalledWith({[key]:'3'});
    component.onValueChange(key,'60');component.save();expect(api.update).toHaveBeenLastCalledWith({[key]:'60'});
    expect(api.operations).toHaveBeenCalledTimes(3);
  });
  it('renders an additional runtime sport without a client code list',async()=>{
    route.snapshot.paramMap=convertToParamMap({sport:'hockey'});
    api.list.mockReturnValue(of([...rows,{key:'mybet.runtime.hockey.pollSeconds',value:'60',description:'Consulta',editable:true,type:'number',unit:'seconds',min:3,max:86400}]));
    const fixture=await page();expect(fixture.componentInstance.groupedRows.some(g=>g.section==='section.hockey')).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('HOCKEY');expect(fixture.componentInstance.isRuntime('section.hockey')).toBe(true);
  });
  it('rejects invalid numbers locally and discards unsaved changes',async()=>{
    const fixture=await page();const component=fixture.componentInstance;
    for(const value of ['2','1.5','','86401']){component.onValueChange(key,value);expect(component.hasInvalidValues).toBe(true);component.save();}
    expect(api.update).not.toHaveBeenCalled();component.resetChanges();expect(component.draftValues[key]).toBe('600');expect(component.hasChanges).toBe(false);
  });
  it('shows load and save failures while retaining the draft for correction',async()=>{
    const fixture=await page();const component=fixture.componentInstance;api.update.mockReturnValue(throwError(()=>({error:{message:'No se guardó'}})));
    component.onValueChange(key,'60');component.save();expect(component.backendError).toBe('No se guardó');expect(component.hasChanges).toBe(true);
    api.operations.mockReturnValue(throwError(()=>({status:503})));component.loadOperations();expect(component.operationsError).toBeTruthy();
  });
  it('does not request admin diagnostics for readers without ADMIN',async()=>{
    route.snapshot.data.settingView='all';permissions.hasAnyAdminRole.mockReturnValue(false);await page();expect(api.operations).not.toHaveBeenCalled();
  });
  it('groups ad controls and enforces frequency limits before saving',async()=>{
    route.snapshot.data.settingView='ads';
    const adKey='mybet.ads.everyItems';
    api.list.mockReturnValue(of([...rows,
      {key:adKey,value:'5',description:'Frecuencia',editable:true,type:'number',unit:'cards',min:3,max:50},
      {key:'mybet.ads.enabled',value:'true',description:'Activar',editable:true,type:'boolean'}]));
    const fixture=await page();const component=fixture.componentInstance;
    expect(component.groupedRows[0].section).toBe('section.ads');
    expect(fixture.nativeElement.textContent).toContain('anuncios');
    component.onValueChange(adKey,'2');component.save();expect(api.update).not.toHaveBeenCalled();
    component.onValueChange(adKey,'50');component.save();expect(api.update).toHaveBeenCalledWith({[adKey]:'50'});
  });
});
