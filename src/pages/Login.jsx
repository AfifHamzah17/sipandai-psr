import {useRef,useState} from 'react';
import {Navigate,useNavigate} from 'react-router-dom';
import {Info,Loader2} from 'lucide-react';
import {useDispatch,useStore} from '../store.jsx';
import {Field,Marquee,Scramble,inp} from '../components/ui.jsx';
import {useToast} from '../components/Toast.jsx';
import Logo from '../components/Logo.jsx';

const PL=[['70,120 250,100 270,260 90,280'],['330,160 520,140 540,330 350,350'],['110,380 300,360 320,540 130,560'],['380,430 560,420 570,600 390,610']];
const DEMO=[['Pengurus Poktan','ilham@mail.com'],['PKS','pks@mail.com'],['Validator Dinas','dinas@mail.com'],['Validator Kemitraan','mitra01@mail.com'],['Validator BPDP','bpdp@mail.com'],['Administrator','admin@mail.com']];

export default function Login(){
  const {user,booting}=useStore(),dp=useDispatch(),nav=useNavigate(),toast=useToast(),ref=useRef();
  const [f,setF]=useState({email:'ilham@mail.com',password:'password123'}),[er,setEr]=useState({}),[busy,setBusy]=useState(false);
  if(booting)return <div className="grid min-h-[100dvh] place-items-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-palm border-t-transparent"/></div>;
  if(user)return <Navigate to="/dashboard" replace/>;

  const mv=e=>{const r=ref.current.getBoundingClientRect();ref.current.style.setProperty('--px',((e.clientX-r.left)/r.width-.5).toFixed(3));ref.current.style.setProperty('--py',((e.clientY-r.top)/r.height-.5).toFixed(3))};
  const s=k=>e=>setF({...f,[k]:e.target.value});

  const submit=async(email,password)=>{
    const x={};if(!/^\S+@\S+\.\S+$/.test(email))x.email='Masukkan alamat email yang valid';if(password.length<6)x.password='Kata sandi minimal 6 karakter';
    setEr(x);if(Object.keys(x).length)return;
    setBusy(true);
    try{await dp({type:'login',email,password});nav('/dashboard')}
    catch(err){toast(err.message||'Masuk gagal, periksa email dan kata sandi',1)}
    finally{setBusy(false)}
  };
  const onSubmit=e=>{e.preventDefault();submit(f.email,f.password)};
  const quick=email=>{setF({email,password:'password123'});submit(email,'password123')};

  return <div className="grid min-h-[100dvh] md:grid-cols-[1.15fr_1fr]">
    <section ref={ref} onPointerMove={mv} className="relative flex min-h-[44dvh] flex-col justify-between overflow-hidden bg-forest p-6 text-white md:min-h-[100dvh] md:p-12">
      <svg aria-hidden="true" viewBox="0 0 600 700" preserveAspectRatio="xMidYMid slice" className="absolute -inset-10 h-[calc(100%+5rem)] w-[calc(100%+5rem)] transition-transform duration-300 ease-out [transform:translate3d(calc(var(--px,0)*-16px),calc(var(--py,0)*-10px),0)]"><defs><pattern id="d" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="1.6" fill="#4ab479" fillOpacity=".3"/></pattern></defs><rect width="600" height="700" fill="url(#d)"/></svg>
      <svg aria-hidden="true" viewBox="0 0 600 700" preserveAspectRatio="xMidYMid slice" className="absolute -inset-10 h-[calc(100%+5rem)] w-[calc(100%+5rem)] transition-transform duration-300 ease-out [transform:translate3d(calc(var(--px,0)*26px),calc(var(--py,0)*18px),0)]">{PL.map(([p],i)=><polygon key={i} points={p} fill={i===1?'#ef8326':'#4ab479'} fillOpacity={i===1?.16:.12} stroke={i===1?'#ef8326':'#4ab479'} strokeOpacity=".55" strokeWidth="1.5"/>)}</svg>
      <div className="relative flex items-center gap-3"><Logo s={34}/><Scramble text="SIPANDAI" className="text-lg font-semibold tracking-[0.2em]"/></div>
      <div className="relative mt-16 max-w-xl"><h1 className="text-3xl font-semibold leading-tight tracking-tighter text-balance md:text-5xl"><Scramble text="Setiap panen punya kebun, bukti, dan pemeriksa."/></h1><p className="mt-4 max-w-[48ch] text-white/75">Panen dan produktivitas sawit rakyat pascareplanting</p></div>
      <Marquee className="relative mt-10 text-white/80" items={['Pendataan','Pencatatan','Pemeriksaan','Validasi','Analisis','Dashboard','Pelaporan']}/>
    </section>
    <section className="flex items-center justify-center p-6 md:p-12"><div className="grid w-full max-w-sm gap-5">
      <div className="flex gap-3 rounded-2xl bg-sky-500/10 p-4 text-sm text-sky-900 dark:text-sky-200"><Info size={18} strokeWidth={1.75} className="mt-0.5 shrink-0"/><p><b>Pemberitahuan</b><br/>Pemulihan akun dilakukan oleh administrator, bukan lewat email otomatis.</p></div>
      <h2 className="text-2xl font-semibold tracking-tight">Masuk ke SIPANDAI-PSR</h2>
      <form onSubmit={onSubmit} noValidate className="grid gap-5">
        <Field id="em" label="Email" required error={er.email}><input id="em" className={inp(er.email)} autoComplete="email" aria-invalid={!!er.email} aria-describedby="em-e" value={f.email} onChange={s('email')}/></Field>
        <Field id="pw" label="Kata sandi" required error={er.password}><input id="pw" type="password" className={inp(er.password)} autoComplete="current-password" aria-invalid={!!er.password} aria-describedby="pw-e" value={f.password} onChange={s('password')}/></Field>
        <button className="btn btn-p !h-12" disabled={busy}>{busy?<Loader2 size={18} className="animate-spin"/>:'Masuk'}</button>
      </form>
      <div><p className="mb-2 text-xs font-medium text-mute">Masuk cepat (demo, kata sandi sama untuk semua)</p>
        <div className="flex flex-wrap gap-2">{DEMO.map(([l,email])=><button key={email} type="button" className="btn btn-o !h-9 !px-3 text-xs" disabled={busy} onClick={()=>quick(email)}>{l}</button>)}</div></div>
    </div></section>
  </div>;
}
