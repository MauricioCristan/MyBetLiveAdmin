import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { PermissionService } from '../../../core/auth/permission.service';
import { AuthService } from '../../../core/auth/auth.service';
import { AdminLayoutComponent } from '../layout/admin-layout.component';
import { environment } from '../../../../enviroment/environment';
import { MYBET_ROUTES } from './mybet.routes';
import { MyBetClientFormPage } from './mybet-client-form.page';
import { MyBetSubscriptionFormPage } from './mybet-subscription-form.page';
import { Dashboard, Plan } from './mybet.service';
describe('MyBet management navigation and forms',()=>{
 const base=environment.apiBaseUrl+'/admin/mybet';
 const dashboard:Dashboard={generatedAt:'2026-10-03T12:00:00Z',expiryWindowDays:7,billingEnabled:false,clients:{total:3,enabled:2,disabled:1,free:2,premium:1},subscriptions:{active:2,manual:1,googlePlay:1,expiringSoon:1},catalog:{sportsTotal:3,sportsAvailable:1,leaguesTotal:7,leaguesAvailable:2},plans:{total:2,published:1,drafts:1,premiumPublished:0},upcomingExpirations:[{id:'soon',userId:'customer',username:'customer',planName:'Premium',source:'MANUAL',state:'ACTIVE',expiresAt:'2026-10-05T12:00:00Z'}]};
 const plan:Plan={id:'premium',code:'PREMIUM',name:'Premium',description:'',published:false,playProductId:null,playBasePlanId:null,maxActiveTrackers:null,playerProps:true,pushNotifications:true,version:0};
 const sports=[{code:'NFL',name:'Fútbol americano',description:'',enabled:true,integrated:true,available:true,version:0},{code:'SOCCER',name:'Fútbol',description:'',enabled:true,integrated:true,available:true,version:0}];
 let http:HttpTestingController;let harness:RouterTestingHarness;
 beforeEach(async()=>{
  await TestBed.configureTestingModule({providers:[provideRouter([{path:'admin',component:AdminLayoutComponent,children:MYBET_ROUTES}]),provideHttpClient(),provideHttpClientTesting(),
   {provide:AuthService,useValue:{}},{provide:PermissionService,useValue:{ensureLoaded:()=>of(undefined),hasAnyAdminRole:()=>true,canRead:()=>true,me:()=>({username:'admin-demo'})}}]}).compileComponents();
  http=TestBed.inject(HttpTestingController);harness=await RouterTestingHarness.create();
 });
 afterEach(()=>http.verify());
 function navigation(){
  const root=harness.routeNativeElement!;
  expect(Array.from(root.querySelectorAll('aside .list-group a .sidebar-text'),a=>a.textContent?.trim())).toEqual(['Resumen','Clientes','Suscripciones','Deportes','Ligas','Planes','Operación de APIs','Publicidad','Configuración']);
  expect(root.querySelector('nav.tabs')).toBeNull();
  expect(root.querySelector('a[href="/admin/mybet/bets"]')).toBeNull();
  http.expectNone(request=>request.url.includes('/tracking/')||request.url===base+'/bets'||request.url===base+'/overview');
 }
 async function settle(){await harness.fixture.whenStable();harness.detectChanges();}
 it.each([['','/admin/mybet'],['/overview','/admin/mybet'],['/bets','/admin/mybet'],['/football','/admin/mybet/leagues'],['/baseball','/admin/mybet/leagues']])
 ('routes /admin/mybet%s to an administrative page',async(suffix,target)=>{
  await harness.navigateByUrl('/admin/mybet'+suffix);expect(TestBed.inject(Router).url).toBe(target);
  if(target.endsWith('leagues')){http.expectOne(base+'/leagues').flush([{id:'SOCCER:262',sportCode:'SOCCER',externalId:262,name:'Liga MX',country:'Mexico',enabled:true,version:0}]);http.expectOne(base+'/sports').flush(sports);}
  else if(target==='/admin/mybet')http.expectOne(base+'/dashboard').flush(dashboard);
  else if(target.endsWith('sports'))http.expectOne(base+'/sports').flush(sports);
  await settle();navigation();
 });
 it('loads administrative metrics and expiration links and refreshes its snapshot',async()=>{
  await harness.navigateByUrl('/admin/mybet');http.expectOne(base+'/dashboard').flush(dashboard);await settle();navigation();
  const root=harness.routeNativeElement!;expect(root.querySelectorAll('.metric-card')).toHaveLength(4);
  expect(root.textContent).toContain('33%');expect(root.textContent).toContain('67%');
  expect(root.textContent).toContain('No hay un plan Premium publicado');expect(root.textContent).toContain('Las compras con Google Play están deshabilitadas');
  expect(root.querySelector('a[href="/admin/mybet/subscriptions/soon/edit"]')).not.toBeNull();
  const refresh=Array.from(root.querySelectorAll('button')).find(b=>b.textContent?.includes('Actualizar'))!;refresh.click();
  http.expectOne(base+'/dashboard').flush({...dashboard,clients:{total:0,enabled:0,disabled:0,free:0,premium:0},subscriptions:{active:0,manual:0,googlePlay:0,expiringSoon:0},catalog:{...dashboard.catalog,sportsAvailable:0},upcomingExpirations:[]});
  await settle();expect(root.textContent).toContain('Todavía no hay clientes registrados');expect(root.querySelector('.distribution')).toBeNull();
  expect(root.textContent).toContain('No hay deportes disponibles');expect(root.textContent).toContain('No hay suscripciones próximas a vencer');
 });
 it('shows an initial error with retry and preserves the last snapshot on a refresh error',async()=>{
  await harness.navigateByUrl('/admin/mybet');http.expectOne(base+'/dashboard').flush({message:'Servicio no disponible'},{status:503,statusText:'Unavailable'});await settle();
  const root=harness.routeNativeElement!;expect(root.querySelector('.alert-danger')?.textContent).toContain('Servicio no disponible');expect(root.querySelector('.metric-card')).toBeNull();
  Array.from(root.querySelectorAll('button')).find(b=>b.textContent?.includes('Reintentar'))!.click();http.expectOne(base+'/dashboard').flush(dashboard);await settle();
  Array.from(root.querySelectorAll('button')).find(b=>b.textContent?.includes('Actualizar'))!.click();http.expectOne(base+'/dashboard').flush({},{status:500,statusText:'Error'});await settle();
  expect(root.querySelectorAll('.metric-card')).toHaveLength(4);expect(root.textContent).toContain('se muestran los últimos datos recibidos');
 });
 it('shows client create and edit actions without betting progress',async()=>{
  await harness.navigateByUrl('/admin/mybet/clients');
  http.expectOne(base+'/clients?page=0&search=').flush({content:[{id:'demo',username:'demo',email:null,enabled:true,plan,activeTrackers:15}],page:0,totalPages:1,totalElements:1});
  await settle();navigation();
  expect(Array.from(harness.routeNativeElement!.querySelectorAll('th'),th=>th.textContent)).toEqual(['Cliente','Estado','Plan','Acciones']);
  expect(harness.routeNativeElement!.querySelector('a[href="/admin/mybet/clients/create"]')).not.toBeNull();
  expect(harness.routeNativeElement!.querySelector('a[href="/admin/mybet/clients/demo/edit"]')).not.toBeNull();
 });
 it('presents Google customers by email while retaining their edit identity',async()=>{
  await harness.navigateByUrl('/admin/mybet/clients');
  http.expectOne(base+'/clients?page=0&search=').flush({content:[{id:'google-client',username:'google_123456789',email:'cliente@example.com',enabled:true,plan}],page:0,totalPages:1,totalElements:1});
  await settle();const root=harness.routeNativeElement!;
  expect(root.textContent).toContain('cliente@example.com');expect(root.textContent).toContain('Cuenta de Google');expect(root.textContent).not.toContain('google_123456789');
  expect(root.querySelector('a[href="/admin/mybet/clients/google-client/edit"]')).not.toBeNull();
 });
 it('creates client accounts with the configured client role and returns to their list',async()=>{
  await harness.navigateByUrl('/admin/mybet/clients/create');http.expectOne(base+'/client-role').flush({id:'client-role',label:'Cliente'});await settle();navigation();
  const component=harness.routeDebugElement!.query(By.directive(MyBetClientFormPage)).componentInstance as MyBetClientFormPage;
  component.form.patchValue({username:'new-client',email:'',enabled:true});const saved=component.save();
  const request=http.expectOne(environment.apiBaseUrl+'/backendless/AppUser');expect(request.request.method).toBe('POST');expect(request.request.body.roleId).toBe('client-role');expect(request.request.body.email).toBeNull();request.flush({data:[{id:'new-client'}]});
  await Promise.resolve();await Promise.resolve();
  await saved;http.expectOne(base+'/clients?page=0&search=').flush({content:[],page:0,totalPages:0,totalElements:0});await settle();
  expect(TestBed.inject(Router).url).toBe('/admin/mybet/clients');
 });
 it('keeps the clients sidebar active in its edit view and preserves its existing role',async()=>{
  await harness.navigateByUrl('/admin/mybet/clients/demo/edit');
  http.expectOne(environment.apiBaseUrl+'/backendless/AppUser/demo').flush({data:[{id:'demo',username:'demo',email:null,enabled:true,roleId:'existing-role'}]});await settle();navigation();
  expect(harness.routeNativeElement!.querySelector('aside a.active')?.getAttribute('href')).toBe('/admin/mybet/clients');
  expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toBe('Editar cliente');
  http.expectNone(base+'/client-role');
 });
 it('opens sport editing and league creation as dedicated views',async()=>{
  await harness.navigateByUrl('/admin/mybet/sports/NFL/edit');http.expectOne(base+'/capabilities').flush([{code:'NFL',integrated:true,defaultLeagueId:1,leagueDiscovery:false}]);await Promise.resolve();http.expectOne(base+'/sports/NFL').flush(sports[0]);await settle();navigation();
  expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toBe('Editar deporte');
  await harness.navigateByUrl('/admin/mybet/leagues/create');http.expectOne(base+'/capabilities').flush([{code:'NFL',integrated:true,defaultLeagueId:1,leagueDiscovery:false}]);await Promise.resolve();http.expectOne(base+'/sports').flush(sports);await settle();http.expectOne(base+'/leagues').flush([]);await settle();http.expectOne(base+'/leagues/available?sport=SOCCER').flush([{id:262,name:'Liga MX',country:'Mexico'}]);await settle();navigation();
  expect(harness.routeNativeElement!.querySelector('#available-league')).not.toBeNull();
  expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toBe('Crear liga');
 });
 it('resolves a selected subscription customer beyond the first page of clients',async()=>{
  await harness.navigateByUrl('/admin/mybet/subscriptions/create?client=other');
  http.expectOne(base+'/plans').flush([plan]);await Promise.resolve();
  http.expectOne(base+'/clients?page=0&search=').flush({content:[],page:0,totalPages:0,totalElements:0});await Promise.resolve();
  http.expectOne(base+'/clients/other').flush({id:'other',username:'Otra cuenta',email:null,enabled:true,plan});
  await settle();navigation();expect(harness.routeNativeElement!.querySelector('select#subscription-client option[value="other"]')?.textContent).toBe('Otra cuenta');
 });
 it('edits manual access with its current version and refuses an expired date before sending',async()=>{
  await harness.navigateByUrl('/admin/mybet/subscriptions/manual/edit');http.expectOne(base+'/plans').flush([plan]);await Promise.resolve();
  http.expectOne(base+'/subscriptions/manual').flush({id:'manual',userId:'demo',username:'demo',plan,source:'MANUAL',state:'ACTIVE',expiresAt:'2099-01-01T00:00:00Z',note:'Alta',version:3,active:true});await settle();navigation();
  const component=harness.routeDebugElement!.query(By.directive(MyBetSubscriptionFormPage)).componentInstance as MyBetSubscriptionFormPage;
  component.form.controls.expiresAt.setValue('2000-01-01T00:00');await component.save();http.expectNone(request=>request.method==='PUT');expect(component.error()).toContain('futuro');
  component.form.patchValue({expiresAt:'2099-01-02T12:00',note:'Extensión'});const saved=component.save();
  const request=http.expectOne(base+'/subscriptions/manual');expect(request.request.method).toBe('PUT');expect(request.request.body.version).toBe(3);expect(request.request.body.note).toBe('Extensión');request.flush({});
  await saved;http.expectOne(base+'/subscriptions?page=0').flush({content:[],page:0,totalPages:0,totalElements:0});await settle();
 });
 it('presents verified Google Play access as read only',async()=>{
  await harness.navigateByUrl('/admin/mybet/subscriptions/play/edit');http.expectOne(base+'/plans').flush([plan]);await Promise.resolve();
  http.expectOne(base+'/subscriptions/play').flush({id:'play',userId:'demo',username:'demo',plan,source:'GOOGLE_PLAY',state:'ACTIVE',expiresAt:'2099-01-01T00:00:00Z',note:null,version:1,active:true});await settle();navigation();
  expect(harness.routeNativeElement!.textContent).toContain('La compra se gestiona con Google Play');
  expect(Array.from(harness.routeNativeElement!.querySelectorAll('button'),button=>button.textContent)).not.toContain('Guardar suscripción');
 });
 it('keeps plans under subscriptions with separate create and edit pages',async()=>{
  await harness.navigateByUrl('/admin/mybet/plans');http.expectOne(base+'/plans').flush([plan]);await settle();navigation();
  expect(harness.routeNativeElement!.querySelector('a[href="/admin/mybet/subscriptions/plans/premium/edit"]')).not.toBeNull();
  await harness.navigateByUrl('/admin/mybet/subscriptions/plans/create');await settle();navigation();
  expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toBe('Crear plan');
  expect(harness.routeNativeElement!.querySelector('aside a.active')?.getAttribute('href')).toBe('/admin/mybet/subscriptions/plans');
 });
});
