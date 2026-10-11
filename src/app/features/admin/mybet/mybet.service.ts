import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../enviroment/environment';
export interface Page<T> { content:T[]; page:number; totalPages:number; totalElements:number; }
export interface Plan {
 id:string; code:string; name:string; description:string; published:boolean; playProductId:string|null;
 playBasePlanId:string|null; maxActiveTrackers:number|null; playerProps:boolean; pushNotifications:boolean; version:number;
}
export interface Subscription {
 username?:string;
 id:string; userId:string; plan:Plan; source:string; state:string; expiresAt:string; createdAt:string;
 verifiedAt:string|null; active:boolean; note:string|null; version:number;
}
export interface Customer { id:string; username:string; email:string|null; enabled:boolean; plan:Plan; }
export interface Dashboard {
 generatedAt:string; expiryWindowDays:number; billingEnabled:boolean;
 clients:{total:number;enabled:number;disabled:number;free:number;premium:number};
 subscriptions:{active:number;manual:number;googlePlay:number;expiringSoon:number};
 catalog:{sportsTotal:number;sportsAvailable:number;leaguesTotal:number;leaguesAvailable:number};
 plans:{total:number;published:number;drafts:number;premiumPublished:number};
 upcomingExpirations:{id:string;userId:string;username:string;planName:string;source:string;state:string;expiresAt:string}[];
}
export interface ProviderStatus {provider:string;quota:{
 configured:boolean;utcDate:string;dailyBudget:number;localRequestsToday:number;
 remoteDailyLimit:number|null;remoteDailyRemaining:number|null;minuteBudget:number;
 localRequestsLastMinute:number;remoteMinuteLimit:number|null;remoteMinuteRemaining:number|null;
 pauseReason:string|null;retryAt:string|null;lastSuccessAt:string|null;lastError:string|null;
}|null;}
export interface SoccerLeague {id:number;name:string;country:string;enabled:boolean;version:number;}
export interface RemoteLeague {id:number;name:string;country:string;}
export interface ManagedSport {code:string;name:string;description:string;enabled:boolean;integrated:boolean;available:boolean;version:number;}
export interface SportIntegration {code:string;integrated:boolean;defaultLeagueId:number|null;leagueDiscovery:boolean;}
export interface ManagedLeague {id:string;sportCode:string;externalId:number|null;name:string;country:string;enabled:boolean;version:number;}
@Injectable({providedIn:'root'})
export class MyBetService {
 private readonly http=inject(HttpClient);
 private readonly base=environment.apiBaseUrl+'/admin/mybet';
 dashboard(){return this.http.get<Dashboard>(this.base+'/dashboard');}
 provider(sport='NFL'){return this.http.get<ProviderStatus>(this.base+'/provider',{params:{sport}});}
 checkProvider(sport='NFL'){return this.http.post<ProviderStatus>(this.base+'/provider/check',{}, {params:{sport}});}
 soccerLeagues(){return this.http.get<SoccerLeague[]>(this.base+'/soccer/leagues');}
 searchSoccerLeagues(search:string){return this.http.get<RemoteLeague[]>(this.base+'/soccer/search',{params:{search}});}
  searchLeagues(sport:string,search:string){return this.http.get<RemoteLeague[]>(this.base+'/leagues/search',{params:{sport,search}});}
  availableLeagues(sport:string){return this.http.get<RemoteLeague[]>(this.base+'/leagues/available',{params:{sport}});}
 addSoccerLeague(id:number){return this.http.post<SoccerLeague>(this.base+'/soccer/leagues',{id,enabled:true});}
 toggleSoccerLeague(league:SoccerLeague){return this.http.put<SoccerLeague>(this.base+'/soccer/leagues/'+league.id,{enabled:!league.enabled,version:league.version});}
 plans(){return this.http.get<Plan[]>(this.base+'/plans');}
 sports(){return this.http.get<ManagedSport[]>(this.base+'/sports');}
 capabilities(){return this.http.get<SportIntegration[]>(this.base+'/capabilities');}
 sport(code:string){return this.http.get<ManagedSport>(this.base+'/sports/'+encodeURIComponent(code));}
 saveSport(value:Omit<ManagedSport,'integrated'|'available'>,code:string|null){return code?this.http.put<ManagedSport>(this.base+'/sports/'+encodeURIComponent(code),value):this.http.post<ManagedSport>(this.base+'/sports',value);}
 leagues(){return this.http.get<ManagedLeague[]>(this.base+'/leagues');}
 league(id:string){return this.http.get<ManagedLeague>(this.base+'/leagues/'+encodeURIComponent(id));}
 saveLeague(value:Omit<ManagedLeague,'id'>,id:string|null){return id?this.http.put<ManagedLeague>(this.base+'/leagues/'+encodeURIComponent(id),value):this.http.post<ManagedLeague>(this.base+'/leagues',value);}
 clientRole(){return this.http.get<{id:string;label:string}>(this.base+'/client-role');}
 clients(page:number,search:string){return this.http.get<Page<Customer>>(this.base+'/clients',{params:{page,search}});}
 client(id:string){return this.http.get<Customer>(this.base+'/clients/'+id);}
 subscriptions(page:number){return this.http.get<Page<Subscription>>(this.base+'/subscriptions',{params:{page}});}
 subscription(id:string){return this.http.get<Subscription>(this.base+'/subscriptions/'+id);}
 editSubscription(id:string,value:{planId:string;expiresAt:string;note:string;version:number}){return this.http.put<Subscription>(this.base+'/subscriptions/'+id,value);}
 savePlan(plan:Omit<Plan,'id'>,id:string|null){return id?this.http.put<Plan>(this.base+'/plans/'+id,plan):this.http.post<Plan>(this.base+'/plans',plan);}
 grant(userId:string,planId:string,expiresAt:string,note:string){return this.http.post<Subscription>(this.base+'/clients/'+userId+'/subscriptions',{planId,expiresAt,note});}
 revoke(id:string){return this.http.delete<void>(this.base+'/subscriptions/'+id);}
}
