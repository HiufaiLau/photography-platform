import type {Metadata} from 'next';import {redirect} from 'next/navigation';import Admin from './ui';import {authenticated} from '@/lib/auth';
export const metadata:Metadata={robots:{index:false,follow:false},title:'Studio CMS'};
export default async function AdminPage(){if(!await authenticated())redirect('/admin/login');return <main><div className="between"><div><p className="eyebrow">PRIVATE STUDIO / CMS</p><h1>Manage your stories.</h1></div><span className="muted">Authenticated studio</span></div><Admin/></main>}
