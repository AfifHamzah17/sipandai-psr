import {lazy,Suspense,useEffect,useState} from 'react';
import {Link,Navigate,NavLink,Outlet,useLocation} from 'react-router-dom';
import {ArrowUp,ClipboardCheck,LogOut,MapPin,Menu,Moon,Scale,Sun,Wheat} from 'lucide-react';
import {useDispatch,useStore} from '../store.jsx';
import {ALL,MENU,NAV_GROUPS,cn,roleLabel} from '../lib/utils.js';
import {PageSkeleton,Sheet,Skeleton} from './ui.jsx';
import Logo from './Logo.jsx';
import Fab from './Fab.jsx';
import NavDropdown from './NavDropdown.jsx';
const InstallPrompt=lazy(()=>import('./InstallPrompt.jsx'));

export default function Layout(){
  const {user,booting}=useStore(),dp=useDispatch(),{pathname}=useLocation(),[open,setOpen]=useState(false);
  const [dark,setDark]=useState(()=>document.documentElement.classList.contains('dark'));
  useEffect(()=>{document.documentElement.classList.toggle('dark',dark);try{localStorage.setItem('theme',dark?'dark':'light')}catch{}},[dark]);
  useEffect(()=>setOpen(false),[pathname]);

  if(booting)return <div className="grid min-h-[100dvh] place-items-center"><div className="grid gap-3"><Skeleton className="h-10 w-48"/><Skeleton className="h-4 w-32"/></div></div>;
  if(!user)return <Navigate to="/login" replace/>;

  const links=MENU[user.peran],cur=pathname.split('/')[1];
  if(ALL[cur]&&!links.includes(cur))return <Navigate to="/dashboard" replace/>;

  const groups=NAV_GROUPS.map(g=>({...g,visible:g.items.filter(it=>links.includes(it))})).filter(g=>g.visible.length);
  const tl=()=>({l:'Ke atas',icon:ArrowUp,fn:()=>window.scrollTo({top:0,behavior:'smooth'})});
  const fab=[...(user.peran==='pengurus'||user.peran==='admin'?[{l:'Catat panen',to:'/panen',icon:Wheat},{l:'Gambar kebun',to:'/kebun',icon:MapPin}]:[]),
    ...(user.peran==='pks'||user.peran==='admin'?[{l:'Konfirmasi transaksi',to:'/konfirmasi',icon:ClipboardCheck},{l:'Data timbangan',to:'/timbangan',icon:Scale}]:[]),
    ...(user.peran==='validator'||user.peran==='admin'?[{l:'Antrean validasi',to:'/validasi',icon:ClipboardCheck}]:[]),tl()];
  const lk=({isActive})=>cn('whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',isActive?'bg-tint text-palm':'text-mute hover:text-ink');

  return <div className="flex min-h-[100dvh] flex-col">
    <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2">Lewati ke konten</a>
    <header className="sticky top-0 z-30 border-b border-line bg-surface/80 shadow-[inset_0_-1px_0_rgb(255_255_255/.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 md:px-8">
        <button className="btn btn-o !px-2.5 md:hidden" aria-label="Buka menu" onClick={()=>setOpen(true)}><Menu size={20} strokeWidth={1.75}/></button>
        <Link to="/dashboard" className="flex items-center gap-3 md:mr-6"><Logo/><span className="max-w-[11rem] text-[11px] font-semibold leading-tight tracking-tight">SIPANDAI-PSR<br/><span className="block truncate uppercase" title={roleLabel(user)}>{roleLabel(user)}</span></span></Link>
        <nav className="hidden min-w-0 items-center gap-1 md:flex" aria-label="Menu utama">
          {groups.map(g=>g.visible.length===1
            ?<NavLink key={g.visible[0]} to={'/'+g.visible[0]} className={lk}>{ALL[g.visible[0]]}</NavLink>
            :<NavDropdown key={g.label} label={g.label} active={g.visible.includes(cur)} items={g.visible.map(it=>({to:'/'+it,label:ALL[it]}))}/>)}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/profil" className="hidden text-xs text-mute hover:text-ink lg:block">{user.email}</Link>
          <button className="btn btn-o !px-2.5" onClick={()=>setDark(!dark)} aria-label={dark?'Mode terang':'Mode gelap'}>{dark?<Sun size={18} strokeWidth={1.75}/>:<Moon size={18} strokeWidth={1.75}/>}</button>
          <button className="btn btn-o" onClick={()=>dp({type:'logout'})}><LogOut size={16} strokeWidth={1.75}/><span className="hidden sm:inline">Keluar</span></button>
        </div>
      </div>
    </header>
    <Sheet open={open} onClose={()=>setOpen(false)} title="Menu" side="left"><nav className="grid gap-1" aria-label="Menu seluler">
      {groups.map(g=><div key={g.label}>{g.visible.length>1&&<p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-mute">{g.label}</p>}
        {g.visible.map(it=><NavLink key={it} to={'/'+it} className={({isActive})=>cn('block rounded-xl px-4 py-3 font-medium',isActive?'bg-tint text-palm':'hover:bg-tint')}>{ALL[it]}</NavLink>)}</div>)}
      <NavLink to="/profil" className="rounded-xl px-4 py-3 font-medium hover:bg-tint">Profil</NavLink>
    </nav></Sheet>
    <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-32 pt-8 md:px-8"><Suspense fallback={<PageSkeleton/>}><Outlet/></Suspense></main>
    <Footer user={user}/>
    <Fab items={fab}/><Suspense fallback={null}><InstallPrompt/></Suspense>
  </div>;
}

function Footer({user}){
  return <footer className="border-t border-line bg-surface">
    <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-10 md:grid-cols-[1.3fr_1fr_1fr] md:px-8">
      <div className="flex items-start gap-3"><Logo s={32}/><div><p className="font-semibold tracking-tight">SIPANDAI-PSR</p>
        <p className="mt-1 max-w-[42ch] text-sm text-mute">Panen dan produktivitas sawit rakyat pascareplanting. Setiap catatan terhubung ke kebun, bukti, dan pemeriksa.</p></div></div>
      <div><p className="text-xs font-semibold uppercase tracking-wide text-mute">Navigasi</p>
        <ul className="mt-3 grid gap-2 text-sm"><li><Link className="text-mute hover:text-ink" to="/dashboard">Dashboard</Link></li><li><Link className="text-mute hover:text-ink" to="/kebun">Kebun &amp; Peta</Link></li><li><Link className="text-mute hover:text-ink" to="/analisis">Analisis</Link></li></ul></div>
      <div><p className="text-xs font-semibold uppercase tracking-wide text-mute">Akun</p>
        <p className="mt-3 text-sm">User = <b className="text-ink">{user.email}</b></p><p className="text-sm text-mute">Peran: {roleLabel(user)}</p></div>
    </div>
    <div className="border-t border-line px-4 py-4 text-center text-xs text-mute md:px-8">© {new Date().getFullYear()} Badan Pengelola Dana Perkebunan · SIPANDAI-PSR</div>
  </footer>;
}
