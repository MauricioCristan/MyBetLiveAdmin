import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MyBetService, Plan } from './mybet.service';
import { NotificationService } from '../../../core/notifications/notification.service';
@Component({standalone:true,imports:[CommonModule,ReactiveFormsModule,RouterLink],templateUrl:'./mybet-plan-form.page.html',styleUrl:'./mybet.page.scss'})
export class MyBetPlanFormPage {
 private readonly api=inject(MyBetService);private readonly route=inject(ActivatedRoute);private readonly router=inject(Router);
 private readonly notices=inject(NotificationService);private readonly fb=inject(FormBuilder);
 readonly id=this.route.snapshot?.paramMap.get('id')??null;
 readonly editing=signal<Plan|null>(null);readonly busy=signal(false);readonly error=signal('');readonly ready=signal(false);
 readonly form=this.fb.group({
  code:['',[Validators.required,Validators.pattern(/^[A-Z][A-Z0-9_]{1,59}$/)]],name:['',[Validators.required,Validators.pattern(/.*\S.*/),Validators.maxLength(120)]],
  description:['',[Validators.maxLength(2000)]],published:[false],playProductId:['',Validators.maxLength(160)],playBasePlanId:['',Validators.maxLength(100)],
  maxActiveTrackers:[null as number|null,[Validators.min(1),Validators.max(100000)]],playerProps:[true],pushNotifications:[true]
 });
 constructor(){void this.load();}
 async load(){
  this.busy.set(true);this.error.set('');this.ready.set(false);
  try{if(this.id){const plan=(await firstValueFrom(this.api.plans())).find(p=>p.id===this.id);if(!plan)throw new Error('Plan no encontrado.');this.edit(plan);}else this.edit(null);this.ready.set(true);}
  catch(e:any){this.error.set(e?.error?.message||e?.message||'No se pudo cargar el plan.');}finally{this.busy.set(false);}
 }
 edit(plan:Plan|null){
  this.editing.set(plan);this.error.set('');this.form.reset(plan?{...plan,playProductId:plan.playProductId??'',playBasePlanId:plan.playBasePlanId??''}:
   {code:'',name:'',description:'',published:false,playProductId:'',playBasePlanId:'',maxActiveTrackers:null,playerProps:true,pushNotifications:true});
  if(plan)this.form.controls.code.disable();else this.form.controls.code.enable();
 }
 async save(){
  this.form.markAllAsTouched();if(this.form.invalid||this.busy()||!this.ready())return;const value=this.form.getRawValue();
  if(!!value.playProductId?.trim()!==!!value.playBasePlanId?.trim()){this.error.set('Completa producto y plan base de Google Play juntos.');return;}
  this.busy.set(true);this.error.set('');
  try{await firstValueFrom(this.api.savePlan({code:value.code!,name:value.name!.trim(),description:value.description?.trim()??'',published:!!value.published,
   playProductId:value.playProductId?.trim()||null,playBasePlanId:value.playBasePlanId?.trim()||null,maxActiveTrackers:value.maxActiveTrackers,
   playerProps:!!value.playerProps,pushNotifications:!!value.pushNotifications,version:this.editing()?.version??0},this.editing()?.id??null));
   this.notices.success('Plan guardado.');await this.router.navigateByUrl('/admin/mybet/subscriptions/plans');
  }catch(e:any){this.error.set(e?.error?.message||'No se pudo guardar el plan.');}finally{this.busy.set(false);}
 }
}
