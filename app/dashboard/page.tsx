"use client";
import { ChangeEvent, useEffect, useState } from "react";
import Link from "next/link";
import Icon, { IconName } from "@/components/Icons";
import RacquetLab from "@/components/RacquetLab";
import TrainingHub, { LessonsHub } from "@/components/TrainingHub";
import MatchHub, { MatchForm } from "@/components/MatchHub";
import VideoGallery from "@/components/VideoGallery";
import { useLocalData } from "@/lib/baseline/useLocalData";
import {
  Match,
  PracticeSession,
  isMatch,
  validDate,
  matchSummary,
  isLegacyDemo,
  today,
  dateLabel,
  drills,
  downloadJson,
} from "@/lib/baseline/data";
import { Setup, isSetup, calculateSetup } from "@/lib/baseline/racquet";
import { mergeById, readStored } from "@/lib/baseline/storage";
import { createClient } from "@/lib/supabase/client";
import "./workspace.css";
type Tab =
  "overview" | "racquet-lab" | "matches" | "training" | "lessons" | "gallery";
const tabs: { id: Tab; name: string; icon: IconName; description: string }[] = [
  {
    id: "overview",
    name: "Overview",
    icon: "overview",
    description: "A little intention. A better next session.",
  },
  {
    id: "racquet-lab",
    name: "Racket Lab",
    icon: "racket",
    description: "Find your feel. Build, save and compare your setups.",
  },
  {
    id: "matches",
    name: "Match log",
    icon: "matches",
    description: "Remember the patterns. Take something into your next match.",
  },
  {
    id: "training",
    name: "Training",
    icon: "training",
    description: "A clear target for every session.",
  },
  {
    id: "lessons",
    name: "Playbook",
    icon: "lessons",
    description: "Simple patterns you can take straight onto court.",
  },
  {
    id: "gallery",
    name: "Video journal",
    icon: "video",
    description: "Watch your game with a purpose.",
  },
];
const validMatches = (v: unknown): v is Match[] =>
  Array.isArray(v) && v.every(isMatch);
const validSessions = (v: unknown): v is PracticeSession[] =>
  Array.isArray(v) &&
  v.every(
    (s) =>
      s &&
      typeof s.id === "string" &&
      drills.some((d) => d.id === s.drillId) &&
      validDate(s.date) &&
      Number.isFinite(s.minutes) &&
      s.minutes >= 1 &&
      s.minutes <= 300 &&
      typeof s.notes === "string",
  );
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
  const [active, setActive] = useState<Tab>("overview");
  const [email, setEmail] = useState("");
  const [form, setForm] = useState<Match | "new" | null>(null);
  const [initialDrill, setInitialDrill] = useState("");
  const [notice, setNotice] = useState("");
  const matches = useLocalData<Match[]>("baseline_matches", [], validMatches);
  const sessions = useLocalData<PracticeSession[]>(
    "baseline_practice_v2",
    [],
    validSessions,
  );
  const setups = useLocalData<Setup[]>("baseline_setups_v2", [], validSetups);
  useEffect(() => {
    const readHash = () => {
      const id = window.location.hash.slice(1);
      if (tabs.some((t) => t.id === id)) setActive(id as Tab);
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);
  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      try {
        createClient()
          .auth.getSession()
          .then(({ data }) => setEmail(data.session?.user.email || ""))
          .catch(() => {});
      } catch {}
    }
  }, []);
  const navigate = (id: Tab) => {
    setActive(id);
    window.history.replaceState(null, "", `#${id}`);
    setNotice("");
  };
  const practice = (id: string) => {
    setInitialDrill(id);
    navigate("training");
  };
  const stats = matchSummary(matches.value);
  const real = matches.value
    .filter((m) => !isLegacyDemo(m))
    .sort((a, b) => b.date.localeCompare(a.date));
  const recent = real.slice(0, 5);
  const practiceMinutes = sessions.value.reduce((a, s) => a + s.minutes, 0);
  const lastSetup = setups.value.at(-1);
  const frame = lastSetup ? calculateSetup(lastSetup) : null;
  const activeInfo = tabs.find((t) => t.id === active)!;
  function saveMatch(m: Match) {
    if (!isMatch(m) || !m.opponent || !m.score) {
      setNotice("Check the match details before saving.");
      return;
    }
    if (
      matches.save((current) =>
        current.some((x) => x.id === m.id)
          ? current.map((x) => (x.id === m.id ? m : x))
          : [m, ...current],
      )
    ) {
      setForm(null);
      navigate("matches");
      setNotice("Match saved on this device.");
    }
  }
  function exportBackup() {
    try {
      downloadJson(`baseline-backup-${today()}.json`, {
        version: 2,
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
      const data = JSON.parse(await file.text());
      if (
        data.version !== 2 ||
        !validMatches(data.matches) ||
        !validSessions(data.practice) ||
        !validSetups(data.setups)
      )
        throw new Error();
      const a = matches.save((current) => mergeById(current, data.matches));
      const b = sessions.save((current) => mergeById(current, data.practice));
      const c = setups.save((current) => mergeById(current, data.setups));
      setNotice(
        a && b && c
          ? "Backup imported. Existing entries with the same ID were kept."
          : "Some entries could not be saved. Your original backup file is unchanged.",
      );
    } catch {
      setNotice(
        "This backup could not be imported. Use a Baseline v2 JSON backup under 5 MB.",
      );
    } finally {
      e.target.value = "";
    }
  }
  async function signOut() {
    try {
      await createClient().auth.signOut();
      setEmail("");
    } catch {
      setNotice("Could not sign out. Please try again.");
    }
  }
  return (
    <div className="baseline-workspace">
      <a href="#workspace-content" className="skip-link">
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
        <div className="nav-caption">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {tabs.map((t) => (
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
          ))}
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
            disabled={!matches.ready || !sessions.ready}
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
          <div className="account">
            <span className="status-dot" />
            <span>{email || "Personal workspace"}</span>
            {email ? (
              <button onClick={signOut}>Sign out</button>
            ) : (
              <Link href="/auth/login">Sign in</Link>
            )}
          </div>
        </header>
        <main id="workspace-content" className="workspace-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {active === "overview"
                  ? "THE EVERYDAY TENNIS WORKSPACE"
                  : "BASELINE / " + activeInfo.name.toUpperCase()}
              </div>
              <h1>
                {active === "overview"
                  ? "Make your next session count."
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
          {(notice || matches.error || sessions.error) && (
            <p className="notice" role="status">
              {notice || matches.error || sessions.error}
            </p>
          )}
          {active === "overview" && (
            <>
              <section className="overview-hero">
                <div className="hero-copy">
                  <span className="hero-tag">
                    <span className="status-dot" />
                    THE DETAILS MAKE THE DIFFERENCE
                  </span>
                  <h2>
                    Your racket.
                    <br />
                    Your feel. <em>Your game.</em>
                  </h2>
                  <p>
                    Explore a few grams here, a new balance there.
                    <br className="desktop-only" /> Make your next change with a
                    clearer picture.
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
                  BUILD IT. COMPARE IT. TAKE IT TO COURT.
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
                  note={`${sessions.value.length} sessions in your journal`}
                />
              </section>
              <div className="overview-grid">
                <section className="panel setup-overview">
                  <div className="section-heading">
                    <div className="eyebrow">
                      <Icon name="racket" />
                      YOUR EQUIPMENT
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
                      <strong>{frame?.swingweight?.toFixed(0) || "—"}</strong>
                      <span>SW ESTIMATE</span>
                    </div>
                  </div>
                  <div className="card-bottom">
                    <span>
                      {lastSetup
                        ? `${setups.value.length} saved setups · estimates`
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
                    <span className="badge">15 MIN / SOLO</span>
                  </div>
                  <span className="session-number">
                    01 <span>/ SERVE</span>
                  </span>
                  <h2>Serve with a destination.</h2>
                  <p>
                    Three targets. Thirty serves. Give every ball a purpose and
                    keep a result you can improve.
                  </p>
                  <div className="practice-target">
                    <Icon name="check" />
                    Target: record hits out of 30 serves
                  </div>
                  <button
                    className="text-button"
                    onClick={() => practice("serve")}
                  >
                    View session plan <Icon name="arrow" />
                  </button>
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
                          onClick={() => navigate("matches")}
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
          {active === "racquet-lab" && <RacquetLab />}
          {active === "matches" && (
            <MatchHub
              matches={matches.value}
              onLog={() => setForm("new")}
              onEdit={setForm}
              onPractice={practice}
            />
          )}
          {active === "training" && (
            <TrainingHub
              key={initialDrill}
              sessions={sessions.value}
              saveSessions={sessions.save}
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
              baseline <b>·</b> Built for the time between matches.
            </span>
            <span>Your next improvement starts with a detail.</span>
          </footer>
        </main>
      </div>
      {form && (
        <MatchForm
          initial={form === "new" ? undefined : form}
          onSave={saveMatch}
          onClose={() => setForm(null)}
        />
      )}
    </div>
  );
}
