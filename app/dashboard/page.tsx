"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import StrokeRecorder from "@/components/StrokeRecorder";
import VideoGallery from "@/components/VideoGallery";
import RacquetLab from "@/components/RacquetLab";
import AIDebrief from "@/components/AIDebrief";

type TabType = "matches" | "lessons" | "exercises" | "gallery" | "racquet-lab";

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

type Lesson = {
  id: string;
  title: string;
  level: string;
  videoUrl: string;
  description: string;
  tacticalFocus: string[];
};

function getYouTubeEmbedUrl(url: string) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("youtube.com") && parsedUrl.pathname === "/watch") {
      const videoId = parsedUrl.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }

    if (parsedUrl.hostname === "youtu.be") {
      const videoId = parsedUrl.pathname.replace("/", "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }

    return url;
  } catch {
    return url;
  }
}

function LessonsList() {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  const lessons: Lesson[] = [
    {
      id: "l1",
      title: "Intro to Footwork",
      level: "Beginner",
      videoUrl: "https://www.youtube.com/embed/PX6n7jvbCj0",
      description: "Master the split step and explosive first movement. This biomechanical breakdown focuses on loading the outside leg for optimal power transfer on the run.",
      tacticalFocus: ["Split step timing", "Unit turn initiation", "Recovery steps"],
    },
    {
      id: "l2",
      title: "Approach Shot Mechanics",
      level: "Intermediate",
      videoUrl: "https://www.youtube.com/embed/0ZyBhUKTDmY",
      description: "Build a cleaner transition pattern by pairing compact preparation with forward momentum through the contact zone.",
      tacticalFocus: ["Short-ball recognition", "Contact in front", "Net closing path"],
    },
    {
      id: "l3",
      title: "Aggressive Baseline Patterns",
      level: "Advanced",
      videoUrl: "https://www.youtube.com/embed/ZZS1xFyUyf0",
      description: "Learn how to use height, depth, and court position to create attackable balls without forcing low-percentage winners.",
      tacticalFocus: ["Crosscourt pressure", "Inside-out forehand setup", "Recovery positioning"],
    },
    {
      id: "l4",
      title: "Pro Serve Placement",
      level: "Pro",
      videoUrl: "https://www.youtube.com/embed/T_5osrG-fGI",
      description: "Refine serve targets by connecting toss consistency, shoulder rotation, and tactical intent before the first ball.",
      tacticalFocus: ["T serve pattern", "Body serve jam", "Wide serve plus one"],
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="rounded-lg border border-baseline-border p-4 bg-baseline-dark-4">
            <h3 className="font-semibold">{lesson.title}</h3>
            <p className="text-xs text-baseline-text-dim mt-1">Level: {lesson.level}</p>
            <button
              onClick={() => setActiveLesson(lesson)}
              className="mt-3 inline-flex items-center gap-2 rounded bg-baseline-green px-3 py-1 text-xs font-semibold text-baseline-dark hover:bg-lime-300"
            >
              Open Lesson
            </button>

            <div className="mt-4">
              <div className="text-xs text-baseline-text-dim mb-2">Practice Recorder</div>
              <StrokeRecorder lessonTitle={lesson.title} />
            </div>
          </div>
        ))}
      </div>

      {activeLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
            <div className="w-full md:w-3/5 aspect-video bg-black">
              <iframe
                className="w-full h-full"
                src={getYouTubeEmbedUrl(activeLesson.videoUrl)}
                title="Lesson Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="w-full md:w-2/5 p-8 flex flex-col">
              <div className="flex-grow">
                <h2 className="text-2xl font-bold text-white mb-2">{activeLesson.title}</h2>
                <div className="inline-block bg-neutral-800 text-neutral-300 px-2 py-1 rounded text-xs uppercase tracking-wider mb-6">
                  {activeLesson.level}
                </div>

                <h4 className="text-lime-400 font-bold mb-2">Biomechanical Breakdown</h4>
                <p className="text-neutral-400 text-sm leading-relaxed mb-6">{activeLesson.description}</p>

                <h4 className="text-lime-400 font-bold mb-2">Tactical Focus</h4>
                <ul className="list-disc list-inside text-neutral-400 text-sm space-y-1">
                  {activeLesson.tacticalFocus.map((focus, i) => (
                    <li key={i}>{focus}</li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => setActiveLesson(null)}
                className="mt-8 w-full border border-neutral-700 text-white px-4 py-3 rounded-lg font-bold hover:bg-neutral-800 transition"
              >
                Close Lesson
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExercisesHub() {
  const exercises = [
    {
      title: "Serve Target Ladder",
      description: "Hit five serves each to T, body, and wide targets before moving up a target zone.",
      focus: "Serve accuracy",
    },
    {
      title: "10-Ball Baseline Challenge",
      description: "Build rallies of 10 high-margin balls before changing direction or accelerating.",
      focus: "Consistency",
    },
    {
      title: "Approach and Recover",
      description: "Attack a short ball, close the net, then recover for the next feed.",
      focus: "Transition play",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {exercises.map((exercise) => (
        <article key={exercise.title} className="rounded-xl border border-baseline-border bg-baseline-dark-3 p-5">
          <span className="text-[10px] uppercase font-mono text-baseline-green">{exercise.focus}</span>
          <h3 className="mt-2 font-display text-lg font-bold text-baseline-text-primary">{exercise.title}</h3>
          <p className="mt-3 text-sm text-baseline-text-secondary">{exercise.description}</p>
        </article>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("matches");

  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [showLogForm, setShowLogForm] = useState(false);
  const [opponent, setOpponent] = useState("");
  const [score, setScore] = useState("");
  const [surface, setSurface] = useState<Match["surface"]>("hard");
  const [style, setStyle] = useState("All-Court");
  const [firstServe, setFirstServe] = useState(60);
  const [unforcedErrors, setUnforcedErrors] = useState(20);
  const [result, setResult] = useState<"win" | "loss">("win");
  const [notes, setNotes] = useState("");

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
      notes: "Sinner played highly aggressive from the baseline. My first serve rate was too low, giving away too many easy break points.",
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
      notes: "Extremely clean match. Maintained high patience during long rallies. Serve percentage was strong and unforced errors were minimized.",
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
      notes: "Epic physical battle. Recovered from 2-4 down in the third set. Drop shots were effective on the clay.",
    },
  ];

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setUser({
          id: "guest-user-id",
          email: "tennis.champion@baseline.app",
          user_metadata: { full_name: "Javier" },
        });
      } else {
        setUser(data.user);
      }

      const localMatches = localStorage.getItem("baseline_matches");
      if (localMatches) {
        try {
          const parsed = JSON.parse(localMatches);
          setMatches(parsed);
          if (parsed.length > 0) setSelectedMatch(parsed[0]);
        } catch {
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

  function handleLogMatch(e: FormEvent) {
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
      notes,
    };

    const updated = [newMatch, ...matches];
    setMatches(updated);
    localStorage.setItem("baseline_matches", JSON.stringify(updated));
    setSelectedMatch(newMatch);
    setOpponent("");
    setScore("");
    setSurface("hard");
    setStyle("All-Court");
    setFirstServe(60);
    setUnforcedErrors(20);
    setResult("win");
    setNotes("");
    setShowLogForm(false);
    setAiReport(null);
  }

  function handleAnalyzeMatch(match: Match) {
    setAiLoading(true);
    setAiReport(null);

    setTimeout(() => {
      const analysis =
        match.result === "win"
          ? `### Claude AI Coach Analysis: Match Victory against **${match.opponent}**

Outstanding work on securing the victory. Let's examine the performance data to see what made this match highly effective.

#### Key Performance Indicators
* **First Serve Efficiency**: **${match.firstServe}%** ${match.firstServe >= 65 ? "Exceptional" : "Moderate"} (Your standard target is 65%).
* **Shot Selection Stability**: Only **${match.unforcedErrors}** unforced errors. This reflects solid shot selection and patience from the back of the court.

#### Tactical Insights
1. **Patience & Execution**: Your high-margin depth restricted the opponent's offensive output.
2. **Surface Leverage**: On **${match.surface.replace("_", " ")}**, your movement and anticipation helped you recover quickly.

#### Professional Coaching Drills
* **Dynamic Depth Drill**: Put a target strip 3 feet inside the baseline and hit 20 crosscourt forehands toward it.
* **Serve Control**: Work on wide slices from the deuce court to stretch opponents early.`
          : `### Claude AI Coach Analysis: Post-Match Debrief vs **${match.opponent}**

Every match is either a win or a useful diagnostic dataset. Let's analyze the performance gaps and rebuild the tactical plan.

#### Diagnostic Indicators
* **First Serve Pressure**: **${match.firstServe}%** is below the optimal **65%** threshold.
* **Unforced Error Count**: **${match.unforcedErrors}** errors points to forcing play early or losing footwork quality.

#### Strategic Adjustments
1. **Second Serve Protection**: Add more kick to push opponents back and reduce return pressure.
2. **Defensive Neutralization**: Use higher-clearance defensive balls to reset rallies on **${match.surface.replace("_", " ")}**.

#### Improvement Action Plan
* **Serves & Target Drills**: Practice 50 serves to T, body, and wide zones.
* **Consistency Rallies**: Build rallies of at least 10 high-margin hits before acceleration.`;

      setAiReport(analysis);
      setAiLoading(false);
    }, 1500);
  }

  const totalMatches = matches.length;
  const wins = matches.filter((match) => match.result === "win").length;
  const losses = totalMatches - wins;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  const avgFirstServe =
    totalMatches > 0 ? Math.round(matches.reduce((acc, match) => acc + match.firstServe, 0) / totalMatches) : 0;

  const surfaceCounts = matches.reduce((acc, match) => {
    acc[match.surface] = (acc[match.surface] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const favoriteSurface =
    Object.entries(surfaceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

  const tabs: { id: TabType; label: string }[] = [
    { id: "matches", label: "Matches" },
    { id: "lessons", label: "Lessons" },
    { id: "exercises", label: "Exercises" },
    { id: "gallery", label: "Gallery" },
    { id: "racquet-lab", label: "Racquet Lab" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-baseline-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-baseline-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-baseline-text-secondary font-mono text-sm">Synchronizing match intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-baseline-dark text-baseline-text-primary relative overflow-x-hidden flex flex-col">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-baseline-green/3 blur-[140px] rounded-full pointer-events-none" />

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

      <main className="relative z-10 flex-1 px-4 md:px-12 py-8 max-w-7xl mx-auto w-full">
        <div className="mb-8 overflow-x-auto border-b border-baseline-border">
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-xs font-mono uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "border-baseline-green text-baseline-green"
                    : "border-transparent text-baseline-text-dim hover:text-baseline-text-secondary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "matches" && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 flex flex-col gap-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-xl border border-baseline-border bg-baseline-dark-3/60 backdrop-blur-sm p-4 hover:border-baseline-green/20 transition-all">
                  <span className="text-xs text-baseline-text-dim uppercase tracking-wider font-mono">Win Rate</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-bold font-display text-baseline-green">{winRate}%</span>
                    <span className="text-xs text-baseline-text-secondary">({wins}W - {losses}L)</span>
                  </div>
                </div>

                <div className="rounded-xl border border-baseline-border bg-baseline-dark-3/60 backdrop-blur-sm p-4 hover:border-baseline-green/20 transition-all">
                  <span className="text-xs text-baseline-text-dim uppercase tracking-wider font-mono">Total Logged</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-bold font-display text-baseline-text-primary">{totalMatches}</span>
                    <span className="text-xs text-baseline-text-secondary">Matches</span>
                  </div>
                </div>

                <div className="rounded-xl border border-baseline-border bg-baseline-dark-3/60 backdrop-blur-sm p-4 hover:border-baseline-green/20 transition-all">
                  <span className="text-xs text-baseline-text-dim uppercase tracking-wider font-mono">Avg First Serve</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-bold font-display text-baseline-text-primary">{avgFirstServe}%</span>
                    <span className="text-xs text-baseline-text-dim font-mono">target &gt;65%</span>
                  </div>
                </div>

                <div className="rounded-xl border border-baseline-border bg-baseline-dark-3/60 backdrop-blur-sm p-4 hover:border-baseline-green/20 transition-all">
                  <span className="text-xs text-baseline-text-dim uppercase tracking-wider font-mono">Fav Surface</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-lg font-bold font-display text-baseline-text-primary capitalize">
                      {favoriteSurface.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-baseline-border bg-baseline-dark-3/40 backdrop-blur-sm p-6 flex flex-col gap-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl font-bold text-baseline-text-primary">Match Logbook</h2>
                    <p className="text-xs text-baseline-text-dim">Record match telemetry and review AI diagnostics</p>
                  </div>
                  <button
                    onClick={() => setShowLogForm(!showLogForm)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-baseline-green hover:bg-baseline-green-dim px-4 py-2 text-xs font-semibold text-baseline-dark transition-all font-mono"
                  >
                    {showLogForm ? "Cancel Logging" : "Log New Match +"}
                  </button>
                </div>

                {showLogForm && (
                  <form onSubmit={handleLogMatch} className="rounded-xl border border-baseline-green/10 bg-baseline-dark-4/80 p-5 space-y-4">
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
                        rows={4}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any notes, observational insights, or coaching cues..."
                        className="w-full mt-2 rounded-lg border border-baseline-border bg-baseline-dark px-3 py-2 text-sm text-baseline-text-primary placeholder:text-baseline-text-dim focus:outline-none focus:ring-1 focus:ring-baseline-green/30"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center rounded-lg bg-baseline-green hover:bg-baseline-green-dim px-4 py-2 text-xs font-semibold text-baseline-dark transition-all font-mono"
                      >
                        Save Match
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
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
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              match.result === "win" ? "bg-baseline-green animate-pulse-glow" : "bg-red-500"
                            }`}
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-baseline-text-primary text-sm sm:text-base">
                                vs {match.opponent}
                              </span>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                                  match.surface === "clay"
                                    ? "bg-surface-clay/20 text-orange-400 border border-orange-500/20"
                                    : match.surface === "grass"
                                      ? "bg-surface-grass/20 text-green-400 border border-green-500/20"
                                      : match.surface === "hard"
                                        ? "bg-surface-hard/20 text-blue-400 border border-blue-500/20"
                                        : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                }`}
                              >
                                {match.surface.replace("_", " ")}
                              </span>
                            </div>
                            <span className="text-xs text-baseline-text-dim font-mono">
                              {match.date} - {match.style}
                            </span>
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
            </div>

            <aside className="lg:col-span-4 flex flex-col gap-6">
              <div className="rounded-2xl border border-baseline-border bg-baseline-dark-3/60 backdrop-blur-sm p-6 h-full flex flex-col">
                <div className="flex items-center gap-2 border-b border-baseline-border pb-4 mb-4">
                  <div>
                    <h3 className="font-display font-bold text-base text-baseline-text-primary">AI Coach</h3>
                    <span className="text-[9px] text-baseline-green font-mono uppercase tracking-wider">
                      Claude Performance Model
                    </span>
                  </div>
                </div>

                {selectedMatch ? (
                  <div className="flex-1 flex flex-col">
                    <div className="mb-4">
                      <span className="text-[10px] text-baseline-text-dim uppercase font-mono block">Selected telemetry</span>
                      <span className="font-semibold text-sm text-baseline-text-secondary">
                        vs {selectedMatch.opponent} ({selectedMatch.score})
                      </span>
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
                          Analyze Performance With Claude
                        </button>
                      </div>
                    )}

                    {aiLoading && (
                      <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-8 h-8 border-3 border-baseline-green border-t-transparent rounded-full animate-spin mb-4" />
                        <span className="text-xs text-baseline-text-secondary font-mono">
                          Claude is parsing serving vectors and stroke depth ratios...
                        </span>
                      </div>
                    )}

                    {aiReport && (
                      <div className="flex-1 overflow-y-auto max-h-[460px] pr-1 space-y-4 animate-fade-in text-sm font-sans leading-relaxed text-baseline-text-secondary select-text">
                        <div className="border border-baseline-green/10 bg-baseline-green/5 rounded-lg p-3 text-xs border-dashed text-baseline-green font-mono">
                          Analytical pattern matching finished. Strategic directives loaded below.
                        </div>

                        <div className="prose prose-invert prose-xs text-xs space-y-4">
                          {aiReport.split("\n\n").map((para, i) => {
                            if (para.startsWith("###")) {
                              return (
                                <h4 key={i} className="text-sm font-bold text-baseline-text-primary mt-4 border-b border-baseline-border pb-1 font-display">
                                  {para.replace("###", "")}
                                </h4>
                              );
                            }
                            if (para.startsWith("####")) {
                              return (
                                <h5 key={i} className="text-xs font-bold text-baseline-green uppercase tracking-wide font-mono mt-3">
                                  {para.replace("####", "")}
                                </h5>
                              );
                            }
                            if (para.startsWith("*") || para.startsWith("-")) {
                              return (
                                <ul key={i} className="list-disc list-inside space-y-1.5 text-baseline-text-secondary">
                                  {para.split("\n").map((li, j) => (
                                    <li key={j} className="marker:text-baseline-green">
                                      {li.replace(/^[\*\-\s]+/, "")}
                                    </li>
                                  ))}
                                </ul>
                              );
                            }
                            if (para.match(/^\d+\./)) {
                              return (
                                <ol key={i} className="list-decimal list-inside space-y-1.5 text-baseline-text-secondary">
                                  {para.split("\n").map((li, j) => (
                                    <li key={j} className="marker:text-baseline-green">
                                      {li.replace(/^\d+\.\s+/, "")}
                                    </li>
                                  ))}
                                </ol>
                              );
                            }
                            return (
                              <p key={i} className="text-baseline-text-secondary">
                                {para}
                              </p>
                            );
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
            </aside>
          </section>
        )}

        {activeTab === "lessons" && (
          <section className="flex flex-col gap-8">
            <div className="rounded-2xl border border-baseline-border bg-baseline-dark-3/40 p-6">
              <h2 className="font-display text-xl font-bold mb-4">Lessons</h2>
              <LessonsList />
            </div>

            <div className="border-t border-baseline-border pt-8">
              <h2 className="font-display text-xl font-bold mb-4">Tactical Debrief</h2>
              <AIDebrief />
            </div>
          </section>
        )}

        {activeTab === "exercises" && (
          <section className="flex flex-col gap-8">
            <div className="rounded-2xl border border-baseline-border bg-baseline-dark-3/40 p-6">
              <h2 className="font-display text-xl font-bold mb-4">Exercises & Drills</h2>
              <ExercisesHub />
            </div>
          </section>
        )}

        {activeTab === "gallery" && (
          <section className="flex flex-col gap-8">
            <div className="rounded-2xl border border-baseline-border bg-baseline-dark-3/40 p-6">
              <h2 className="font-display text-xl font-bold mb-4">Video Gallery</h2>
              <VideoGallery />
            </div>
          </section>
        )}

        {activeTab === "racquet-lab" && (
          <section className="flex flex-col gap-8">
            <div className="rounded-2xl border border-baseline-border bg-baseline-dark-3/40 p-6">
              <RacquetLab />
            </div>
          </section>
        )}
      </main>

      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-baseline-green/2 blur-[120px] rounded-full pointer-events-none" />

      <footer className="relative z-10 border-t border-baseline-border bg-baseline-dark-2/20 backdrop-blur-sm px-6 py-6 mt-12 text-center text-[10px] font-mono text-baseline-text-dim">
        <span>2026 Baseline Performance Intelligence. Longitudinal athletic diagnostics dataset platform.</span>
      </footer>
    </div>
  );
}
