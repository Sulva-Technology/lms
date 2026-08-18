export default function SchoolNotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="max-w-md rounded-[28px] border border-white/10 bg-slate-900/60 p-10 text-center shadow-2xl backdrop-blur-2xl">
        <h1 className="text-2xl font-semibold text-white">School not found</h1>
        <p className="mt-3 text-sm text-slate-400">
          No school is registered at this web address. Check the link with your institution,
          then try again.
        </p>
      </div>
    </main>
  );
}
