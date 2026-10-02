import { NextResponse } from 'next/server';
import { getVisionProvider } from '../../../modules/experience/vision/provider';
export async function POST(request: Request){ const form=await request.formData(); const file=form.get('image'); if(!(file instanceof File)) return NextResponse.json({status:'BAD_REQUEST',message:'الصورة مطلوبة.'},{status:400}); const result=await getVisionProvider().search({imageRef:file.name,query:String(form.get('query')??'')}); return NextResponse.json(result); }
