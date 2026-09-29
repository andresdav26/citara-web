import Link from 'next/link';
import { salesHref } from '@/lib/site';
export function Arrow({className=''}:{className?:string}) { return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg> }
export function Trial({className=''}:{className?:string}) {return <Link className={`button primary ${className}`} href="/prueba/">Prueba gratis 7 días <Arrow/></Link>}
export function Sales({className='',variant='secondary'}:{className?:string;variant?:'primary'|'secondary'}) {return <a className={`button ${variant} ${className}`} href={salesHref}>Hablar con ventas <Arrow/></a>}
export function Eyebrow({children}:{children:React.ReactNode}) {return <p className="eyebrow">{children}</p>}
export function Notice({children}:{children:React.ReactNode}) {return <div className="notice"><span aria-hidden="true">i</span><div>{children}</div></div>}
export function Check(){return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
