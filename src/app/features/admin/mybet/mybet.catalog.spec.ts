import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { MyBetCatalogFormPage } from './mybet-catalog-form.page';
import { MyBetService } from './mybet.service';
describe('MyBet catalog forms',()=>{
 afterEach(()=>vi.restoreAllMocks());
 const soccer={code:'SOCCER',name:'Fútbol',description:'',enabled:true,integrated:true,available:true,version:0};
 const api={leagues:()=>of([]),availableLeagues:vi.fn(()=>of([{id:72,name:'Serie B',country:'Brazil'}])),sports:()=>of([soccer]),capabilities:()=>of([{code:'SOCCER',integrated:true,defaultLeagueId:null,leagueDiscovery:true}]),searchLeagues:vi.fn(()=>of([{id:72,name:'Serie B',country:'Brazil'}])),saveLeague:vi.fn(()=>of({})),saveSport:vi.fn(()=>of({}))};
 async function page(entity='leagues'){
  vi.clearAllMocks();await TestBed.configureTestingModule({imports:[MyBetCatalogFormPage],providers:[provideRouter([]),
   {provide:ActivatedRoute,useValue:{snapshot:{data:{entity},paramMap:convertToParamMap({})}}},{provide:MyBetService,useValue:api}]}).compileComponents();
  vi.spyOn(TestBed.inject(Router),'navigateByUrl').mockResolvedValue(true);
  const fixture=TestBed.createComponent(MyBetCatalogFormPage);await fixture.whenStable();return fixture.componentInstance;
 }
 it('does not spend football quota for searches shorter than three characters',async()=>{const component=await page();component.form.controls.sportCode.setValue('SOCCER');component.query='ab';await component.search();expect(api.searchLeagues).not.toHaveBeenCalled();});
 it('loads football automatically and filters locally without more provider requests',async()=>{
  const component=await page();expect(component.form.controls.sportCode.value).toBe('SOCCER');expect(api.availableLeagues).toHaveBeenCalledTimes(1);
  component.query='Brazil';expect(component.filteredAvailable().map(l=>l.id)).toEqual([72]);component.countryFilter='Mexico';expect(component.filteredAvailable()).toEqual([]);
  expect(api.availableLeagues).toHaveBeenCalledTimes(1);expect(api.searchLeagues).not.toHaveBeenCalled();
 });
 it('prevents duplicate league selection and rejects a manually invented id',async()=>{
  const component=await page();component.registered.set([{id:'SOCCER:72',sportCode:'SOCCER',externalId:72,name:'Serie B',country:'Brazil',enabled:false,version:0}]);
  component.selectLeague({id:72,name:'Serie B',country:'Brazil'});expect(component.form.controls.externalId.value).toBeNull();
  component.form.patchValue({externalId:999,name:'Invented',country:'Brazil'});await component.save();expect(api.saveLeague).not.toHaveBeenCalled();expect(component.error()).toContain('catálogo');
 });
 it('uses the selected canonical league in the dedicated create form',async()=>{
  const component=await page();component.form.controls.sportCode.setValue('SOCCER');component.selectLeague({id:72,name:'Serie B',country:'Brazil'});await component.save();
  expect(api.saveLeague).toHaveBeenCalledWith({sportCode:'SOCCER',externalId:72,name:'Serie B',country:'Brazil',enabled:true,version:0},null);
 });
 it('keeps future sports as drafts until a provider is integrated',async()=>{
  const component=await page('sports');component.form.patchValue({code:'HOCKEY',name:'Hockey',enabled:true});await component.save();expect(api.saveSport).not.toHaveBeenCalled();
  expect(component.error()).toContain('borrador');component.form.controls.enabled.setValue(false);await component.save();expect(api.saveSport).toHaveBeenCalledWith(expect.objectContaining({code:'HOCKEY',enabled:false}),null);
 });
 it('accepts a new integration announced by the server without a client sport list',async()=>{
  const component=await page('sports');component.integrations.set([{code:'HOCKEY',integrated:true,defaultLeagueId:7,leagueDiscovery:false}]);
  component.form.patchValue({code:'HOCKEY',name:'Hockey',enabled:true});await component.save();
  expect(api.saveSport).toHaveBeenCalledWith(expect.objectContaining({code:'HOCKEY',enabled:true}),null);
 });
 it('uses the league identifier supplied by capabilities',async()=>{
  const component=await page();component.integrations.set([{code:'HOCKEY',integrated:true,defaultLeagueId:7,leagueDiscovery:false}]);
  component.form.controls.sportCode.setValue('HOCKEY');component.sportChanged();expect(component.form.controls.externalId.value).toBe(7);
 });
 it('registers baseball leagues from its catalogue without requiring innings',async()=>{
  vi.spyOn(api,'sports').mockReturnValue(of([soccer,{...soccer,code:'MLB',name:'Béisbol'}]));
  vi.spyOn(api,'capabilities').mockReturnValue(of([{code:'SOCCER',integrated:true,defaultLeagueId:null,leagueDiscovery:true},{code:'MLB',integrated:true,defaultLeagueId:null,leagueDiscovery:true}]));
  api.availableLeagues.mockImplementation((sport?:string)=>of(sport==='MLB'?[{id:2,name:'Liga Mexicana',country:'Mexico'}]:[{id:72,name:'Serie B',country:'Brazil'}]));
  const component=await page();component.form.controls.sportCode.setValue('MLB');component.sportChanged();await Promise.resolve();await Promise.resolve();
  expect(api.availableLeagues).toHaveBeenLastCalledWith('MLB');expect(component.catalogName()).toBe('API-Baseball');
  component.query='Mexico';expect(component.filteredAvailable().map(l=>l.id)).toEqual([2]);
  component.selectLeague({id:2,name:'Liga Mexicana',country:'Mexico'});await component.save();
  expect(api.saveLeague).toHaveBeenCalledWith({sportCode:'MLB',externalId:2,name:'Liga Mexicana',country:'Mexico',enabled:true,version:0},null);
 });
 it('registers basketball leagues from the provider catalogue',async()=>{
  vi.spyOn(api,'sports').mockReturnValue(of([soccer,{...soccer,code:'NBA',name:'Baloncesto'}]));
  vi.spyOn(api,'capabilities').mockReturnValue(of([{code:'NBA',integrated:true,defaultLeagueId:null,leagueDiscovery:true}]));
  api.availableLeagues.mockImplementation(()=>of([{id:63,name:'LNBP',country:'Mexico'}]));
  const component=await page();component.form.controls.sportCode.setValue('NBA');component.sportChanged();await Promise.resolve();await Promise.resolve();
  expect(api.availableLeagues).toHaveBeenLastCalledWith('NBA');expect(component.catalogName()).toBe('API-Basketball');
  component.selectLeague({id:63,name:'LNBP',country:'Mexico'});await component.save();
  expect(api.saveLeague).toHaveBeenCalledWith({sportCode:'NBA',externalId:63,name:'LNBP',country:'Mexico',enabled:true,version:0},null);
 }); it('registers hockey leagues from the provider catalogue',async()=>{
  vi.spyOn(api,'sports').mockReturnValue(of([soccer,{...soccer,code:'NHL',name:'Hockey sobre hielo'}]));
  vi.spyOn(api,'capabilities').mockReturnValue(of([{code:'NHL',integrated:true,defaultLeagueId:null,leagueDiscovery:true}]));
  api.availableLeagues.mockImplementation(()=>of([{id:35,name:'KHL',country:'Russia'}]));
  const component=await page();component.form.controls.sportCode.setValue('NHL');component.sportChanged();await Promise.resolve();await Promise.resolve();
  expect(api.availableLeagues).toHaveBeenLastCalledWith('NHL');expect(component.catalogName()).toBe('API-Hockey');
  component.selectLeague({id:35,name:'KHL',country:'Russia'});await component.save();
  expect(api.saveLeague).toHaveBeenCalledWith({sportCode:'NHL',externalId:35,name:'KHL',country:'Russia',enabled:true,version:0},null);
 }); it('registers American football leagues from the provider catalogue',async()=>{
  vi.spyOn(api,'sports').mockReturnValue(of([soccer,{...soccer,code:'NFL',name:'Fútbol americano'}]));
  vi.spyOn(api,'capabilities').mockReturnValue(of([{code:'NFL',integrated:true,defaultLeagueId:null,leagueDiscovery:true}]));
  api.availableLeagues.mockImplementation(()=>of([{id:2,name:'NCAA',country:'USA'}]));
  const component=await page();component.form.controls.sportCode.setValue('NFL');component.sportChanged();await Promise.resolve();await Promise.resolve();
  expect(api.availableLeagues).toHaveBeenLastCalledWith('NFL');expect(component.catalogName()).toBe('API de fútbol americano');
  component.selectLeague({id:2,name:'NCAA',country:'USA'});await component.save();
  expect(api.saveLeague).toHaveBeenCalledWith({sportCode:'NFL',externalId:2,name:'NCAA',country:'USA',enabled:true,version:0},null);
 });
});
