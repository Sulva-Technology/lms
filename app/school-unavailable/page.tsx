export default function SchoolUnavailablePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="max-w-md rounded-[28px] border border-white/10 bg-slate-900/60 p-10 text-center shadow-2xl backdrop-blur-2xl">
        <h1 className="text-2xl font-semibold text-white">This school is unavailable</h1>
        <p className="mt-3 text-sm text-slate-400">
          Access has been paused for this institution. Your school administrator can restore it
          by contacting platform support.
        </p>
      </div>
    </main>
  );
}
