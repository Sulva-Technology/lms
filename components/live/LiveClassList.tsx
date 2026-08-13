"use client";

import { LiveSession } from "@/types/live-class";
import { LiveClassCard } from "./LiveClassCard";

interface Props {
  role: 'student' | 'lecturer';
  sessions: LiveSession[];
}

export function LiveClassList({ role, sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="glass-panel p-10 rounded-2xl flex flex-col items-center justify-center text-center border border-white/5 border-dashed">
        <p className="text-slate-400">No scheduled sessions found.</p>
      </div>
    );
  }

  const liveSessions = sessions.filter(s => s.status === 'live');
  const scheduledSessions = sessions.filter(s => s.status === 'scheduled');
  const pastSessions = sessions.filter(s => s.status === 'completed');

  return (
    <div className="space-y-12">
      {liveSessions.length > 0 && (
        <section>
          <h2 className="font-outfit text-2xl font-semibold mb-6 flex items-center gap-3">
            <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
            Live Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveSessions.map(session => (
              <LiveClassCard key={session.id} session={session} role={role} />
            ))}
          </div>
        </section>
      )}

      {scheduledSessions.length > 0 && (
        <section>
          <h2 className="font-outfit text-xl font-semibold mb-6 text-slate-200">Upcoming Sessions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scheduledSessions.map(session => (
              <LiveClassCard key={session.id} session={session} role={role} />
            ))}
          </div>
        </section>
      )}

      {pastSessions.length > 0 && (
        <section>
          <h2 className="font-outfit text-xl font-semibold mb-6 text-slate-400">Past Sessions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75 grayscale-[20%] hover:opacity-100 hover:grayscale-0 transition-all duration-500">
            {pastSessions.map(session => (
              <LiveClassCard key={session.id} session={session} role={role} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
