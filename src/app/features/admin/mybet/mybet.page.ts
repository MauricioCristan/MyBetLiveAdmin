import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Customer, Dashboard, ManagedLeague, ManagedSport, MyBetService, Page, Plan, Subscription } from './mybet.service';

@Component({standalone:true,selector:'app-mybet',imports:[CommonModule,FormsModule,RouterLink,RouterLinkActive],templateUrl:'./mybet.page.html',styleUrl:'./mybet.page.scss'})
export class MyBetPage {
 private readonly api=inject(MyBetService);private readonly route=inject(ActivatedRoute);
 readonly section=signal(this.route.snapshot.data['section']??'home');readonly busy=signal(false);readonly error=signal('');readonly notice=signal('');
 readonly sports=signal<ManagedSport[]>([]);readonly leagues=signal<ManagedLeague[]>([]);
 readonly clients=signal<Page<Customer>|null>(null);readonly subscriptions=signal<Page<Subscription>|null>(null);readonly plans=signal<Plan[]>([]);
 readonly dashboard=signal<Dashboard|null>(null);
 premiumPercent(){const clients=this.dashboard()?.clients;return clients?.total?Math.round(clients.premium/clients.total*100):0;}
 freePercent(){return this.dashboard()?.clients.total?100-this.premiumPercent():0;}
 readonly revoking=signal<Subscription|null>(null);page=0;search='';sportFilter=this.route.snapshot.queryParamMap.get('sport')??'';
 readonly titles:Record<string,string>={home:'MyBetLive',clients:'Clientes',subscriptions:'Suscripciones',sports:'Deportes',leagues:'Ligas',plans:'Planes y beneficios'};
 constructor(){void this.load();}
 async load(){
  if(this.busy())return;this.busy.set(true);this.error.set('');
  try{
   switch(this.section()){
    case 'home':this.dashboard.set(await firstValueFrom(this.api.dashboard()));break;
    case 'sports':this.sports.set(await firstValueFrom(this.api.sports()));break;
    case 'leagues':{const [leagues,sports]=await Promise.all([firstValueFrom(this.api.leagues()),firstValueFrom(this.api.sports())]);this.leagues.set(leagues);this.sports.set(sports);break;}
    case 'clients':this.clients.set(await firstValueFrom(this.api.clients(this.page,this.search)));break;
    case 'subscriptions':this.subscriptions.set(await firstValueFrom(this.api.subscriptions(this.page)));break;
    case 'plans':this.plans.set(await firstValueFrom(this.api.plans()));break;
   }
  }catch(e:any){this.error.set(e?.error?.message||'No se pudo completar la operación.');}finally{this.busy.set(false);}
 }
 clientLabel(client:Customer){return client.username.startsWith('google_')&&client.email?client.email:client.username;}
 sportName(code:string){return this.sports().find(s=>s.code===code)?.name??code;}
 filteredSports(){const search=this.search.trim().toLowerCase();return this.sports().filter(s=>!search||(s.name+' '+s.code).toLowerCase().includes(search));}
 filteredLeagues(){const search=this.search.trim().toLowerCase();return this.leagues().filter(l=>(!this.sportFilter||l.sportCode===this.sportFilter)&&(!search||(l.name+' '+l.country).toLowerCase().includes(search)));}
 async toggleSport(sport:ManagedSport){
  if(this.busy())return;this.busy.set(true);this.error.set('');
  try{await firstValueFrom(this.api.saveSport({code:sport.code,name:sport.name,description:sport.description,enabled:!sport.enabled,version:sport.version},sport.code));this.sports.set(await firstValueFrom(this.api.sports()));this.notice.set('Disponibilidad del deporte actualizada.');}catch(e:any){this.error.set(e?.error?.message||'No se pudo cambiar el deporte.');}finally{this.busy.set(false);}
 }
 async toggleLeague(league:ManagedLeague){
  if(this.busy())return;this.busy.set(true);this.error.set('');
  try{const {id,...value}=league;await firstValueFrom(this.api.saveLeague({...value,enabled:!league.enabled},id));this.leagues.set(await firstValueFrom(this.api.leagues()));this.notice.set('Disponibilidad de la liga actualizada. Los seguimientos existentes se conservan.');}catch(e:any){this.error.set(e?.error?.message||'No se pudo cambiar la liga.');}finally{this.busy.set(false);}
 }
 pageInfo(){return this.section()==='clients'?this.clients():this.subscriptions();}
 changePage(page:number){this.page=page;void this.load();}
 filter(){this.page=0;void this.load();}
 async revoke(){
  const subscription=this.revoking();if(!subscription||this.busy())return;this.busy.set(true);this.error.set('');
  try{await firstValueFrom(this.api.revoke(subscription.id));this.revoking.set(null);this.subscriptions.set(await firstValueFrom(this.api.subscriptions(this.page)));this.notice.set('Acceso manual revocado.');}catch(e:any){this.error.set(e?.error?.message||'No se pudo revocar el acceso.');}finally{this.busy.set(false);}
 }
 readonly stateLabels:Record<string,string>={ACTIVE:'Activa',CANCELED:'Cancelada, acceso hasta vencimiento',IN_GRACE_PERIOD:'Período de gracia',ON_HOLD:'Pago retenido',PAUSED:'Pausada',EXPIRED:'Vencida',REVOKED:'Revocada',REPLACED:'Reemplazada',PENDING:'Pago pendiente'};
}
