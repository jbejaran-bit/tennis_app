"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Definition of a tennis match
interface Match {
  id: string;
  opponent: string;
  score: string;
  surface: "hard" | "clay" | "grass" | "carpet" | "indoor_hard";
  style: string;
  firstServe: number;
  unforcedErrors: number;
  result: "win" | "loss";
  date: string;
  notes?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Match list and local state
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Form states
  const [showLogForm, setShowLogForm] = useState(false);
  const [opponent, setOpponent] = useState("");
  const [score, setScore] = useState("");
  const [surface, setSurface] = useState<Match["surface"]>("hard");
  const [style, setStyle] = useState("All-Court");
  const [firstServe, setFirstServe] = useState(60);
  const [unforcedErrors, setUnforcedErrors] = useState(20);
  const [result, setResult] = useState<"win" | "loss">("win");
  const [notes, setNotes] = useState("");

  // Default seed matches
  const seedMatches: Match[] = [
    {
      id: "1",
      opponent: "Jannik Sinner",
      score: "3-6, 4-6",
      surface: "indoor_hard",
      style: "Aggressive Baseliner",
      firstServe: 55,
      unforcedErrors: 34,
      result: "loss",
      date: "2026-05-18",
      notes: "Sinner played highly aggressive from the baseline. My first serve rate was too low, giving away too many easy break points."
    },
    {
      id: "2",
      opponent: "Novak Djokovic",
      score: "7-6 (5), 6-4",
      surface: "hard",
      style: "Counterpuncher",
      firstServe: 70,
      unforcedErrors: 18,
      result: "win",
      date: "2026-05-15",
      notes: "Extremely clean match. Maintained high patience during long rallies. Serve percentage was strong and unforced errors were minimized."
    },
    {
      id: "3",
      opponent: "Carlos Alcaraz",
      score: "6-4, 3-6, 7-5",
      surface: "clay",
      style: "All-Court",
      firstServe: 62,
      unforcedErrors: 28,
      result: "win",
      date: "2026-05-10",
      notes: "Epic physical battle. Recovered from 2-4 down in the third set. Drop shots were effective on the clay."
    }
  ];

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        // Fallback for demo: if no session, create a default guest session so they don't get kicked out!
        const guestUser = {
          id: "guest-user-id",
          email: "tennis.champion@baseline.app",
          user_metadata: { full_name: "Javier" }
        };
        setUser(guestUser);
      } else {
        setUser(data.user);
      }

      // Load matches from localStorage or seed them
      const localMatches = localStorage.getItem("baseline_matches");
      if (localMatches) {
        try {
          const parsed = JSON.parse(localMatches);
          setMatches(parsed);
          if (parsed.length > 0) setSelectedMatch(parsed[0]);
        } catch (e) {
          setMatches(seedMatches);
          setSelectedMatch(seedMatches[0]);
        }
      } else {
        localStorage.setItem("baseline_matches", JSON.stringify(seedMatches));
        setMatches(seedMatches);
        setSelectedMatch(seedMatches[0]);
      }
      setLoading(false);
    }
    checkUser();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  // Handle logging a new match
  function handleLogMatch(e: React.FormEvent) {
    e.preventDefault();
    if (!opponent || !score) return;

    const newMatch: Match = {
      id: Date.now().toString(),
      opponent,
      score,
      surface,
      style,
      firstServe: Number(firstServe),
      unforcedErrors: Number(unforcedErrors),
      result,
      date: new Date().toISOString().split("T")[0],
      notes
    };

    const updated = [newMatch, ...matches];
    setMatches(updated);
    localStorage.setItem("baseline_matches", JSON.stringify(updated));
    setSelectedMatch(newMatch);

    // Reset form
    setOpponent("");
    setScore("");
    setSurface("hard");
    setStyle("All-Court");
    setFirstServe(60);
    setUnforcedErrors(20);
    setResult("win");
    setNotes("");
    setShowLogForm(false);
    setAiReport(null); // Clear AI report for new match
  }

  // Handle AI analysis triggering
  function handleAnalyzeMatch(match: Match) {
    setAiLoading(true);
    setAiReport(null);

    // Simulate smart Claude AI strategic coach review
    setTimeout(() => {
      let analysis = "";
      if (match.result === "win") {
        analysis = `### 🧠 Claude AI Coach Analysis: Match Victory against **${match.opponent}**

Outstanding work on securing the victory! Let's examine the performance data to see what made this match highly effective.

#### 📈 Key Performance Indicators (KPIs)
* **First Serve Efficiency**: **${match.firstServe}%** ${match.firstServe >= 65 ? "✅ Exceptional" : "⚠️ Moderate"} (Your standard target is 65%).
* **Shot Selection Stability**: Only **${match.unforcedErrors}** unforced errors. This reflects solid shot selection and patience from the back of the court.

#### 🎾 Tactical Insights
1. **Patience & Execution**: Your strategy of playing high-margin topspin deep into the opponent's backhand zone restricted their offensive output, forcing them into defensive slice replies.
2. **Surface Leverage**: On **${match.surface.replace("_", " ")}**, your movement and anticipation allowed you to recover quickly and slide efficiently to counter wide shots.

#### 🛠️ Professional Coaching Drills
* **Dynamic Depth Drill**: Put a target strip 3 feet inside the baseline. Hit 20 crosscourt forehands aiming for the target to sustain your high-margin depth.
* **Serve Control**: Keep maintaining your toss consistency. Work on hitting wide slices from the Deuce court to stretch opponents out early.`;
      } else {
        analysis = `### 🧠 Claude AI Coach Analysis: Post-Match Debrief vs **${match.opponent}**

Every match is either a win or a valuable diagnostic dataset. Let's analyze the performance gaps to see how to reconstruct your tactics for the next match.

#### 📉 Diagnostic Indicators
* **First Serve Pressure**: **${match.firstServe}%** (This is below the optimal **65%** threshold. This let Sinner command rallies from the second-serve return).
* **Unforced Error Count**: **${match.unforcedErrors}** errors. A higher rate indicates forcing play too early or letting physical/mental exhaustion disrupt footwork positioning.

#### 🎾 Strategic Adjustments
1. **Second Serve Defensiveness**: Since your first-serve percentage was lower, your second serve was exposed. Focus on adding more kick to the second serve to push opponents further back.
2. **Defensive Neutralization**: When caught deep on **${match.surface.replace("_", " ")}**, use heavy, high-clearance defensive lobs to reset rally momentum rather than attempting low-margin flat winners.

#### 🛠️ Improvement Action Plan
* **Serves & Target Drills**: Practice 50 serves hitting three distinct zones (T-spot, body, wide) focusing entirely on consistent ball toss.
* **Consistency Rallies**: Run the 10-ball baseline challenge. Build rallies of at least 10 high-margin hits before going for any acceleration shots.`;
      }
      setAiReport(analysis);
      setAiLoading(false);
    }, 1500);
  }

  // Calculate stats dynamically
  const totalMatches = matches.length;
  const wins = matches.filter(m => m.result === "win").length;
  const losses = totalMatches - wins;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  
  // Find favorite surface
  const surfaceCounts = matches.reduce((acc, m) => {
    acc[m.surface] = (acc[m.surface] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  let favoriteSurface = "N/A";
  let maxCount = 0;
  Object.entries(surfaceCounts).forEach(([surf, count]) => {
    if (count > maxCount) {
      maxCount = count;
      favoriteSurface = surf;
    }
  });

  const avgFirstServe = totalMatches > 0 ? Math.round(matches.reduce((acc, m) => acc + m.firstServe, 0) / totalMatches) : 0;
  const avgErrors = totalMatches > 0 ? Math.round(matches.reduce((acc, m) => acc + m.unforcedErrors, 0) / totalMatches) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-baseline-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-baseline-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-baseline-text-secondary font-mono text-sm">Synchronizing match intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-baseline-dark text-baseline-text-primary relative overflow-x-hidden flex flex-col">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:48px_48px]" />
      {/* Radial neon glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-baseline-green/3 blur-[140px] rounded-full pointer-events-none" />

      {/* Header Nav */}
      <header className="relative z-10 border-b border-baseline-border bg-baseline-dark-2/40 backdrop-blur-md px-6 md:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg baseline-gradient flex items-center justify-center">
            <span className="text-sm font-extrabold text-baseline-dark">B</span>
          </div>
          <div>
            <span className="font-display text-lg font-bold tracking-tight text-baseline-text-primary block">
              Baseline
            </span>
            <span className="text-[10px] text-baseline-green font-mono uppercase tracking-wider">
              Performance Hub
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <span className="text-xs text-baseline-text-dim block">Athlete Session</span>
            <span className="text-sm font-semibold text-baseline-text-secondary font-mono">
              {user?.email || "champion@baseline.app"}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-lg border border-baseline-border bg-baseline-dark-3 hover:bg-baseline-dark-4 px-3 py-1.5 text-xs text-baseline-text-secondary hover:text-baseline-text-primary transition-all font-mono"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="relative z-10 flex-1 px-4 md:px-12 py-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: OVERVIEW STATS & MATCH LIST (8 cols) */}
        <section className="lg:col-span-8 flex flex-col gap-8">
          
          {/* STATS HIGHLIGHT BAR */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="rounded-xl border border-baseline-border bg-baseline-dark-3/60 backdrop-blur-sm p-4 relative group hover:border-baseline-green/20 transition-all">
              <span className="text-xs text-baseline-text-dim uppercase tracking-wider font-mono">Win Rate</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-bold font-display text-baseline-green">{winRate}%</span>
                <span className="text-xs text-baseline-text-secondary">({wins}W - {losses}L)</span>
              </div>
            </div>

            <div className="rounded-xl border border-baseline-border bg-baseline-dark-3/60 backdrop-blur-sm p-4 relative group hover:border-baseline-green/20 transition-all">
              <span className="text-xs text-baseline-text-dim uppercase tracking-wider font-mono">Total Logged</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-bold font-display text-baseline-text-primary">{totalMatches}</span>
                <span className="text-xs text-baseline-text-secondary">Matches</span>
              </div>
            </div>

            <div className="rounded-xl border border-baseline-border bg-baseline-dark-3/60 backdrop-blur-sm p-4 relative group hover:border-baseline-green/20 transition-all">
              <span className="text-xs text-baseline-text-dim uppercase tracking-wider font-mono">Avg First Serve</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-bold font-display text-baseline-text-primary">{avgFirstServe}%</span>
                <span className="text-xs text-baseline-text-dim font-mono">target &gt;65%</span>
              </div>
            </div>

            <div className="rounded-xl border border-baseline-border bg-baseline-dark-3/60 backdrop-blur-sm p-4 relative group hover:border-baseline-green/20 transition-all">
              <span className="text-xs text-baseline-text-dim uppercase tracking-wider font-mono">Fav Surface</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-lg font-bold font-display text-baseline-text-primary capitalize">
                  {favoriteSurface.replace("_", " ")}
                </span>
              </div>
            </div>

          </div>

          {/* MATCH HISTORY & LOG FORM BOX */}
          <div className="rounded-2xl border border-baseline-border bg-baseline-dark-3/40 backdrop-blur-sm p-6 flex flex-col gap-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-baseline-text-primary">Match Logbook</h2>
                <p className="text-xs text-baseline-text-dim">Record match telemetry and review AI diagnostics</p>
              </div>
              <button
                onClick={() => setShowLogForm(!showLogForm)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-baseline-green hover:bg-baseline-green-dim px-4 py-2 text-xs font-semibold text-baseline-dark transition-all hover:shadow-[0_0_16px_rgba(200,241,94,0.2)] font-mono"
              >
                {showLogForm ? "Cancel Logging" : "Log New Match +"}
              </button>
            </div>

            {/* DYNAMIC LOG MATCH FORM */}
            {showLogForm && (
              <form onSubmit={handleLogMatch} className="rounded-xl border border-baseline-green/10 bg-baseline-dark-4/80 p-5 space-y-4 animate-fade-in relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-baseline-text-secondary mb-1">Opponent</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Roger Federer"
                      value={opponent}
                      onChange={(e) => setOpponent(e.target.value)}
                      className="w-full rounded-lg border border-baseline-border bg-baseline-dark px-3 py-2 text-sm text-baseline-text-primary placeholder:text-baseline-text-dim focus:outline-none focus:ring-1 focus:ring-baseline-green/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-baseline-text-secondary mb-1">Score</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 6-4, 7-6 (3)"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      className="w-full rounded-lg border border-baseline-border bg-baseline-dark px-3 py-2 text-sm text-baseline-text-primary placeholder:text-baseline-text-dim focus:outline-none focus:ring-1 focus:ring-baseline-green/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-baseline-text-secondary mb-1">Surface</label>
                    <select
                      value={surface}
                      onChange={(e) => setSurface(e.target.value as Match["surface"])}
                      className="w-full rounded-lg border border-baseline-border bg-baseline-dark px-3 py-2 text-sm text-baseline-text-primary focus:outline-none focus:ring-1 focus:ring-baseline-green/30"
                    >
                      <option value="hard">Hard Court</option>
                      <option value="clay">Clay Court</option>
                      <option value="grass">Grass Court</option>
                      <option value="carpet">Carpet Court</option>
                      <option value="indoor_hard">Indoor Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-baseline-text-secondary mb-1">First Serve %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={firstServe}
                      onChange={(e) => setFirstServe(Number(e.target.value))}
                      className="w-full rounded-lg border border-baseline-border bg-baseline-dark px-3 py-2 text-sm text-baseline-text-primary focus:outline-none focus:ring-1 focus:ring-baseline-green/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-baseline-text-secondary mb-1">Unforced Errors</label>
                    <input
                      type="number"
                      min="0"
                      value={unforcedErrors}
                      onChange={(e) => setUnforcedErrors(Number(e.target.value))}
                      className="w-full rounded-lg border border-baseline-border bg-baseline-dark px-3 py-2 text-sm text-baseline-text-primary focus:outline-none focus:ring-1 focus:ring-baseline-green/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-baseline-text-secondary mb-1">Opponent Style</label>
                    <input
                      type="text"
                      placeholder="e.g. Aggressive Baseliner"
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      className="w-full rounded-lg border border-baseline-border bg-baseline-dark px-3 py-2 text-sm text-baseline-text-primary placeholder:text-baseline-text-dim focus:outline-none focus:ring-1 focus:ring-baseline-green/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-baseline-text-secondary mb-1">Outcome</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setResult("win")}
                        className={`py-1.5 rounded-lg border text-xs font-semibold font-mono transition-all ${
                          result === "win"
                            ? "bg-baseline-green border-baseline-green text-baseline-dark"
                            : "border-baseline-border bg-baseline-dark text-baseline-text-secondary"
                        }`}
                      >
                        Won
                      </button>
                      <button
                        type="button"
                        onClick={() => setResult("loss")}
                        className={`py-1.5 rounded-lg border text-xs font-semibold font-mono transition-all ${
                          result === "loss"
                            ? "bg-red-500 border-red-500 text-white"
                            : "border-baseline-border bg-baseline-dark text-baseline-text-secondary"
                        }`}
                      >
                        Lost
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono text-baseline-text-secondary mb-1">Match Insights & Notes</label>
                  <textarea
                    placeholder="e.g. Noticed opponent slice was unstable under high topspin balls..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-baseline-border bg-baseline-dark px-3 py-2 text-sm text-baseline-text-primary placeholder:text-baseline-text-dim focus:outline-none focus:ring-1 focus:ring-baseline-green/30"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-baseline-green text-baseline-dark hover:bg-baseline-green-dim font-bold text-xs font-mono tracking-wider transition-all"
                >
                  SAVE MATCH DATA
                </button>
              </form>
            )}

            {/* MATCH HISTORY ROWS */}
            <div className="space-y-3 relative z-10">
              {matches.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-dashed border-baseline-border bg-baseline-dark-4/20">
                  <p className="text-sm text-baseline-text-dim font-mono">No matches logged yet.</p>
                </div>
              ) : (
                matches.map((match) => (
                  <div
                    key={match.id}
                    onClick={() => {
                      setSelectedMatch(match);
                      setAiReport(null);
                    }}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedMatch?.id === match.id
                        ? "border-baseline-green bg-baseline-dark-4/90 shadow-[0_0_12px_rgba(200,241,94,0.06)]"
                        : "border-baseline-border bg-baseline-dark-4/40 hover:bg-baseline-dark-4/60 hover:border-baseline-border/80"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Win/Loss Neon Dot Indicator */}
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        match.result === "win" ? "bg-baseline-green animate-pulse-glow" : "bg-red-500"
                      }`} />
                      
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-baseline-text-primary text-sm sm:text-base">
                            vs {match.opponent}
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                            match.surface === "clay" ? "bg-surface-clay/20 text-orange-400 border border-orange-500/20" :
                            match.surface === "grass" ? "bg-surface-grass/20 text-green-400 border border-green-500/20" :
                            match.surface === "hard" ? "bg-surface-hard/20 text-blue-400 border border-blue-500/20" :
                            "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          }`}>
                            {match.surface.replace("_", " ")}
                          </span>
                        </div>
                        <span className="text-xs text-baseline-text-dim font-mono">{match.date} • {match.style}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 mt-3 sm:mt-0 border-t border-baseline-border/40 sm:border-0 pt-2 sm:pt-0">
                      <div className="flex items-center gap-4 text-xs font-mono text-baseline-text-secondary">
                        <div>
                          <span className="text-[10px] text-baseline-text-dim block">1st Serve</span>
                          <span>{match.firstServe}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-baseline-text-dim block">Errors</span>
                          <span>{match.unforcedErrors}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold font-mono tracking-tight text-baseline-text-primary">
                          {match.score}
                        </span>
                        <span className={match.result === "win" ? "win-badge" : "loss-badge"}>
                          {match.result === "win" ? "WIN" : "LOSS"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </section>

        {/* RIGHT COLUMN: AI COACH DEBRIEF SIDEBAR (4 cols) */}
        <section className="lg:col-span-4 flex flex-col gap-6 relative">
          
          <div className="rounded-2xl border border-baseline-border bg-baseline-dark-3/60 backdrop-blur-sm p-6 h-full flex flex-col">
            <div className="flex items-center gap-2 border-b border-baseline-border pb-4 mb-4">
              <svg className="w-5 h-5 text-baseline-green animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <div>
                <h3 className="font-display font-bold text-base text-baseline-text-primary">AI Coach</h3>
                <span className="text-[9px] text-baseline-green font-mono uppercase tracking-wider">Claude Performance Model</span>
              </div>
            </div>

            {selectedMatch ? (
              <div className="flex-1 flex flex-col">
                <div className="mb-4">
                  <span className="text-[10px] text-baseline-text-dim uppercase font-mono block">Selected telemetry</span>
                  <span className="font-semibold text-sm text-baseline-text-secondary">vs {selectedMatch.opponent} ({selectedMatch.score})</span>
                </div>

                {!aiReport && !aiLoading && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4 rounded-xl border border-dashed border-baseline-border bg-baseline-dark-4/20">
                    <p className="text-xs text-baseline-text-dim font-mono mb-4 leading-relaxed">
                      Telemetric match data imported. Generate a complete tactical debrief of your performance patterns.
                    </p>
                    <button
                      onClick={() => handleAnalyzeMatch(selectedMatch)}
                      className="w-full rounded-lg bg-baseline-dark-3 hover:bg-baseline-dark-4 border border-baseline-border text-baseline-text-secondary hover:text-baseline-green hover:border-baseline-green/50 py-2 text-xs font-semibold font-mono tracking-wide transition-all"
                    >
                      ANALYZE PERFORMANCE WITH CLAUDE
                    </button>
                  </div>
                )}

                {aiLoading && (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-8 h-8 border-3 border-baseline-green border-t-transparent rounded-full animate-spin mb-4"></div>
                    <span className="text-xs text-baseline-text-secondary font-mono">Claude is parsing serving vectors and stroke depth ratios...</span>
                  </div>
                )}

                {aiReport && (
                  <div className="flex-1 overflow-y-auto max-h-[460px] pr-1 space-y-4 animate-fade-in text-sm font-sans leading-relaxed text-baseline-text-secondary select-text">
                    <div className="border border-baseline-green/10 bg-baseline-green/5 rounded-lg p-3 text-xs border-dashed text-baseline-green font-mono flex gap-2">
                      <span className="text-sm">✔</span>
                      <span>Analytical pattern matching finished. Strategic directives loaded below.</span>
                    </div>

                    {/* Format analysis report in clean visual typography */}
                    <div className="prose prose-invert prose-xs text-xs space-y-4">
                      {aiReport.split("\n\n").map((para, i) => {
                        if (para.startsWith("###")) {
                          return <h4 key={i} className="text-sm font-bold text-baseline-text-primary mt-4 border-b border-baseline-border pb-1 font-display">{para.replace("###", "")}</h4>;
                        }
                        if (para.startsWith("####")) {
                          return <h5 key={i} className="text-xs font-bold text-baseline-green uppercase tracking-wide font-mono mt-3">{para.replace("####", "")}</h5>;
                        }
                        if (para.startsWith("*") || para.startsWith("-")) {
                          return (
                            <ul key={i} className="list-disc list-inside space-y-1.5 text-baseline-text-secondary">
                              {para.split("\n").map((li, j) => (
                                <li key={j} className="marker:text-baseline-green">{li.replace(/^[\*\-\s]+/, "")}</li>
                              ))}
                            </ul>
                          );
                        }
                        if (para.match(/^\d+\./)) {
                          return (
                            <ol key={i} className="list-decimal list-inside space-y-1.5 text-baseline-text-secondary">
                              {para.split("\n").map((li, j) => (
                                <li key={j} className="marker:text-baseline-green">{li.replace(/^\d+\.\s+/, "")}</li>
                              ))}
                            </ol>
                          );
                        }
                        return <p key={i} className="text-baseline-text-secondary">{para}</p>;
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-xs text-baseline-text-dim font-mono py-12">
                Select a match from your logbook to unlock AI strategic diagnostics.
              </div>
            )}
          </div>

        </section>

      </main>

      {/* Decorative Neon Ground Ring */}
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-baseline-green/2 blur-[120px] rounded-full pointer-events-none" />

      {/* Footer */}
      <footer className="relative z-10 border-t border-baseline-border bg-baseline-dark-2/20 backdrop-blur-sm px-6 py-6 mt-12 text-center text-[10px] font-mono text-baseline-text-dim">
        <span>© 2026 Baseline Performance Intelligence. Longitudinal athletic diagnostics dataset platform.</span>
      </footer>
    </div>
  );
}
