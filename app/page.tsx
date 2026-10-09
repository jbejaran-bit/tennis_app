import Link from "next/link";
import Icon from "@/components/Icons";
import "./dashboard/workspace.css";
export default function HomePage() {
  return (
    <div className="baseline-workspace landing">
      <nav className="landing-nav">
        <Link href="/" className="brand">
          <span className="brand-symbol">
            b<span>•</span>
          </span>
          <span>
            baseline<small>YOUR GAME, IN FOCUS</small>
          </span>
        </Link>
        <div className="button-row">
          <Link className="text-button" href="/auth/login">
            Sign in
          </Link>
          <Link className="button primary" href="/dashboard">
            Open workspace <Icon name="arrow" />
          </Link>
        </div>
      </nav>
      <main className="landing-main">
        <div className="eyebrow">BUILT FOR THE TIME BETWEEN MATCHES</div>
        <h1>
          Small details.
          <br />
          <em>A different game.</em>
        </h1>
        <p>
          Your racket setup, your match notes, your next practice.
          <br />
          One place to turn what you notice into what you work on.
        </p>
        <div className="button-row">
          <Link className="button primary" href="/dashboard#racquet-lab">
            Explore Racket Lab <Icon name="arrow" />
          </Link>
          <Link className="button" href="/dashboard">
            Open your workspace
          </Link>
        </div>
        <div className="landing-features">
          {[
            {
              icon: "racket" as const,
              title: "Find your feel",
              copy: "Model weight changes, save setups and compare your rackets. Clear estimates, with or without a known swingweight.",
            },
            {
              icon: "matches" as const,
              title: "Remember the pattern",
              copy: "Record the score and what you learned. See your own match history without filling in stats you did not track.",
            },
            {
              icon: "training" as const,
              title: "Practice with a target",
              copy: "Choose a solo, partner or wall drill. Track the session, review a clip, and carry one cue onto court.",
            },
          ].map((f) => (
            <article className="panel" key={f.title}>
              <Icon name={f.icon} />
              <h2>{f.title}</h2>
              <p>{f.copy}</p>
            </article>
          ))}
        </div>
        <p className="helper">
          Start without an account. Logs, setups and new videos are saved in
          your browser. Export backups to keep a copy.
        </p>
      </main>
      <footer className="landing-footer">
        baseline · Your game, in focus.
      </footer>
    </div>
  );
}
