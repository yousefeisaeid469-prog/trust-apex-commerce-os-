export function validateJsonSchema(value:any,schema:any,path='root'):string|undefined{
 if(schema?.type){const ok=schema.type==='object'?value!==null&&typeof value==='object'&&!Array.isArray(value):schema.type==='array'?Array.isArray(value):typeof value===schema.type;if(!ok)return `TYPE_${schema.type}:${path}`;}
 if(schema?.type==='object'){
  for(const k of schema.required??[])if(!(k in value))return `REQUIRED:${path}.${k}`;
  if(schema.additionalProperties===false)for(const k of Object.keys(value))if(!schema.properties?.[k])return `ADDITIONAL_PROPERTY:${path}.${k}`;
  for(const [k,v] of Object.entries(schema.properties??{})){if(k in value){const e=validateJsonSchema(value[k],v,path+'.'+k);if(e)return e;}}
 }
 if(schema?.type==='array'&&schema.items)for(let i=0;i<value.length;i++){const e=validateJsonSchema(value[i],schema.items,`${path}[${i}]`);if(e)return e;}
 return undefined;
}
