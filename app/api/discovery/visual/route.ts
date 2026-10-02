import { NextResponse } from 'next/server';
export async function POST(req:Request){
  const contentType=req.headers.get('content-type')||'';
  if(!contentType.includes('multipart/form-data')) return NextResponse.json({error:'multipart/form-data required'},{status:415});
  const form=await req.formData(); const file=form.get('image');
  if(!(file instanceof File)) return NextResponse.json({error:'image required'},{status:400});
  return NextResponse.json({status:'provider-boundary-ready',filename:file.name,size:file.size,message:'Visual matching requires a configured Vision Provider; no fake match is returned.'});
}
