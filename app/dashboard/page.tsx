"use client";
import { ChangeEvent, useEffect, useState } from "react";
import Link from "next/link";
import Icon, { IconName } from "@/components/Icons";
import Modal from "@/components/Modal";
import { Backup, parseBackup, prepareBackup, applyBackup } from "@/lib/baseline/backup";
import SavedDataHub from "@/components/SavedDataHub";
import WorkspaceSearch from "@/components/WorkspaceSearch";
import StartGuide from "@/components/StartGuide";
import { SessionPlan,SESSION_PLAN_KEY,isSessionPlan,nextPractice } from "@/lib/baseline/session-plan";
import ProgressHub from "@/components/ProgressHub";
import RacquetLab from "@/components/RacquetLab";
import TrainingHub, { LessonsHub } from "@/components/TrainingHub";
import MatchHub, { MatchForm } from "@/components/MatchHub";
import VideoGallery from "@/components/VideoGallery";
import { useLocalData } from "@/lib/baseline/useLocalData";
import {
  Match,
  PracticeSession,
  isMatch,
  isPracticeSession,
  matchSummary,
  isLegacyDemo,
  today,
  dateLabel,
  drills,
  downloadJson,
} from "@/lib/baseline/data";
import { Setup, isSetup, calculateSetup, RacketTrial, validRacketTrials, validMatchDayChoice, finalCondition } from "@/lib/baseline/racquet";
import { readStored } from "@/lib/baseline/storage";
import "./workspace.css";
type Tab =
  "start" | "saved-data" | "progress" | "overview" | "racquet-lab" | "matches" | "training" | "lessons" | "gallery";
const tabs: { id: Tab; name: string; icon: IconName; description: string }[] = [
  {id:"start",name:"Start here",icon:"overview",description:"A quick guide to your rackets, practice and match notes."},
  {
    id: "overview",
    name: "Overview",
    icon: "overview",
    description: "Your recent activity and plans for the court.",
  },
  {
    id: "racquet-lab",
    name: "Racket Lab",
    icon: "racket",
    description: "Save racket specs, compare setups and record how they play.",
  },
  {
    id: "matches",
    name: "Match log",
    icon: "matches",
    description: "Scores, equipment and notes from your matches.",
  },
  { id: "progress", name: "Progress", icon: "progress", description: "See your practice rhythm and the patterns in your results." },
  {
    id: "training",
    name: "Training",
    icon: "training",
    description: "Choose drills, build a session and log your practice.",
  },
  {
    id: "lessons",
    name: "Playbook",
    icon: "lessons",
    description: "Simple patterns you can take straight onto court.",
  },
  { id: "saved-data", name: "Saved data", icon: "lessons", description: "Edit, archive and restore your personal records." },
  {
    id: "gallery",
    name: "Video journal",
    icon: "video",
    description: "Save clips and notes from your time on court.",
  },
];
const validMatches = (v: unknown): v is Match[] =>
  Array.isArray(v) && v.every(isMatch);
const validSessions = (v: unknown): v is PracticeSession[] => Array.isArray(v) && v.every(isPracticeSession);
const validSetups = (v: unknown): v is Setup[] =>
  Array.isArray(v) && v.every(isSetup);
function CourtArt() {
  return (
    <svg viewBox="0 0 470 280" className="hero-court" aria-hidden="true">
      <defs>
        <linearGradient id="court-fill" x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#35472a" />
          <stop offset="1" stopColor="#1a291d" />
        </linearGradient>
      </defs>
      <g transform="translate(35 24) rotate(-12 200 120)">
        <rect width="400" height="230" rx="10" fill="url(#court-fill)" />
        <g stroke="#d2e0bf" strokeOpacity=".44" strokeWidth="1.4" fill="none">
          <path d="M28 24h344v182H28zM28 48h344M28 182h344M200 24v182M96 48v134m208-134v134M96 115h208" />
          <path d="M200 16v198" strokeWidth="3" />
        </g>
        <path
          d="M78 156Q110 27 321 83"
          fill="none"
          stroke="#d0f777"
          strokeWidth="2"
          strokeDasharray="5 7"
        />
        <circle cx="78" cy="156" r="6" fill="#c8f15e" />
        <circle cx="321" cy="83" r="9" fill="#c8f15e" />
        <path
          d="M315 77q10 2 11 12"
          stroke="#273819"
          fill="none"
          strokeWidth="1.5"
        />
      </g>
    </svg>
  );
}
function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="stat-tile">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
export default function DashboardPage() {
  const [active, setActive] = useState<Tab>("racquet-lab");
  const [menuOpen,setMenuOpen]=useState(false);
  const [pendingBackup,setPendingBackup]=useState<{data:Backup;name:string;preview:ReturnType<typeof prepareBackup>}|null>(null);
  const [importError,setImportError]=useState("");
  const [form, setForm] = useState<Match | "new" | null>(null);
  const [initialDrill, setInitialDrill] = useState("");
  const [initialLabSetup,setInitialLabSetup]=useState<Setup|null>(null);
  const [selectedMatchId,setSelectedMatchId]=useState("");
  const [notice, setNotice] = useState("");
  const matches = useLocalData<Match[]>("baseline_matches", [], validMatches);
  const sessions = useLocalData<PracticeSession[]>(
    "baseline_practice_v2",
    [],
    validSessions,
  );
  const setups = useLocalData<Setup[]>("baseline_setups_v2", [], validSetups);
  const sessionPlan=useLocalData<SessionPlan>(SESSION_PLAN_KEY,[],isSessionPlan);
  const matchDay=useLocalData<string>("baseline_match_day_v1","",validMatchDayChoice);
  const racketTrials = useLocalData<RacketTrial[]>("baseline_racket_trials_v1",[],validRacketTrials);
  useEffect(() => {
    const readHash = () => {
      const id = window.location.hash.slice(1).split("?")[0];
      if (!id) {
        setActive("racquet-lab");
      }
      else if (tabs.some((t) => t.id === id)) setActive(id as Tab);
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);
  const navigate = (id: Tab) => {
    setMenuOpen(false);
    if(id!=="start")try{localStorage.setItem("baseline_start_state","done");}catch{}
    setActive(id);
    if (window.location.hash !== `#${id}`) window.history.pushState(null, "", `#${id}`);
    window.scrollTo({ top: 0, behavior: "instant" });
    setNotice("");
  };
  const practice = (id: string) => {
    setInitialDrill(id);
    navigate("training");
  };
  const stats = matchSummary(matches.value.filter(m=>m.date<=today()));
  const real = matches.value
    .filter((m) => !m.archived && !isLegacyDemo(m) && m.date<=today())
    .sort((a, b) => b.date.localeCompare(a.date));
  const nextSession=nextPractice(matches.value);
  const recent = real.slice(0, 5);
  const practiceMinutes = sessions.value.filter(s => !s.archived && s.date<=today()).reduce((a, s) => a + s.minutes, 0);
  const matchDaySetup=setups.value.find(s=>s.id===matchDay.value && !s.archived && finalCondition(s)==="strung");
  const lastSetup = matchDaySetup || setups.value.filter(s => !s.archived).at(-1);
  const frame = lastSetup ? calculateSetup(lastSetup) : null;
  const activeInfo = tabs.find((t) => t.id === active)!;
  function saveMatch(m: Match) {
    if (!isMatch(m) || !m.opponent || !m.score || m.date>today()) {
      setNotice("Check the match details before saving.");
      return;
    }
    if (
      matches.save((current) =>
        current.some((x) => x.id === m.id)
          ? current.map((x) => (x.id === m.id ? { ...m, archived: x.archived } : x))
          : [m, ...current],
      )
    ) {
      setForm(null);
      setSelectedMatchId(m.id);
      navigate("matches");
      setNotice("Match saved on this device.");
    }
  }
  function exportBackup() {
    try {
      downloadJson(`baseline-backup-${today()}.json`, {
        version: 3,
        sessionPlan: readStored(localStorage,SESSION_PLAN_KEY,[],isSessionPlan),
        matchDaySetupId: readStored(localStorage,"baseline_match_day_v1","",validMatchDayChoice),
        racketTrials: readStored(localStorage, "baseline_racket_trials_v1", [], validRacketTrials),
        matches: readStored(localStorage, "baseline_matches", [], validMatches),
        practice: readStored(
          localStorage,
          "baseline_practice_v2",
          [],
          validSessions,
        ),
        setups: readStored(localStorage, "baseline_setups_v2", [], validSetups),
      });
      setNotice(
        "Backup exported. Download video clips separately from the video journal.",
      );
    } catch {
      setNotice("Could not export your backup. Stored data has not changed.");
    }
  }
  async function importBackup(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error();
      const data = parseBackup(await file.text());
      const preview = prepareBackup(localStorage,data);
      setImportError("");
      setPendingBackup({data,name:file.name || "Baseline backup",preview});
    } catch {
      setNotice(
        "This backup could not be imported. Use a Baseline v2 or v3 JSON backup under 5 MB.",
      );
    } finally {
      e.target.value = "";
    }
  }
  function confirmImport() {
    if(!pendingBackup)return;
    try {
      const keys=applyBackup(localStorage,pendingBackup.data);
      keys.forEach(key=>window.dispatchEvent(new CustomEvent("baseline-data",{detail:key})));
      setPendingBackup(null);
      setNotice("Backup imported. Existing entries with the same ID and your existing court plan were kept.");
    } catch(error) {
      pendingBackup.preview.rows.forEach(row=>window.dispatchEvent(new CustomEvent("baseline-data",{detail:row.key})));
      setImportError(error instanceof Error ? error.message : "Import could not be saved. Keep your original backup and try again.");
    }
  }
  return (
    <div className="baseline-workspace">
      <a href="#workspace-content" className="skip-link" onClick={e=>{e.preventDefault();document.getElementById("workspace-content")?.focus();}}>
        Skip to content
      </a>
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">
          <span className="brand-symbol">
            b<span>•</span>
          </span>
          <span>
            baseline<small>YOUR GAME, IN FOCUS</small>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          {([
            {label:"YOUR WORKSPACE",ids:["racquet-lab","overview","progress"]},
            {label:"ON COURT",ids:["matches","training","lessons","gallery"]},
            {label:"MANAGE",ids:["saved-data","start"]},
          ] as {label:string;ids:Tab[]}[]).map(group=><div className="nav-group" key={group.label}>
          <div className="nav-group-label">{group.label}</div>
          {group.ids.map(id=>tabs.find(t=>t.id===id)!).map((t) => (
            <button
              key={t.id}
              onClick={() => navigate(t.id)}
              className={`nav-item ${active === t.id ? "active" : ""}`}
              aria-current={active === t.id ? "page" : undefined}
            >
              <Icon name={t.icon} />
              <span>{t.name}</span>
              {t.id === "racquet-lab" && <i className="nav-dot" />}
            </button>
          ))}</div>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="device-note">
            <span className="status-dot" />
            <span>
              YOUR PERSONAL WORKSPACE
              <small>Logs & setups saved on this device</small>
            </span>
          </div>
          <button
            className="text-button"
            onClick={exportBackup}
            disabled={!matches.ready || !sessions.ready || !setups.ready || !racketTrials.ready || !matchDay.ready || !sessionPlan.ready}
          >
            <Icon name="download" />
            Export backup
          </button>
          <label className="text-button file-button">
            Import backup
            <input
              type="file"
              accept="application/json,.json"
              aria-label="Import Baseline backup"
              onChange={importBackup}
            />
          </label>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <span className="breadcrumb">
            Workspace <span>/</span> <b>{activeInfo.name}</b>
          </span>
          <div className="workspace-topbar-actions">
          <button className="button primary quick-match" onClick={()=>setForm("new")}><Icon name="plus" /><span>Log match</span></button>
          <WorkspaceSearch pages={tabs} setups={setups.value} onNavigate={id=>navigate(id as Tab)} onPractice={practice} onSetup={s=>{setInitialLabSetup(s);navigate("racquet-lab");}} />
          </div>
        </header>
        <main id="workspace-content" className="workspace-content" tabIndex={-1}>
          <div className={`page-heading${active==="racquet-lab" ? " racket-page-heading" : ""}`}>
            <div>
              <div className="eyebrow">
                {active === "overview"
                  ? "THE EVERYDAY TENNIS WORKSPACE"
                  : "BASELINE / " + activeInfo.name.toUpperCase()}
              </div>
              <h1>
                {active === "overview"
                  ? "Your tennis at a glance."
                  : activeInfo.name}
              </h1>
              <p>{activeInfo.description}</p>
            </div>
            {active === "overview" && (
              <button className="button primary" onClick={() => setForm("new")}>
                <Icon name="plus" />
                Log a match
              </button>
            )}
          </div>
          {(notice || matches.error || sessions.error || setups.error || racketTrials.error || matchDay.error || sessionPlan.error) && (
            <p className="notice" role="status">
              {notice || matches.error || sessions.error || setups.error || racketTrials.error || matchDay.error || sessionPlan.error}
            </p>
          )}
          {active === "start" && <StartGuide onRacket={()=>navigate("racquet-lab")} onTraining={()=>navigate("training")} onMatch={()=>setForm("new")} onProgress={()=>navigate("progress")} onVideo={()=>navigate("gallery")} onExport={exportBackup} canExport={matches.ready && sessions.ready && setups.ready && racketTrials.ready && matchDay.ready && sessionPlan.ready} hasSetup={setups.value.some(s=>!s.archived)} hasPractice={sessions.value.some(s=>!s.archived && s.date<=today())} hasMatch={real.length>0} dataAvailable={matches.ready && sessions.ready && setups.ready && !matches.error && !sessions.error && !setups.error} />}
          {active === "overview" && (
            <>
              <section className="overview-hero">
                <div className="hero-copy">
                  <span className="hero-tag">
                    <span className="status-dot" />
                    Your racket notebook
                  </span>
                  <h2>
                    Keep track of
                    <br />
                    <em>what feels right.</em>
                  </h2>
                  <p>
                    Save your current setup, compare a change, and record how it played.
                    Your notes will be here when it’s time to restring or try again.
                  </p>
                  <button
                    className="button primary"
                    onClick={() => navigate("racquet-lab")}
                  >
                    Open Racket Lab <Icon name="arrow" />
                  </button>
                </div>
                <CourtArt />
                <span className="court-caption">
                  Specs are a starting point. The court is the test.
                </span>
              </section>
              <section
                className="stats-row"
                aria-label="Your performance summary"
              >
                <Stat
                  label="MATCHES LOGGED"
                  value={String(stats.total)}
                  note={`${stats.wins} wins · ${stats.losses} losses`}
                />
                <Stat
                  label="WIN RATE"
                  value={stats.winRate === null ? "—" : stats.winRate + "%"}
                  note={
                    stats.total
                      ? "Based on your logged matches"
                      : "Log a match to begin"
                  }
                />
                <Stat
                  label="FIRST SERVES IN"
                  value={stats.avgServe === null ? "—" : stats.avgServe + "%"}
                  note={
                    stats.serveCount
                      ? `Average across ${stats.serveCount} tracked matches`
                      : "Add this stat when you track it"
                  }
                />
                <Stat
                  label="PRACTICE TIME"
                  value={practiceMinutes ? practiceMinutes + " min" : "—"}
                  note={`${sessions.value.filter(s => !s.archived && s.date<=today()).length} sessions in your journal`}
                />
              </section>
              <div className="overview-grid">
                <section className="panel setup-overview">
                  <div className="section-heading">
                    <div className="eyebrow">
                      <Icon name="racket" />
                      {matchDaySetup ? "YOUR MATCH-DAY SETUP" : "YOUR EQUIPMENT"}
                    </div>
                    <button
                      className="text-button"
                      onClick={() => navigate("racquet-lab")}
                    >
                      Racket Lab <Icon name="arrow" />
                    </button>
                  </div>
                  <h2>
                    {lastSetup?.name || "Find a setup that feels like you."}
                  </h2>
                  <p>
                    {lastSetup
                      ? lastSetup.model
                      : "Save your racket, explore weight changes and compare configurations side by side."}
                  </p>
                  <div className="setup-mini-stats">
                    <div>
                      <strong>
                        {frame ? frame.weight.toFixed(1) : "—"}
                        <small> g</small>
                      </strong>
                      <span>WEIGHT</span>
                    </div>
                    <div>
                      <strong>
                        {frame ? frame.balance.toFixed(1) : "—"}
                        <small> cm</small>
                      </strong>
                      <span>BALANCE</span>
                    </div>
                    <div>
                      <strong>{frame?.swingweight?.toFixed(0) ?? "—"}</strong>
                      <span>SW ESTIMATE</span>
                    </div>
                  </div>
                  <div className="card-bottom">
                    <span>
                      {lastSetup
                        ? `${setups.value.filter(s => !s.archived).length} saved setups · estimates`
                        : "Your first setup is a few inputs away"}
                    </span>
                    <button
                      className="icon-button"
                      aria-label="Open Racket Lab"
                      onClick={() => navigate("racquet-lab")}
                    >
                      <Icon name="arrow" />
                    </button>
                  </div>
                </section>
                <section className="panel next-practice">
                  <div className="section-heading">
                    <div className="eyebrow">NEXT ON COURT</div>
                    <span className="badge">{nextSession.drill.minutes} MIN / {nextSession.drill.mode.toUpperCase()}</span>
                  </div>
                  <span className="session-number">
                    01 <span>/ {nextSession.drill.category.toUpperCase()}</span>
                  </span>
                  <h2>{nextSession.drill.title}</h2>
                  <p>
                    {nextSession.reason}
                  </p>
                  <div className="practice-target">
                    <Icon name="check" />
                    Target: {nextSession.drill.target}
                  </div>
                  <button
                    className="text-button"
                    onClick={() => practice(nextSession.drill.id)}
                  >
                    View session plan <Icon name="arrow" />
                  </button>
                  {sessionPlan.value.length>0 && <div className="overview-court-plan"><span className="eyebrow">YOUR SAVED COURT PLAN</span><b>{sessionPlan.value.reduce((sum,b)=>sum+b.minutes,0)} minutes · {sessionPlan.value.length} {sessionPlan.value.length===1 ? "block" : "blocks"}</b><p>{sessionPlan.value.map(b=>drills.find(d=>d.id===b.drillId)!.title).join(" → ")}</p><button className="text-button" onClick={()=>navigate("training")}>Open your court plan <Icon name="arrow" /></button></div>}
                </section>
              </div>
              <div className="overview-grid lower-grid">
                <section className="panel">
                  <div className="section-heading">
                    <h2>Recent matches</h2>
                    <button
                      className="text-button"
                      onClick={() => navigate("matches")}
                    >
                      View log <Icon name="arrow" />
                    </button>
                  </div>
                  {recent.length ? (
                    <div className="match-list">
                      {recent.slice(0, 3).map((m) => (
                        <button
                          className="match-row"
                          key={m.id}
                          onClick={() => {setSelectedMatchId(m.id);navigate("matches");}}
                        >
                          <span className={`result-mark ${m.result}`}>
                            {m.result === "win" ? "W" : "L"}
                          </span>
                          <span className="match-person">
                            <b>vs {m.opponent}</b>
                            <small>{dateLabel(m.date)}</small>
                          </span>
                          <span className="match-score">{m.score}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state compact-empty">
                      <Icon name="matches" />
                      <h3>Let the patterns emerge.</h3>
                      <p>
                        Your own matches will appear here. Start with the score
                        and one thing you learned.
                      </p>
                      <button
                        className="text-button"
                        onClick={() => setForm("new")}
                      >
                        Log your first match <Icon name="plus" />
                      </button>
                    </div>
                  )}
                </section>
                <section className="panel form-panel">
                  <div className="section-heading">
                    <h2>Recent form</h2>
                    <span className="badge">LAST 5 MATCHES</span>
                  </div>
                  <div className="form-dots">
                    {Array.from({ length: 5 }, (_, i) => {
                      const m = [...recent].reverse()[i];
                      return (
                        <span
                          key={i}
                          className={m ? m.result : "empty"}
                          title={
                            m ? `${m.result} vs ${m.opponent}` : "No match yet"
                          }
                        >
                          {m ? (m.result === "win" ? "W" : "L") : "—"}
                        </span>
                      );
                    })}
                  </div>
                  <p>
                    {recent.length
                      ? "Results shown oldest to newest. Use your match notes to understand the story behind the score."
                      : "One result is a moment. A match journal helps you see the bigger picture."}
                  </p>
                  <div className="focus-note">
                    <span>YOUR LATEST FOCUS</span>
                    <p>
                      {real[0]?.focus ||
                        "Choose one thing to carry into your next session."}
                    </p>
                  </div>
                </section>
              </div>
            </>
          )}
          {active === "saved-data" && <SavedDataHub matches={matches.value} sessions={sessions.value} setups={setups.value} saveMatches={matches.save} saveSessions={sessions.save} saveSetups={setups.save} onEditMatch={setForm} onOpenSetup={s=>{setInitialLabSetup(s);navigate("racquet-lab");}} error={matches.error || sessions.error || setups.error} />}
          {active === "progress" && <ProgressHub matches={matches.value} sessions={sessions.value} onLog={() => setForm("new")} onPractice={id => id ? practice(id) : navigate("training")} />}
          {active === "racquet-lab" && <RacquetLab initialSetup={initialLabSetup} onInitialSetupLoaded={()=>setInitialLabSetup(null)} />}
          {active === "matches" && (
            <MatchHub
              matches={matches.value.filter(m => !m.archived)}
              onLog={() => setForm("new")}
              onEdit={setForm}
              onPractice={practice}
              initialSelectedId={selectedMatchId}
              onSelectMatch={setSelectedMatchId}
              onReviewSetup={s=>{setInitialLabSetup({...s,id:"",archived:false,name:s.name.slice(0,70)+" review"});navigate("racquet-lab");}}
            />
          )}
          {active === "training" && (
            <TrainingHub
              key={initialDrill}
              sessions={sessions.value.filter(s => !s.archived && s.date<=today())}
              saveSessions={sessions.save}
              error={sessions.error}
              initialDrill={initialDrill}
            />
          )}
          {active === "lessons" && <LessonsHub onPractice={practice} />}
          {active === "gallery" && <VideoGallery />}
          <div className="mobile-backup">
            <button className="text-button" onClick={exportBackup}>
              <Icon name="download" />
              Export backup
            </button>
            <label className="text-button file-button">
              Import backup
              <input
                type="file"
                accept="application/json,.json"
                aria-label="Import backup on mobile"
                onChange={importBackup}
              />
            </label>
          </div>
          <footer className="workspace-footer">
            <span>
              baseline <b>·</b> Your tennis notebook.
            </span>
            <span>Records are saved in this browser.</span>
          </footer>
        </main>
      </div>
      <nav className="mobile-dock" aria-label="Mobile navigation">
        {(["racquet-lab","training","matches"] as Tab[]).map(id=>{
          const tab=tabs.find(t=>t.id===id)!;
          return <button key={id} onClick={()=>navigate(id)} aria-current={active===id ? "page":undefined}><Icon name={tab.icon}/><span>{id==="racquet-lab" ? "Racket Lab":id==="matches" ? "Matches":"Training"}</span></button>;
        })}
        <button onClick={()=>setMenuOpen(true)} aria-label="More pages" aria-haspopup="dialog" aria-expanded={menuOpen} className={!["racquet-lab","training","matches"].includes(active) ? "active":""}><Icon name="overview"/><span>More</span></button>
      </nav>
      {menuOpen && <Modal title="Your workspace" onClose={()=>setMenuOpen(false)}>
        <p className="menu-intro">Everything you need, between matches.</p>
        <nav className="workspace-menu" aria-label="All workspace pages">
          {tabs.map(tab=><button key={tab.id} onClick={()=>navigate(tab.id)} aria-current={active===tab.id ? "page":undefined}><Icon name={tab.icon}/><span><strong>{tab.name}</strong><small>{tab.description}</small></span><Icon name="arrow"/></button>)}
        </nav>
      </Modal>}
      {pendingBackup && <Modal title="Review your backup" onClose={()=>setPendingBackup(null)}>
        <p className="menu-intro backup-filename">{pendingBackup.name}</p>
        <p>New records will be added. Existing records with matching IDs stay unchanged. Repeated IDs in the file are skipped.</p>
        <div className="backup-review"><table><caption>Records in this backup</caption><thead><tr><th scope="col">Record type</th><th scope="col">To add</th><th scope="col">Skipped</th></tr></thead><tbody>{pendingBackup.preview.rows.map(row=><tr key={row.key}><th scope="row">{row.label}</th><td>{row.added}</td><td>{row.kept}</td></tr>)}</tbody></table></div>
        {pendingBackup.preview.planKept && <p>Your current court plan will be kept.</p>}
        <p className="menu-intro">Video clips are not included. Counts are checked again when you import, so records saved in another tab are kept.</p>
        {importError && <p role="alert">{importError}</p>}
        <div className="import-actions"><button className="button secondary" onClick={()=>setPendingBackup(null)}>Cancel import</button><button className="button primary" onClick={confirmImport}>Import records</button></div>
      </Modal>}
      {form && (
        <MatchForm
          setups={setups.value.filter(s => !s.archived)}
          preferredSetupId={matchDaySetup?.id}
          error={matches.error}
          initial={form === "new" ? undefined : form}
          onSave={saveMatch}
          onClose={() => setForm(null)}
        />
      )}
    </div>
  );
}
