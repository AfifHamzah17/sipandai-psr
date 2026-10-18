import {useEffect,useRef,useState} from 'react';
import {NavLink} from 'react-router-dom';
import {ChevronDown} from 'lucide-react';
import {cn} from '../lib/utils.js';

export default function NavDropdown({label,items,active}){
  const [open,setOpen]=useState(false),ref=useRef();
  useEffect(()=>{
    if(!open)return;
    const onDoc=e=>{if(!ref.current?.contains(e.target))setOpen(false)};
    const onKey=e=>{if(e.key==='Escape')setOpen(false)};
    document.addEventListener('mousedown',onDoc);document.addEventListener('keydown',onKey);
    return()=>{document.removeEventListener('mousedown',onDoc);document.removeEventListener('keydown',onKey)};
  },[open]);
  return <div ref={ref} className="relative">
    <button type="button" aria-expanded={open} aria-haspopup="menu" onClick={()=>setOpen(o=>!o)}
      className={cn('flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',active?'bg-tint text-palm':'text-mute hover:text-ink')}>
      {label}<ChevronDown size={14} strokeWidth={2} className={cn('transition-transform',open&&'rotate-180')}/>
    </button>
    {open&&<div role="menu" className="animate-pop absolute left-0 top-full z-10 mt-1 min-w-[180px] rounded-xl bg-surface p-1.5 shadow-xl ring-1 ring-line">
      {items.map(it=><NavLink key={it.to} to={it.to} role="menuitem" onClick={()=>setOpen(false)}
        className={({isActive})=>cn('block rounded-lg px-3 py-2 text-sm font-medium',isActive?'bg-tint text-palm':'text-ink hover:bg-tint')}>{it.label}</NavLink>)}
    </div>}
  </div>;
}
