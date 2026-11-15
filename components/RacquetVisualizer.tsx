"use client";
import { useId } from "react";

export type MassLocation = "lead12" | "lead39" | "throat" | "butt";
type Props = {
  frameColor: string;
  leatherGrip: boolean;
  lead12: number;
  lead39: number;
  leadThroat: number;
  butt?: number;
  activePoint?: MassLocation;
  onSelect?: (point: MassLocation) => void;
};

export default function RacquetVisualizer({frameColor,leatherGrip,lead12,lead39,leadThroat,butt=0,activePoint="lead12",onSelect}:Props) {
  const id=useId().replace(/[^a-zA-Z0-9_-]/g,"");
  const points:{id:MassLocation;label:string;name:string;mass:number}[]=[
    {id:"lead12",label:"12 o’clock",name:"tip",mass:lead12},
    {id:"lead39",label:"3 + 9",name:"side",mass:lead39},
    {id:"throat",label:"Throat",name:"throat",mass:leadThroat},
    {id:"butt",label:"Butt cap",name:"butt cap",mass:butt},
  ];
  const active=points.find(p=>p.id===activePoint)!;
  const mark=(point:MassLocation)=>activePoint===point ? "#d2f58a" : "#879782";
  const mass=(n:number)=>Number.isFinite(n) ? n.toFixed(1)+" g" : "—";
  return <div className="w-full frame-stage">
    <svg viewBox="0 0 340 590" role="img" aria-label="Racket diagram showing tip, side, throat and butt-cap mass placements. Use the location buttons below to edit." className="frame-diagram">
      <defs>
        <clipPath id={id+"-strings"}><ellipse cx="170" cy="155" rx="65" ry="94" /></clipPath>
        <linearGradient id={id+"-paint"} x1="0" x2="1" y1="0" y2="1"><stop stopColor={frameColor} /><stop offset=".5" stopColor={frameColor} /><stop offset="1" stopColor="#18201a" /></linearGradient>
        <linearGradient id={id+"-grip"}><stop stopColor={leatherGrip ? "#49301e" : "#171c18"} /><stop offset=".55" stopColor={leatherGrip ? "#936344" : "#394137"} /><stop offset="1" stopColor={leatherGrip ? "#49301e" : "#151b16"} /></linearGradient>
        <filter id={id+"-shadow"} x="-50%" y="-30%" width="200%" height="170%"><feDropShadow dx="0" dy="15" stdDeviation="12" floodOpacity=".35" /></filter>
      </defs>
      <g className="diagram-guide" fill="none" stroke="#5d6c58" strokeOpacity=".3" strokeWidth="1">
        <circle cx="170" cy="155" r="129" strokeDasharray="2 9" />
        <path d="M170 20v565M40 155h260" strokeDasharray="3 9" />
        <path d="M292 55v506m-5-506h10m-10 506h10" />
        {[0,1,2,3,4,5,6,7,8,9,10].map(n=><path key={n} d={`M292 ${55+n*50.6}h${n%5===0 ? 9 : 5}`} />)}
      </g>
      <g filter={`url(#${id}-shadow)`}>
        <ellipse cx="170" cy="155" rx="72" ry="102" fill="#0f1612" stroke={`url(#${id}-paint)`} strokeWidth="11" />
        <g clipPath={`url(#${id}-strings)`} stroke="#d4ded0" strokeWidth=".8" opacity=".38">
          {Array.from({length:18},(_,i)=><path key={"v"+i} d={`M${107+i*7.4} 48v215`} />)}
          {Array.from({length:22},(_,i)=><path key={"h"+i} d={`M96 ${55+i*9.5}h150`} />)}
        </g>
        <path d="M108 104C119 37 221 37 232 104" stroke="#263025" strokeWidth="12" fill="none" strokeLinecap="round" />
        <path d="M128 237Q150 280 157 356M212 237Q190 280 183 356M146 268h48" stroke={`url(#${id}-paint)`} strokeWidth="10" strokeLinecap="round" fill="none" />
        <path d="M157 356h26v58h-26z" fill={`url(#${id}-paint)`} />
        <rect x="151" y="410" width="38" height="138" rx="4" fill={`url(#${id}-grip)`} />
        <g stroke="#71806a" strokeOpacity=".45" strokeWidth="1">{Array.from({length:12},(_,i)=><path key={i} d={`M151 ${411+i*11}l38 12`} />)}</g>
        <rect x="147" y="547" width="46" height="13" rx="4" fill="#232e23" stroke="#526047" />
        {lead12>0 && <path d="M148 56q22-10 44 0" fill="none" stroke="#e3e8d8" strokeWidth="11" strokeLinecap="round" />}
        {lead39>0 && <g fill="none" stroke="#e3e8d8" strokeWidth="11" strokeLinecap="round"><path d="M99 136v38M241 136v38" /></g>}
        {leadThroat>0 && <path d="M156 268h28" stroke="#e3e8d8" strokeWidth="7" strokeLinecap="round" />}
        {butt>0 && <path d="M156 552h28" stroke="#e3e8d8" strokeWidth="5" strokeLinecap="round" />}
      </g>
      <g className="diagram-annotation">
        <g fill="none" stroke={mark("lead12")} strokeWidth="1"><path d="M170 55v-23h-69" /><circle cx="170" cy="55" r={activePoint==="lead12" ? 5 : 3} fill={mark("lead12")} /></g>
        <text x="96" y="29" textAnchor="end" fill={mark("lead12")}>{mass(lead12)}</text>
        <g fill="none" stroke={mark("lead39")}><path d="M241 155h34" /><circle cx="241" cy="155" r={activePoint==="lead39" ? 5 : 3} fill={mark("lead39")} /></g>
        <text x="279" y="145" fill={mark("lead39")}>{mass(lead39)}</text>
        <g fill="none" stroke={mark("throat")}><path d="M170 268H92l-12 12H43" /><circle cx="170" cy="268" r={activePoint==="throat" ? 5 : 3} fill={mark("throat")} /></g>
        <text x="42" y="272" fill={mark("throat")}>{mass(leadThroat)}</text>
        <g fill="none" stroke={mark("butt")}><path d="M170 553h81" /><circle cx="170" cy="553" r={activePoint==="butt" ? 5 : 3} fill={mark("butt")} /></g>
        <text x="257" y="557" fill={mark("butt")}>{mass(butt)}</text>
      </g>
    </svg>
    {onSelect && <div className="frame-location-controls" aria-label="Select a weight location">{points.map(p=><button key={p.id} className={activePoint===p.id ? "selected" : ""} aria-label={`Adjust ${p.name} weight`} aria-pressed={activePoint===p.id} aria-controls={"baseline-mass-"+p.id} onClick={()=>onSelect(p.id)}>{p.label}</button>)}</div>}
    <div className="frame-caption"><span>{active.label}</span><b>{mass(active.mass)}</b><small>Diagram is illustrative; positions are estimated.</small></div>
  </div>;
}
