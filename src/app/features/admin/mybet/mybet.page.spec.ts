import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { MyBetPlanFormPage } from './mybet-plan-form.page';
import { MyBetService } from './mybet.service';
describe('MyBet plan editor',()=>{
 const api={plans:()=>of([]),savePlan:vi.fn(()=>of({}))};
 beforeEach(async()=>{
  api.savePlan.mockClear();
  await TestBed.configureTestingModule({imports:[MyBetPlanFormPage],providers:[provideRouter([]),
   {provide:ActivatedRoute,useValue:{data:of({section:'plans'})}},{provide:MyBetService,useValue:api}]}).compileComponents();
 });
 async function page(){vi.spyOn(TestBed.inject(Router),'navigateByUrl').mockResolvedValue(true);const fixture=TestBed.createComponent(MyBetPlanFormPage);await fixture.whenStable();return fixture.componentInstance;}
 it('keeps new plans unpublished and preserves unlimited access by default',async()=>{
  const component=await page();component.edit(null);
  component.form.patchValue({code:'PREMIUM',name:'Premium'});
  await component.save();
  expect(api.savePlan).toHaveBeenCalledWith(expect.objectContaining({published:false,maxActiveTrackers:null,playerProps:true,pushNotifications:true,playProductId:null}),null);
 });
 it('does not submit incomplete Play configuration',async()=>{
  const component=await page();component.edit(null);
  component.form.patchValue({code:'PREMIUM',name:'Premium',playProductId:'premium'});
  await component.save();expect(api.savePlan).not.toHaveBeenCalled();expect(component.error()).toContain('producto y plan base');
 });
});
