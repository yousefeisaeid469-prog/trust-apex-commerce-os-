import { NextResponse } from 'next/server';
import { createB2BAccount, upsertQuantityPrice } from '../../../modules/marketplace/revenue-surfaces';
export async function GET(){return NextResponse.json({ok:true,features:['B2B_ACCOUNTS','QUANTITY_PRICING','TAX_EXEMPT_FLAG','PAYMENT_TERMS']});}
export async function POST(request:Request){try{const body=await request.json();if(body.action==='account')return NextResponse.json({ok:true,account:await createB2BAccount(body)});if(body.action==='quantity_price')return NextResponse.json({ok:true,tier:await upsertQuantityPrice(body)});return NextResponse.json({ok:false,error:'UNKNOWN_B2B_ACTION'},{status:400})}catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:'B2B_OPERATION_FAILED'},{status:400})}}
