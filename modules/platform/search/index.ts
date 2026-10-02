export type SearchDocument={id:string;type:string;title:string;text:string;url?:string;tenantId?:string};
export type SearchQuery={q:string;types?:string[];tenantId?:string;limit?:number};
const docs:SearchDocument[]=[];
export function indexDocument(doc:SearchDocument){const i=docs.findIndex(d=>d.id===doc.id);if(i>=0)docs[i]=doc;else docs.push(doc);return doc}
export function search(input:SearchQuery){const q=input.q.trim().toLowerCase();return docs.filter(d=>(!input.tenantId||d.tenantId===input.tenantId)&&(!input.types?.length||input.types.includes(d.type))).filter(d=>`${d.title} ${d.text}`.toLowerCase().includes(q)).slice(0,input.limit??20)}
export function searchSnapshot(){return {documents:docs.length}}
