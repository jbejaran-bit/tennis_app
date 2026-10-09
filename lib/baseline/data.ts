export type Match = {
  id: string;
  opponent: string;
  score: string;
  surface: string;
  style: string;
  firstServe: number | null;
  unforcedErrors: number | null;
  result: "win" | "loss";
  date: string;
  notes?: string;
  focus?: string;
  setup?: string;
};
export const surfaces: Record<string, string> = {
  hard: "Hard",
  clay: "Clay",
  grass: "Grass",
  indoor_hard: "Indoor hard",
  carpet: "Carpet",
};
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function dateLabel(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}
export function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const parsed = new Date(value + "T12:00:00Z");
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}
export function isMatch(value: unknown): value is Match {
  if (!value || typeof value !== "object") return false;
  const v = value as Match;
  return (
    typeof v.id === "string" &&
    v.id.length > 0 &&
    typeof v.opponent === "string" &&
    v.opponent.trim().length > 0 &&
    typeof v.score === "string" &&
    typeof v.style === "string" &&
    ["notes", "focus", "setup"].every(
      (k) => v[k] === undefined || typeof v[k] === "string",
    ) &&
    ["win", "loss"].includes(v.result) &&
    typeof v.surface === "string" &&
    Object.hasOwn(surfaces, v.surface) &&
    validDate(v.date) &&
    (v.firstServe === null ||
      (Number.isFinite(v.firstServe) &&
        v.firstServe >= 0 &&
        v.firstServe <= 100)) &&
    (v.unforcedErrors === null ||
      (Number.isInteger(v.unforcedErrors) &&
        v.unforcedErrors >= 0 &&
        v.unforcedErrors <= 999))
  );
}
export function isLegacyDemo(m: Match) {
  return (
    (m.id === "1" &&
      m.opponent === "Jannik Sinner" &&
      m.date === "2026-05-18") ||
    (m.id === "2" &&
      m.opponent === "Novak Djokovic" &&
      m.date === "2026-05-15") ||
    (m.id === "3" && m.opponent === "Carlos Alcaraz" && m.date === "2026-05-10")
  );
}
export function matchSummary(matches: Match[]) {
  const real = matches.filter((m) => !isLegacyDemo(m));
  const serves = real.filter((m) => m.firstServe != null);
  const wins = real.filter((m) => m.result === "win").length;
  return {
    total: real.length,
    wins,
    losses: real.length - wins,
    winRate: real.length ? Math.round((wins / real.length) * 100) : null,
    avgServe: serves.length
      ? Math.round(
          serves.reduce((s, m) => s + m.firstServe!, 0) / serves.length,
        )
      : null,
    serveCount: serves.length,
  };
}
export function downloadJson(name: string, value: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const drills = [
  {
    id: "serve",
    title: "Serve with a destination",
    category: "Serve",
    mode: "Solo",
    minutes: 15,
    target: "Record targets hit out of 30 serves",
    detail:
      "Set out targets in the T, body and wide zones. Hit 5 serves to each zone from each side. Count a hit only when the serve lands in the intended zone.",
    cue: "Choose the target before your routine. Keep the same rhythm for every serve.",
    equipment: "Racket, balls, 3 cones or towels",
    rounds: [
      "5 T serves from each side",
      "5 body serves from each side",
      "5 wide serves from each side",
    ],
  },
  {
    id: "depth",
    title: "Build the rally, then attack",
    category: "Consistency",
    mode: "Partner",
    minutes: 20,
    target: "Complete 5 rallies of 10 balls",
    detail:
      "Rally crosscourt with height over the net. After 10 consecutive balls, play out the point. Restart the count after an error.",
    cue: "Create depth before increasing pace. Recover before your partner makes contact.",
    equipment: "Partner, racket and balls",
    rounds: [
      "Forehand crosscourt: 7 minutes",
      "Backhand crosscourt: 7 minutes",
      "Alternate the first attacking player: 6 minutes",
    ],
  },
  {
    id: "return",
    title: "Return + one",
    category: "Return",
    mode: "Partner",
    minutes: 20,
    target: "Track 10 returns that start a neutral rally",
    detail:
      "Your partner serves at a controlled pace. Return crosscourt to a large target, recover, and play one more shot. Switch roles after 10 returns.",
    cue: "Use a short preparation and give yourself margin over the net.",
    equipment: "Partner, racket and balls",
    rounds: [
      "Deuce side: 10 returns each",
      "Ad side: 10 returns each",
      "Repeat on the side with fewer successful returns",
    ],
  },
  {
    id: "wall",
    title: "Wall rhythm",
    category: "Consistency",
    mode: "Wall",
    minutes: 15,
    target: "Record your longest controlled rally",
    detail:
      "Mark a safe target above net height on a suitable practice wall. Rally at a manageable pace, allowing a second bounce when needed. Alternate forehands and backhands.",
    cue: "Keep your spacing. Aim for a repeatable contact point, not maximum speed.",
    equipment: "Approved practice wall, racket and ball",
    rounds: [
      "Forehands: 5 minutes",
      "Backhands: 5 minutes",
      "Alternating sides: 5 minutes",
    ],
  },
  {
    id: "transition",
    title: "Short ball to first volley",
    category: "Net play",
    mode: "Partner",
    minutes: 15,
    target: "Land 7 of 10 approach shots in your target",
    detail:
      "Start behind the baseline. Your partner feeds a short ball. Approach down the line, move forward, split as they hit, and play the first volley to a large target.",
    cue: "Move through the approach and stay balanced for the volley.",
    equipment: "Partner and basket of balls",
    rounds: [
      "Forehand approaches: 10 balls",
      "Backhand approaches: 10 balls",
      "Mix both sides: 10 balls",
    ],
  },
  {
    id: "movement",
    title: "Split, move, recover",
    category: "Footwork",
    mode: "Solo",
    minutes: 10,
    target: "Complete 3 controlled rounds",
    detail:
      "Place two markers a few steps either side of the center mark. Split step, move to one marker, shadow a stroke, then recover. Alternate sides with controlled effort.",
    cue: "Stay balanced and make the last adjustment steps smaller.",
    equipment: "Open court and 2 markers",
    rounds: [
      "30 seconds movement, 30 seconds rest",
      "Repeat 4 times per round",
      "Rest between rounds as needed",
    ],
  },
];
export type PracticeSession = {
  id: string;
  drillId: string;
  date: string;
  minutes: number;
  notes: string;
};
export const lessons = [
  {
    id: "first-ball",
    title: "Give your first ball a plan",
    tag: "Serve + one",
    level: "Match patterns",
    description:
      "Connect your serve placement to the next shot instead of treating them as separate decisions.",
    cues: [
      "Pick a serve target and a large first-groundstroke target.",
      "Recover after the serve and read the return before committing.",
      "Use the open court only when the return gives you time.",
    ],
    question: "Which serve location gave you the most comfortable next ball?",
    drill: "serve",
  },
  {
    id: "rally",
    title: "Earn the change of direction",
    tag: "Baseline",
    level: "Point construction",
    description:
      "Use height and depth to build a neutral rally, then change direction when you are balanced and inside the court.",
    cues: [
      "Start with a crosscourt pattern and generous net clearance.",
      "Recognize a shorter ball before accelerating.",
      "Recover based on where your shot went.",
    ],
    question:
      "Did your errors come while building the point or trying to finish it?",
    drill: "depth",
  },
  {
    id: "return",
    title: "Make the return playable",
    tag: "Return",
    level: "First four shots",
    description:
      "A deep, controlled return can keep you in the point without requiring a winner.",
    cues: [
      "Adjust your starting position to the serve you are facing.",
      "Prepare compactly and aim at a large target.",
      "Recover quickly enough to play the next ball.",
    ],
    question: "Which return target helped you start more neutral rallies?",
    drill: "return",
  },
  {
    id: "net",
    title: "Approach with a purpose",
    tag: "Transition",
    level: "Net play",
    description:
      "Treat the approach and first volley as one pattern. The approach should help you reach a balanced volley position.",
    cues: [
      "Recognize the short ball early.",
      "Use a target that limits the passing angles.",
      "Split as your opponent strikes and react to their contact.",
    ],
    question: "Were you balanced when your opponent hit the passing shot?",
    drill: "transition",
  },
];
