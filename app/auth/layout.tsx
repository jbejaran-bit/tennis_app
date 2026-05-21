import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-baseline-dark flex flex-col">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-baseline-green/4 blur-[140px] rounded-full pointer-events-none" />

      <nav className="relative z-10 flex items-center px-6 md:px-12 py-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md baseline-gradient flex items-center justify-center">
            <span className="text-xs font-bold text-baseline-dark">B</span>
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-baseline-text-primary">
            Baseline
          </span>
        </Link>
      </nav>

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  );
}
