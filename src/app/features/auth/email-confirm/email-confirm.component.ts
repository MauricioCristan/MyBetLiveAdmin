import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../enviroment/environment';
import { I18nService } from '../../../core/i18n/i18n.service';
import { I18nPipe } from '../../../core/i18n/i18n.pipe';
import { finalize } from 'rxjs';
import { accountAppLink } from '../account-links';

@Component({standalone:true,selector:'app-email-confirm',imports:[I18nPipe],template:`
  <div class="mybet-auth" style="min-height:100dvh"><div class="container py-5" style="max-width:520px">
    <div class="card"><div class="card-body p-4">
      <h1 class="h4">{{'verify.title'|t:'auth'}}</h1>
      <p class="text-muted">{{'verify.subtitle'|t:'auth'}}</p>
      @if(error){<div class="alert alert-danger">{{error}}</div>}
      @if(success){<div class="alert alert-success">{{'verify.success'|t:'auth'}}</div>}
      @if(!success){<button class="btn btn-success w-100" (click)="confirm()" [disabled]="busy||!validToken">{{'verify.confirm'|t:'auth'}}</button>}
      @if(android&&validToken&&!success){<button class="btn btn-outline-success w-100 mt-3" (click)="openApp()">{{'verify.openApp'|t:'auth'}}</button>}
      <p class="text-muted mt-3">{{'verify.return'|t:'auth'}}</p>
    </div></div>
  </div></div>`})
export class EmailConfirmComponent {
  private readonly http=inject(HttpClient);private readonly cdr=inject(ChangeDetectorRef);private readonly i18n=inject(I18nService);
  readonly token=inject(ActivatedRoute).snapshot.queryParamMap.get('token')??'';
  readonly validToken=/^[a-f0-9]{64}$/.test(this.token);
  readonly android=/Android/i.test(navigator.userAgent);
  busy=false;success=false;error:string|null=this.validToken?null:this.i18n.translate('auth','password.tokenMissing');
  confirm(){
    if(!this.validToken||this.busy)return;
    this.busy=true;this.error=null;
    this.http.post(`${environment.apiBaseUrl}/auth/email/verify`,{token:this.token}).pipe(finalize(()=>{this.busy=false;this.cdr.detectChanges();})).subscribe({
      next:()=>{this.success=true;this.cdr.detectChanges();},error:err=>{this.error=err?.error?.message??this.i18n.translate('auth','password.errorGeneric');this.cdr.detectChanges();}
    });
  }
  openApp(){const link=accountAppLink('verify',this.token,window.location.href);if(link)window.location.href=link;}
}
