import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'RestoPulse — Restaurant Management',description:'The Pulse of Modern Gastronomy',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
