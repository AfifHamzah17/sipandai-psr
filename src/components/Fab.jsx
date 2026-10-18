import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Plus} from 'lucide-react';
import {cn} from '../lib/utils.js';
export default function Fab({items}){const [o,setO]=useState(false);
return <div className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-4 z-40 flex flex-col items-end gap-3 md:right-8">
{o&&items.map((it,i)=>{const I=it.icon,c='animate-pop flex items-center gap-3 rounded-xl bg-surface py-2 pl-4 pr-3 text-sm font-medium shadow-lg ring-1 ring-line hover:bg-tint',s={animationDelay:(items.length-i)*40+'ms'};
const in_=<>{it.l}<I size={18} strokeWidth={1.75}/></>;
return it.to?<Link key={it.l} to={it.to} className={c} style={s} onClick={()=>setO(false)}>{in_}</Link>:<button key={it.l} className={c} style={s} onClick={()=>{it.fn();setO(false)}}>{in_}</button>})}
<button aria-expanded={o} aria-label="Aksi cepat" onClick={()=>setO(!o)} className="grid h-14 w-14 place-items-center rounded-2xl bg-forest text-white shadow-[0_14px_30px_-12px_rgb(var(--forest)/.9)] transition active:scale-95"><Plus strokeWidth={2} className={cn('transition-transform duration-300',o&&'rotate-45')}/></button></div>}
