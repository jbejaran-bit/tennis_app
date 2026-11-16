"use client";
import { useEffect, useState } from "react";
import { drills } from "@/lib/baseline/data";
import { Setup } from "@/lib/baseline/racquet";
import Icon from "./Icons";
import Modal from "./Modal";
type Page={id:string;name:string;description:string};
export default function WorkspaceSearch({pages,setups,onNavigate,onPractice,onSetup}:{pages:Page[];setups:Setup[];onNavigate:(id:string)=>void;onPractice:(id:string)=>void;onSetup:(setup:Setup)=>void}) {
  const [open,setOpen]=useState(false),[query,setQuery]=useState("");
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.metaKey || e.ctrlKey) && e.key.toLowerCase()==="k"){e.preventDefault();setOpen(current=>!current);setQuery("");}};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);},[]);
  const term=query.trim().toLowerCase();
  const matches=(...text:string[])=>text.join(" ").toLowerCase().includes(term);
  const pageHits=pages.filter(p=>matches(p.name,p.description));
  const drillHits=drills.filter(d=>matches(d.title,d.mode,d.category,d.target));
  const setupHits=setups.filter(s=>!s.archived && matches(s.name,s.model,s.stringName,s.tension));
  const count=pageHits.length+drillHits.length+setupHits.length;
  function choose(action:()=>void){setOpen(false);setQuery("");action();}
  return <><button className="workspace-search-trigger" aria-label="Search workspace" aria-haspopup="dialog" onClick={()=>{setOpen(true);setQuery("");}}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></svg><span>Search Baseline</span><kbd>Ctrl K</kbd></button>
    {open && <Modal title="Search Baseline" onClose={()=>setOpen(false)}><label className="field workspace-search-field">Search pages, drills & saved setups<input data-autofocus type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Try serve, strings or a racket name" /></label><p className="helper" role="status">{count ? `${count} matches · Select a result to open it.` : "No matches. Try a shorter name, drill category or string name."}</p><div className="workspace-search-results">
      {pageHits.length>0 && <section aria-label="Pages"><h3>Workspace</h3>{pageHits.map(p=><button key={p.id} onClick={()=>choose(()=>onNavigate(p.id))}><div><b>{p.name}</b><small>{p.description}</small></div><Icon name="arrow" /></button>)}</section>}
      {drillHits.length>0 && <section aria-label="Drills"><h3>On court</h3>{drillHits.map(d=><button key={d.id} onClick={()=>choose(()=>onPractice(d.id))}><div><b>{d.title}</b><small>{d.mode} · {d.minutes} min · {d.category}</small></div><Icon name="arrow" /></button>)}</section>}
      {setupHits.length>0 && <section aria-label="Saved setups"><h3>Your rackets</h3>{setupHits.slice(0,30).map(s=><button key={s.id} onClick={()=>choose(()=>onSetup(s))}><div><b>{s.name}</b><small>{s.model} · {s.stringName || "Strings not recorded"}</small></div><Icon name="racket" /></button>)}{setupHits.length>30 && <p className="helper">Showing the first 30 setups. Refine your search to find another.</p>}</section>}
    </div></Modal>}
  </>;
}
