import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output, inject } from '@angular/core';

@Component({standalone:true,selector:'app-admin-confirm-dialog',template:`
 <div class="admin-dialog-backdrop" (click)="cancel.emit()"></div>
 <section class="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title" tabindex="-1">
  <h2 id="admin-confirm-title">{{ title }}</h2><ng-content></ng-content>
  <div class="admin-dialog-actions"><button type="button" class="btn btn-outline-secondary" (click)="cancel.emit()">{{ cancelLabel }}</button><button type="button" class="btn btn-primary" (click)="confirm.emit()">{{ confirmLabel }}</button></div>
 </section>`,styles:[`
 :host{position:fixed;inset:0;z-index:2000;display:grid;place-items:center;padding:20px}
 .admin-dialog-backdrop{position:absolute;inset:0;background:#020708c9}
 .admin-dialog{position:relative;width:min(100%,700px);max-height:calc(100dvh - 40px);overflow:auto;background:var(--mb-panel);color:var(--mb-white);border:1px solid var(--mb-border);border-radius:16px;padding:32px;box-shadow:0 24px 80px #0006}
 h2{font-size:26px;margin-bottom:24px}.admin-dialog-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}
 @media(max-width:576px){.admin-dialog{padding:24px}.admin-dialog-actions{flex-direction:column}.admin-dialog-actions button{width:100%}}
 `]})
export class AdminConfirmDialogComponent implements AfterViewInit,OnDestroy {
 @Input() title='Confirmar cambio';@Input() cancelLabel='Volver a editar';@Input() confirmLabel='Aplicar cambio';
 @Output() cancel=new EventEmitter<void>();@Output() confirm=new EventEmitter<void>();
 private readonly element:ElementRef<HTMLElement>=inject(ElementRef);private readonly previousFocus=document.activeElement as HTMLElement|null;
 ngAfterViewInit(){this.buttons()[0]?.focus();}
 ngOnDestroy(){this.previousFocus?.focus();}
 private buttons(){return [...this.element.nativeElement.querySelectorAll<HTMLButtonElement>('button:not([disabled])')];}
 @HostListener('document:keydown',['$event']) keydown(event:KeyboardEvent){
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();this.cancel.emit();}
  if(event.key==='Tab'){
   const buttons=this.buttons();const first=buttons[0],last=buttons.at(-1);if(!first||!last)return;
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
 }
}
