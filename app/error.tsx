'use client';
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#050505',color:'#fff',fontFamily:'system-ui',padding:24,textAlign:'center'}}><div><h1>حدث خطأ مؤقت</h1><p style={{color:'#999'}}>TRUST حاول حماية الجلسة بدل عرض شاشة مكسورة.</p><button onClick={() => reset()} style={{background:'#d4af37',border:0,borderRadius:9,padding:'12px 18px'}}>إعادة المحاولة</button></div></main>;
}
