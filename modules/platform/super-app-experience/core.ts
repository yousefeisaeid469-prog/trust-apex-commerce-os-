import type {SuperAppAction,SuperAppPlan,SuperAppSurface} from './contracts.ts';
const clamp=(n:number)=>Math.max(0,Math.min(100,Math.round(n)));
const num=(n:unknown)=>Number.isFinite(Number(n))?Math.max(0,Number(n)):0;
export function buildSuperAppPlan(input:{orders?:number;repeatRate?:number;problems?:number;catalogSize?:number;isSeller?:boolean}={}):SuperAppPlan{
 const orders=num(input.orders), repeat=clamp(num(input.repeatRate)), problems=num(input.problems), catalog=Math.floor(num(input.catalogSize));
 const actions:SuperAppAction[]=[];
 if(catalog>0) actions.push({id:'shop',title:'ابدأ من السوق الذكي',description:'ابحث وقارن النتائج مع أسباب واضحة قبل الشراء.',surface:'SHOP',href:'/marketplace-intelligence',priority:92,requiresApproval:false,evidence:`catalog=${catalog}`});
 actions.push({id:'copilot',title:'اسأل TRUST AI',description:'حوّل سؤالك إلى مسار بحث أو مقارنة أو حل مشكلة.',surface:'AI',href:'/commerce-ai-copilot',priority:90,requiresApproval:false,evidence:'AI decision-support boundary'});
 if(orders>0) actions.push({id:'orders',title:'مركز طلباتك',description:'الوصول المباشر للطلبات والتتبع وما بعد الشراء.',surface:'ORDERS',href:'/orders',priority:88,requiresApproval:false,evidence:`orders=${orders}`});
 if(problems>0) actions.push({id:'protection',title:'حل المشكلة الآن',description:'وجّه المشكلة لمسار المرتجع أو الضمان أو التوصيل المناسب.',surface:'PROTECTION',href:'/problem-center',priority:97,requiresApproval:false,evidence:`problems=${problems}`});
 if(repeat>=25) actions.push({id:'reorder',title:'إعادة الشراء الذكية',description:'راجع المنتجات التي يظهر لها نمط شراء متكرر.',surface:'SAVINGS',href:'/growth-network',priority:86,requiresApproval:false,evidence:`repeatRate=${repeat}%`});
 actions.push({id:'savings',title:'اكتشف فرص التوفير',description:'قارن الباقات والعروض المتاحة دون اختلاق خصومات.',surface:'SAVINGS',href:'/trust-commerce-network',priority:80,requiresApproval:false,evidence:'observed commerce signals only'});
 if(input.isSeller) actions.push({id:'seller',title:'Seller Command Center',description:'انتقل لإدارة الكتالوج والمخزون والنمو.',surface:'SELLER',href:'/seller-super-os',priority:94,requiresApproval:false,evidence:'seller surface explicitly requested'});
 const surfaces:{id:SuperAppSurface;label:string;href:string;enabled:boolean}[]=[
  {id:'HOME',label:'الرئيسية',href:'/super-app',enabled:true},{id:'SHOP',label:'السوق',href:'/marketplace-intelligence',enabled:catalog>0},{id:'AI',label:'AI',href:'/commerce-ai-copilot',enabled:true},{id:'ORDERS',label:'الطلبات',href:'/orders',enabled:orders>0},{id:'PROTECTION',label:'الحماية',href:'/problem-center',enabled:problems>0},{id:'LOYALTY',label:'الولاء',href:'/trust-commerce-network',enabled:true},{id:'SAVINGS',label:'التوفير',href:'/trust-commerce-network',enabled:true},{id:'SELLER',label:'التاجر',href:'/seller-super-os',enabled:!!input.isSeller}
 ];
 return {version:'V209',headline:'كل التجارة. في تجربة TRUST واحدة.',surfaces,actions:actions.sort((a,b)=>b.priority-a.priority).slice(0,8),trustPrinciples:['الترتيب العضوي منفصل عن الإعلانات المدفوعة.','لا يتم اختلاق أسعار أو خصومات أو مواعيد توصيل.','العمليات المالية والحساسة تحتاج صلاحيات وتنفيذًا فعليًا.','AI يشرح القرار ولا يدّعي تنفيذ عملية لم تحدث.'],unavailable:['تفعيل الدفع والعضوية والمحفظة الحقيقية يحتاج مزودي خدمات وبيانات إنتاج.','التخصيص الكامل عبر الحساب يتطلب سياق مستخدم موثّقًا؛ المدخلات الاختيارية هنا ليست بديلًا عنه.']};
}
