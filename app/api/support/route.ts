import {NextResponse} from 'next/server';
import {triageSupport} from '@/modules/platform/customer-support/core.ts';
export async function POST(req:Request){const body=await req.json();return NextResponse.json({actions:triageSupport(body)});}
