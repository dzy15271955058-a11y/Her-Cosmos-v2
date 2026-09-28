import Atlas from '@/components/atlas';
import {entries,findEntry} from '@/lib/atlas-data';
import {notFound} from 'next/navigation';
export function generateStaticParams(){return entries.map(e=>({id:e.id}))}
export async function generateMetadata({params}:{params:Promise<{id:string}>}){const {id}=await params;const e=findEntry(id);return {title:e?`${e.name} · ${e.theme}｜她象`:'条目未找到｜她象',description:e?.intro}}
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!findEntry(id))notFound();return <Atlas view="entry" initialId={id}/>}
