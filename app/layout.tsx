import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import './globals.css';
export const metadata: Metadata = { title: {default:'Citara | Tu agenda por WhatsApp, al día',template:'%s | Citara'}, description:'Citara agenda, confirma, reprograma y cancela citas por WhatsApp. Para spas, centros de fisioterapia y clínicas de depilación láser en Colombia.', icons:{icon:'/icon.svg'}, robots:{index:false,follow:false} };
// Keep noindex until missing commercial details and legal copy are approved.
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es-CO"><head><link rel="preload" href="/fonts/body.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/><link rel="preload" href="/fonts/display.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/></head><body><a href="#contenido" className="skip-link">Saltar al contenido</a><Header/><main id="contenido">{children}</main><Footer/></body></html>}
