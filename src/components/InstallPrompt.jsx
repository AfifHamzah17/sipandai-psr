import {useEffect,useState} from 'react';
import {Download} from 'lucide-react';
import Logo from './Logo.jsx';
export default function InstallPrompt(){const [e,setE]=useState(null);
useEffect(()=>{const h=ev=>{ev.preventDefault();try{if(sessionStorage.getItem('pwa-no'))return}catch{}setE(ev)};window.addEventListener('beforeinstallprompt',h);return()=>window.removeEventListener('beforeinstallprompt',h)},[]);
if(!e)return null;
const no=()=>{try{sessionStorage.setItem('pwa-no','1')}catch{}setE(null)};
const yes=async()=>{e.prompt();await e.userChoice;setE(null)};
return <div role="dialog" aria-label="Pasang aplikasi" className="animate-pop fixed bottom-24 left-4 z-40 w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-surface p-4 shadow-xl ring-1 ring-line"><div className="flex gap-3"><Logo s={36}/><div><p className="font-semibold tracking-tight">Pasang SIPANDAI di perangkat Anda</p><p className="mt-1 text-sm text-mute">Buka dari layar utama dan lanjutkan mencatat panen saat sinyal lemah.</p></div></div><div className="mt-4 flex justify-end gap-2"><button className="btn btn-o" onClick={no}>Nanti</button><button className="btn btn-p" onClick={yes}><Download size={16} strokeWidth={1.75}/>Pasang</button></div></div>}
