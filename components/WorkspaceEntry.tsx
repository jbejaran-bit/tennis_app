import Link from "next/link";
export default function WorkspaceEntry() {
  return <section className="w-full max-w-md rounded-2xl border border-neutral-700 bg-neutral-900 p-8 text-white">
    <p className="mb-4 text-xs uppercase tracking-widest text-lime-300">Baseline / Your tennis workspace</p>
    <h1 className="mb-4 text-3xl font-semibold">Welcome to Baseline.</h1>
    <p className="mb-6 text-sm leading-7 text-neutral-300">Keep track of your rackets, plan a practice, or jot down a few notes after a match.</p>
    <Link href="/dashboard" className="inline-flex min-h-12 items-center rounded-lg bg-lime-300 px-6 py-3 font-semibold text-neutral-950">Open Baseline →</Link>
    <p className="mt-6 text-xs leading-6 text-neutral-400">Your tennis records are saved in this browser. Export a backup from the workspace to move them to another device.</p>
  </section>;
}
