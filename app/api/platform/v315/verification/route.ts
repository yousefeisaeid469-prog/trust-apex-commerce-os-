import {NextResponse} from 'next/server';
import catalog from '../../../../../artifacts/v315/verification-catalog.json';
export async function GET(){return NextResponse.json({version:'V315.0.0',status:'READY',catalog});}
