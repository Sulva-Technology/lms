"use client";

import { useState } from "react";
import { Loader2, Video } from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button";

type Props = {
  sessionId: string;
  roomUrl: string | null;
  role: "host" | "guest";
  topic: string;
};

// Rooms are created private, so Daily refuses the bare room URL. A meeting
// token has to be minted per participant, which is also what records the
// participant row used for live-class attendance.
export function LiveClassRoom({ sessionId, roomUrl, role, topic }: Props) {
  const [embedUrl, setEmbedUrl] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function join() {
    if (!roomUrl) {
      setError("This live class has no room URL. Reschedule it to create one.");
      return;
    }

    setError("");
    setPending(true);

    try {
      const response = await fetch(`/api/live-classes/${sessionId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error || "Could not join this live class.");
        return;
      }

      const url = new URL(roomUrl);
      url.searchParams.set("t", payload.data.token);
      setEmbedUrl(url.toString());
    } catch {
      setError("Could not reach the live class service.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="aspect-video rounded-[32px] border border-line bg-surface p-6 shadow-2xl">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={topic}
            className="h-full w-full rounded-[24px] border-0 bg-surface"
            allow="camera; microphone; fullscreen; display-capture; autoplay"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-[24px] bg-surface text-center">
            <Video className="h-10 w-10 text-ink-subtle" aria-hidden />
            <p className="max-w-sm text-sm text-ink-muted">
              {role === "host"
                ? "Start the room when you are ready. Students can only enter once they join from their own dashboard."
                : "Join to enter the live class. Your camera and microphone stay off until you allow them."}
            </p>
            <GlassButton variant="solid" onClick={join} disabled={pending}>
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
              {role === "host" ? "Start live class" : "Join live class"}
            </GlassButton>
          </div>
        )}
      </div>
      {error ? (
        <p role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}
