import { env } from "@/lib/env";
import { LiveClassProvider } from "./provider";

type DailyRoomResponse = {
  name: string;
  url: string;
  id?: string;
};

type DailyRecordingAccessLinkResponse = {
  download_link: string;
  expires: number;
};

export class DailyLiveClassProvider implements LiveClassProvider {
  private apiUrl = process.env.DAILY_API_URL || "https://api.daily.co/v1";

  private get headers() {
    if (!env.DAILY_API_KEY) {
      throw new Error("DAILY_API_KEY is required for live classes.");
    }

    return {
      Authorization: `Bearer ${env.DAILY_API_KEY}`,
      "Content-Type": "application/json",
    };
  }

  async createSession(params: {
    topic: string;
    startTime: string;
    durationMinutes: number;
    hostEmail?: string;
    isRecordingEnabled?: boolean;
    isWaitingRoomEnabled?: boolean;
  }) {
    const start = Math.floor(new Date(params.startTime).getTime() / 1000);
    const exp = start + params.durationMinutes * 60 + 60 * 60;
    const res = await fetch(`${this.apiUrl}/rooms`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        privacy: "private",
        properties: {
          nbf: Math.max(0, start - 15 * 60),
          exp,
          enable_recording: params.isRecordingEnabled ? "cloud" : "off",
          enable_prejoin_ui: true,
          enable_people_ui: true,
          enable_chat: true,
          eject_at_room_exp: true,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Daily room creation failed: ${await res.text()}`);
    }

    const room = (await res.json()) as DailyRoomResponse;
    return {
      sessionId: room.name,
      hostUrl: room.url,
      joinUrl: room.url,
      providerMetadata: { roomId: room.id, roomName: room.name, roomUrl: room.url },
    };
  }

  async updateSession(sessionId: string, params: any) {
    const res = await fetch(`${this.apiUrl}/rooms/${sessionId}`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Daily room update failed: ${await res.text()}`);
  }

  async cancelSession(sessionId: string) {
    const res = await fetch(`${this.apiUrl}/rooms/${sessionId}`, {
      method: "DELETE",
      headers: this.headers,
    });
    if (!res.ok && res.status !== 404) throw new Error(`Daily room cancellation failed: ${await res.text()}`);
  }

  async generateJoinToken(sessionId: string, participantId: string, role: "host" | "guest") {
    const res = await fetch(`${this.apiUrl}/meeting-tokens`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        properties: {
          room_name: sessionId,
          user_id: participantId,
          is_owner: role === "host",
          enable_recording: role === "host" ? "cloud" : undefined,
        },
      }),
    });

    if (!res.ok) throw new Error(`Daily token generation failed: ${await res.text()}`);
    const data = (await res.json()) as { token: string };
    return data.token;
  }

  async getRecordingAccessLink(recordingId: string, validForSeconds = 43200) {
    const res = await fetch(
      `${this.apiUrl}/recordings/${recordingId}/access-link?valid_for_secs=${validForSeconds}`,
      {
        method: "GET",
        headers: this.headers,
      },
    );

    if (!res.ok) throw new Error(`Daily recording link failed: ${await res.text()}`);
    const data = (await res.json()) as DailyRecordingAccessLinkResponse;
    return data.download_link;
  }
}
