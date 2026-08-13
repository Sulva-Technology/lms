import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <section className="w-full max-w-lg rounded-[28px] border border-white/10 bg-slate-900/70 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur-2xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-500/10 text-rose-300">
          <ShieldAlert size={30} />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Access blocked</p>
        <h1 className="mt-3 font-outfit text-3xl font-semibold text-white">You do not have access to this workspace.</h1>
        <p className="mt-4 text-sm leading-6 text-slate-400">
          Your account is signed in, but this page belongs to another role or university tenant.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/login" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">
            Switch account
          </Link>
          <Link href="/" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
