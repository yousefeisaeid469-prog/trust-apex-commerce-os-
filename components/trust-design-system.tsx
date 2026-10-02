'use client';

import type { ReactNode } from 'react';

export function TrustSection({eyebrow,title,description,children,className=''}:{eyebrow?:string;title:string;description?:string;children:ReactNode;className?:string}){
  return <section className={`trust-section ${className}`}>
    <header className="trust-section-head">
      <div>{eyebrow&&<span className="trust-eyebrow">{eyebrow}</span>}<h2>{title}</h2>{description&&<p>{description}</p>}</div>
    </header>
    {children}
  </section>;
}

export function TrustSkeleton({lines=3}:{lines?:number}){
  return <div className="trust-skeleton" aria-busy="true" aria-label="جاري التحميل">
    {Array.from({length:lines},(_,i)=><span key={i} style={{width:`${92-(i%3)*17}%`}} />)}
  </div>;
}

export function TrustEmpty({title,description,action}:{title:string;description?:string;action?:ReactNode}){
  return <div className="trust-empty" role="status"><strong>{title}</strong>{description&&<p>{description}</p>}{action}</div>;
}

export function TrustError({title='حصلت مشكلة',retry}:{title?:string;retry?:()=>void}){
  return <div className="trust-error" role="alert"><strong>{title}</strong>{retry&&<button onClick={retry}>حاول تاني</button>}</div>;
}
