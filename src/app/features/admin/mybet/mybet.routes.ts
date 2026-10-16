import { Routes } from '@angular/router';
import { myBetAdminGuard } from './mybet.guard';
export const MYBET_ROUTES: Routes = [
 ...['clients','subscriptions','sports','leagues'].flatMap(entity=>
  ['create',':id/edit'].map(action=>({path:'mybet/'+entity+'/'+action,canActivate:[myBetAdminGuard],data:{entity},
   loadComponent:()=>entity==='clients'?import('./mybet-client-form.page').then(m=>m.MyBetClientFormPage):
    entity==='subscriptions'?import('./mybet-subscription-form.page').then(m=>m.MyBetSubscriptionFormPage):
    import('./mybet-catalog-form.page').then(m=>m.MyBetCatalogFormPage)}))
 ),
 ...['create',':id/edit'].map(action=>({path:'mybet/subscriptions/plans/'+action,canActivate:[myBetAdminGuard],
  loadComponent:()=>import('./mybet-plan-form.page').then(m=>m.MyBetPlanFormPage)})),
 ...[['','home'],['clients','clients'],['subscriptions/plans','plans'],['subscriptions','subscriptions'],['sports','sports'],['leagues','leagues']].map(([path,section])=>({
  path:'mybet'+(path?'/'+path:''),pathMatch:'full' as const,canActivate:[myBetAdminGuard],data:{section},loadComponent:()=>import('./mybet.page').then(m=>m.MyBetPage)
 })),
 {path:'mybet/football',pathMatch:'full',redirectTo:'mybet/leagues'},
 {path:'mybet/baseball',pathMatch:'full',redirectTo:'mybet/leagues'},
 ...['overview','bets'].map(path=>({path:'mybet/'+path,pathMatch:'full' as const,redirectTo:'mybet'})),
 {path:'mybet/plans',pathMatch:'full',redirectTo:'mybet/subscriptions/plans'},
];
