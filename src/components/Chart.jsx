import {memo} from 'react';
import {fmt,ST} from '../lib/utils.js';
export const BarChart=memo(function BarChart({data}){const W=560,H=210,t=18,b=34,mx=Math.max(1,...data.map(d=>d.v)),bw=(W-16)/Math.max(data.length,1);
return <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Produksi TBS valid per bulan (kg)">
{[.25,.5,.75,1].map(g=><line key={g} x1="8" x2={W-8} y1={t+(H-t-b)*(1-g)} y2={t+(H-t-b)*(1-g)} className="stroke-line" strokeDasharray="3 5"/>)}
{data.map((d,i)=>{const h=d.v/mx*(H-t-b),x=8+i*bw+bw*.2,y=H-b-h;return <g key={d.k} className="group"><rect x={x} y={y} width={bw*.6} height={h} rx="7" className="animate-grow origin-bottom fill-palm/75 transition-colors [transform-box:fill-box] group-hover:fill-palm" style={{animationDelay:i*80+'ms'}}/>
<text x={x+bw*.3} y={y-7} textAnchor="middle" className="fill-ink font-mono text-[11px]">{fmt(d.v)}</text><text x={x+bw*.3} y={H-12} textAnchor="middle" className="fill-mute text-[11px]">{d.k}</text></g>})}</svg>});
const SC={valid:'stroke-palm',menunggu:'stroke-sky-500',perlu_konfirmasi:'stroke-amber-500',ditolak:'stroke-rose-500',draf:'stroke-mute'},DC={valid:'bg-palm',menunggu:'bg-sky-500',perlu_konfirmasi:'bg-amber-500',ditolak:'bg-rose-500',draf:'bg-mute'};
export const Donut=memo(function Donut({seg}){const r=42,C=2*Math.PI*r,tot=seg.reduce((a,s)=>a+s.n,0)||1;let off=0;
return <div className="flex flex-col items-center gap-5"><svg viewBox="0 0 100 100" className="w-44 -rotate-90" role="img" aria-label="Status catatan panen"><circle cx="50" cy="50" r={r} fill="none" strokeWidth="11" className="stroke-line"/>
{seg.filter(s=>s.n).map(s=>{const l=s.n/tot*C,e=<circle key={s.s} cx="50" cy="50" r={r} fill="none" strokeWidth="11" strokeDasharray={`${Math.max(l-1.5,0)} ${C-l+1.5}`} strokeDashoffset={-off} className={SC[s.s]}/>;off+=l;return e})}</svg>
<ul className="grid w-full gap-2 text-sm">{seg.map(s=><li key={s.s} className="flex items-center justify-between"><span className="flex items-center gap-2"><i className={'h-2 w-2 rounded-sm '+DC[s.s]}/>{ST[s.s]}</span><span className="font-mono tabular-nums">{s.n}</span></li>)}</ul></div>});
