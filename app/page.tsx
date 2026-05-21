import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="relative min-h-screen bg-baseline-dark overflow-hidden flex flex-col">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:48px_48px]" />
      {/* Gradient blob */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-baseline-green/5 blur-[120px] rounded-full pointer-events-none" />

      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md baseline-gradient flex items-center justify-center">
            <span className="text-xs font-bold text-baseline-dark">B</span>
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-baseline-text-primary">
            Baseline
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="text-sm text-baseline-text-secondary hover:text-baseline-text-primary transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-1.5 rounded-lg bg-baseline-green px-4 py-2 text-sm font-semibold text-baseline-dark hover:bg-baseline-green-dim transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center pt-16 pb-32">
        <div className="inline-flex items-center gap-2 rounded-full border border-baseline-border bg-baseline-dark-3 px-4 py-1.5 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-baseline-green animate-pulse-glow" />
          <span className="text-xs text-baseline-text-secondary font-mono">
            AI-powered tennis performance tracking
          </span>
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-baseline-text-primary leading-[1.05] mb-6 max-w-3xl">
          Your coach
          <br />
          <span className="text-baseline-green">knows every match.</span>
        </h1>

        <p className="text-lg text-baseline-text-secondary max-w-xl mb-10 leading-relaxed">
          Baseline tracks every match you play and builds a longitudinal dataset
          of your performance. The more you log, the smarter your AI coach
          becomes.
        </p>

        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 rounded-lg bg-baseline-green px-6 py-3 text-base font-semibold text-baseline-dark hover:bg-baseline-green-dim transition-all hover:shadow-[0_0_24px_rgba(200,241,94,0.3)]"
          >
            Start tracking free
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 rounded-lg border border-baseline-border bg-baseline-dark-3 px-6 py-3 text-base font-semibold text-baseline-text-secondary hover:text-baseline-text-primary hover:border-baseline-border/60 transition-colors"
          >
            Sign in
          </Link>
        </div>

        {/* Feature pills */}
        <div className="mt-20 flex flex-wrap gap-3 justify-center max-w-2xl">
          {[
            "AI post-match debrief",
            "Pattern recognition",
            "Surface analytics",
            "Serve % trends",
            "UTR tracking",
            "Momentum scoring",
          ].map((f) => (
            <span
              key={f}
              className="rounded-full border border-baseline-border bg-baseline-dark-3 px-3 py-1.5 text-xs text-baseline-text-secondary font-mono"
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-baseline-dark to-transparent pointer-events-none" />
    </main>
  );
}
