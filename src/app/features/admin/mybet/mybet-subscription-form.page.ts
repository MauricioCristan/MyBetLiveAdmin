import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Customer, MyBetService, Plan, Subscription } from './mybet.service';
import { NotificationService } from '../../../core/notifications/notification.service';

@Component({standalone:true,imports:[CommonModule,FormsModule,ReactiveFormsModule,RouterLink],templateUrl:'./mybet-subscription-form.page.html',styleUrl:'./mybet.page.scss'})
export class MyBetSubscriptionFormPage {
 private readonly api=inject(MyBetService);private readonly router=inject(Router);private readonly route=inject(ActivatedRoute);
 private readonly notices=inject(NotificationService);private readonly fb=inject(FormBuilder);
 readonly id=this.route.snapshot.paramMap.get('id');readonly busy=signal(false);readonly error=signal('');readonly ready=signal(false);
 readonly plans=signal<Plan[]>([]);readonly customers=signal<Customer[]>([]);readonly existing=signal<Subscription|null>(null);query='';
 readonly form=this.fb.group({userId:['',Validators.required],planId:['',Validators.required],expiresAt:['',Validators.required],note:['',[Validators.required,Validators.pattern(/.*\S.*/),Validators.maxLength(500)]]});
 constructor(){void this.load();}
 editable(){return !this.existing()||(this.existing()?.source==='MANUAL'&&this.existing()?.state==='ACTIVE');}
 async load(){
  this.busy.set(true);this.error.set('');this.ready.set(false);
  try{
   this.plans.set((await firstValueFrom(this.api.plans())).filter(p=>p.code!=='FREE'));
   if(this.id){
    const value=await firstValueFrom(this.api.subscription(this.id));this.existing.set(value);
    const date=new Date(value.expiresAt);const local=new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);
    this.form.patchValue({userId:value.userId,planId:value.plan.id,expiresAt:local,note:value.note??''});this.form.controls.userId.disable();
    if(!this.editable())this.form.disable();
   }else{
    this.customers.set((await firstValueFrom(this.api.clients(0,''))).content);
    const selected=this.route.snapshot.queryParamMap.get('client');
    if(selected){
     if(!this.customers().some(c=>c.id===selected)){const customer=await firstValueFrom(this.api.client(selected));this.customers.update(rows=>[...rows,customer]);}
     this.form.controls.userId.setValue(selected);
    }
   }
   this.ready.set(true);
  }catch(e:any){this.error.set(e?.error?.message||'No se pudo cargar la suscripción.');}finally{this.busy.set(false);}
 }
 async search(){
  if(this.busy())return;this.busy.set(true);this.error.set('');
  try{const selected=this.customers().find(c=>c.id===this.form.controls.userId.value);const rows=(await firstValueFrom(this.api.clients(0,this.query.trim()))).content;
   this.customers.set(selected&&!rows.some(c=>c.id===selected.id)?[...rows,selected]:rows);
  }catch(e:any){this.error.set(e?.error?.message||'No se pudo buscar el cliente.');}finally{this.busy.set(false);}
 }
 async save(){
  this.form.markAllAsTouched();if(this.form.invalid||this.busy()||!this.ready()||!this.editable())return;
  const value=this.form.getRawValue();const expiry=new Date(value.expiresAt!);
  if(!Number.isFinite(expiry.getTime())||expiry.getTime()<=Date.now()){this.error.set('Elige un vencimiento futuro.');return;}
  this.busy.set(true);this.error.set('');
  try{
   if(this.id)await firstValueFrom(this.api.editSubscription(this.id,{planId:value.planId!,expiresAt:expiry.toISOString(),note:value.note!.trim(),version:this.existing()!.version}));
   else await firstValueFrom(this.api.grant(value.userId!,value.planId!,expiry.toISOString(),value.note!.trim()));
   this.notices.success('Acceso manual guardado.');await this.router.navigateByUrl('/admin/mybet/subscriptions');
  }catch(e:any){this.error.set(e?.error?.message||'No se pudo guardar la suscripción.');}finally{this.busy.set(false);}
 }
}
