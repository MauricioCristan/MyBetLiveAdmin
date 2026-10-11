import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UserService } from '../users/services/user.service';
import { MyBetService } from './mybet.service';
import { NotificationService } from '../../../core/notifications/notification.service';

@Component({standalone:true,imports:[ReactiveFormsModule,RouterLink],templateUrl:'./mybet-client-form.page.html',styleUrl:'./mybet.page.scss'})
export class MyBetClientFormPage {
 private readonly users=inject(UserService);private readonly api=inject(MyBetService);private readonly router=inject(Router);
 private readonly notices=inject(NotificationService);private readonly fb=inject(FormBuilder);private readonly route=inject(ActivatedRoute);
 readonly id=this.route.snapshot.paramMap.get('id');readonly busy=signal(false);readonly error=signal('');readonly ready=signal(false);private roleId:string|null=null;
 readonly form=this.fb.group({username:['',[Validators.required,Validators.pattern(/.*\S.*/),Validators.minLength(3),Validators.maxLength(60)]],email:['',[Validators.email,Validators.maxLength(120)]],enabled:[true]});
 constructor(){void this.load();}
 async load(){
  this.busy.set(true);this.error.set('');this.ready.set(false);
  try{
   if(this.id){const user=await firstValueFrom(this.users.read(this.id));if(!user)throw new Error();this.form.patchValue({...user,email:user.email??''});this.roleId=user.roleId;}
   else this.roleId=(await firstValueFrom(this.api.clientRole())).id;
   this.ready.set(true);
  }catch(e:any){this.error.set(e?.error?.message||'No se pudo cargar la cuenta.');}finally{this.busy.set(false);}
 }
 async save(){
  this.form.markAllAsTouched();if(this.form.invalid||this.busy()||!this.ready()||(!this.id&&!this.roleId))return;
  this.busy.set(true);this.error.set('');const value=this.form.getRawValue();
  try{
   const payload={username:value.username!.trim(),email:value.email?.trim()||null,enabled:!!value.enabled,roleId:this.roleId};
   await firstValueFrom(this.id?this.users.update(this.id,payload):this.users.create(payload));
   this.notices.success('Cliente guardado.');await this.router.navigateByUrl('/admin/mybet/clients');
  }catch(e:any){this.error.set(e?.error?.message||'No se pudo guardar el cliente.');}finally{this.busy.set(false);}
 }
}
