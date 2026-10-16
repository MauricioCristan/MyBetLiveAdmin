import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { NotificationService } from '../../../core/notifications/notification.service';
import { ManagedLeague, ManagedSport, MyBetService, RemoteLeague, SportIntegration } from './mybet.service';

@Component({standalone:true,imports:[CommonModule,FormsModule,ReactiveFormsModule,RouterLink],
 templateUrl:'./mybet-catalog-form.page.html',styleUrl:'./mybet.page.scss'})
export class MyBetCatalogFormPage {
 private readonly api=inject(MyBetService);private readonly route=inject(ActivatedRoute);
 private readonly router=inject(Router);private readonly notices=inject(NotificationService);private readonly fb=inject(FormBuilder);
 readonly isSport=this.route.snapshot.data['entity']==='sports';
 readonly id=this.route.snapshot.paramMap.get('id');readonly listPath='/admin/mybet/'+(this.isSport?'sports':'leagues');
 readonly busy=signal(false);readonly error=signal('');readonly ready=signal(false);readonly sports=signal<ManagedSport[]>([]);readonly results=signal<RemoteLeague[]>([]);
 private version=0;query='';
 readonly integrations=signal<SportIntegration[]>([]);
 readonly registered=signal<ManagedLeague[]>([]);readonly discovering=signal(false);readonly discoveryError=signal('');countryFilter='';
 private discoveryRequest=0;
 readonly form=this.fb.group({
  code:['',[Validators.required,Validators.pattern(/^[A-Z][A-Z0-9_]{1,59}$/)]],
  name:['',[Validators.required,Validators.pattern(/.*\S.*/),Validators.maxLength(this.isSport?120:160)]],
  description:['',Validators.maxLength(2000)],enabled:[false],
  sportCode:['',Validators.required],externalId:[null as number|null,Validators.min(1)],country:['',[Validators.required,Validators.pattern(/.*\S.*/),Validators.maxLength(100)]]
 });
 constructor(){
  if(this.isSport){for(const field of ['sportCode','country','externalId'] as const)this.form.controls[field].disable();}
  else{this.form.controls.code.disable();this.form.controls.description.disable();}
  void this.load();
 }
 async load(){
  this.busy.set(true);this.error.set('');this.ready.set(false);
  try{
   this.integrations.set(await firstValueFrom(this.api.capabilities()));
   if(this.isSport){
    if(this.id){const item=await firstValueFrom(this.api.sport(this.id));this.version=item.version;this.form.patchValue(item);this.form.controls.code.disable();}
   }else{
    this.sports.set(await firstValueFrom(this.api.sports()));
    if(this.id){const item=await firstValueFrom(this.api.league(this.id));this.version=item.version;this.form.patchValue(item);this.form.controls.sportCode.disable();this.form.controls.externalId.disable();}
    else{this.registered.set(await firstValueFrom(this.api.leagues()));if(this.sports().some(s=>s.code==='SOCCER')){this.form.controls.sportCode.setValue('SOCCER');this.sportChanged();}}
   }
   this.ready.set(true);
  }catch(e){this.fail(e);}finally{this.busy.set(false);}
 }
 catalogSelection(){return this.form.controls.sportCode.value==='SOCCER'||['MLB','NBA','NFL','NHL'].includes(this.form.controls.sportCode.value??'')&&!!this.selectedIntegration()?.leagueDiscovery;}
 catalogName(){return this.form.controls.sportCode.value==='MLB'?'API-Baseball':this.form.controls.sportCode.value==='NBA'?'API-Basketball':this.form.controls.sportCode.value==='NFL'?'API de fútbol americano':this.form.controls.sportCode.value==='NHL'?'API-Hockey':'API-Football';}
 selectedSport(){return this.sports().find(s=>s.code===this.form.getRawValue().sportCode);}
 selectedIntegration(){return this.integrations().find(i=>i.code===this.form.controls.sportCode.value);}
 sportChanged(){
  const code=this.form.controls.sportCode.value;this.results.set([]);this.query='';this.countryFilter='';this.discoveryError.set('');this.discoveryRequest++;this.discovering.set(false);
  this.form.patchValue({externalId:this.integrations().find(i=>i.code===code)?.defaultLeagueId??null,enabled:false,name:'',country:''});
  if(this.catalogSelection())void this.loadAvailable();
 }
 selectLeague(item:RemoteLeague){if(this.isRegistered(item.id))return;this.form.patchValue({externalId:item.id,name:item.name,country:item.country,enabled:true});}
 isRegistered(id:number){return this.registered().some(l=>l.sportCode===this.form.controls.sportCode.value&&l.externalId===id);}
 countries(){return [...new Set(this.results().map(l=>l.country))].sort((a,b)=>a.localeCompare(b));}
 filteredAvailable(){const q=this.query.trim().toLowerCase();return this.results().filter(l=>(!this.countryFilter||l.country===this.countryFilter)&&(!q||(l.name+' '+l.country).toLowerCase().includes(q)));}
 chooseAvailable(event:Event){const id=Number((event.target as HTMLSelectElement).value);const item=this.results().find(l=>l.id===id);if(item)this.selectLeague(item);else this.form.patchValue({externalId:null,name:'',country:'',enabled:false});}
 async loadAvailable(){
  if(this.discovering()||!this.catalogSelection())return;
  const sport=this.form.controls.sportCode.value!;
  const request=++this.discoveryRequest;this.discovering.set(true);this.discoveryError.set('');
  try{const items=await firstValueFrom(this.api.availableLeagues(sport));if(request===this.discoveryRequest)this.results.set(items);}
  catch(e:any){if(request===this.discoveryRequest)this.discoveryError.set(e?.error?.message||'No se pudo cargar el catálogo de '+this.catalogName()+'.');}
  finally{if(request===this.discoveryRequest)this.discovering.set(false);}
 }
 async search(){
  if(this.busy()||this.query.trim().length<3||!this.selectedIntegration()?.leagueDiscovery)return;this.busy.set(true);this.error.set('');
  try{this.results.set(await firstValueFrom(this.api.searchLeagues(this.form.controls.sportCode.value!,this.query.trim())));}catch(e){this.fail(e);}finally{this.busy.set(false);}
 }
 async save(){
  this.form.markAllAsTouched();if(this.form.invalid||this.busy()||!this.ready())return;
  const value=this.form.getRawValue();const connected=!!this.integrations().find(i=>i.code===(this.isSport?value.code:value.sportCode))?.integrated;
  if(value.enabled&&!connected){this.error.set('Guarda como borrador hasta que el deporte tenga una integración disponible.');return;}
  if(!this.isSport&&connected&&!value.externalId){this.error.set('Selecciona el identificador de la liga.');return;}
  if(!this.isSport&&!this.id&&this.catalogSelection()&&!this.results().some(l=>l.id===value.externalId)){this.error.set('Selecciona una liga del catálogo de '+this.catalogName()+'.');return;}
  this.busy.set(true);this.error.set('');
  try{
   if(this.isSport)await firstValueFrom(this.api.saveSport({code:value.code!,name:value.name!.trim(),description:value.description?.trim()??'',enabled:!!value.enabled,version:this.version},this.id));
   else await firstValueFrom(this.api.saveLeague({sportCode:value.sportCode!,externalId:value.externalId,name:value.name!.trim(),country:value.country!.trim(),enabled:!!value.enabled,version:this.version},this.id));
   this.notices.success(this.isSport?'Deporte guardado.':'Liga guardada.');await this.router.navigateByUrl(this.listPath);
  }catch(e){this.fail(e);}finally{this.busy.set(false);}
 }
 private fail(e:any){this.error.set(e?.error?.message||'No se pudo completar la operación.');}
}
