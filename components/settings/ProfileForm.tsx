"use client";

import * as React from "react";
import Image from "next/image";
import { Loader2, Save, UserRound } from "lucide-react";
import { updateProfileAction } from "@/app/actions/onboarding";
import { FileUploader, type UploadedFile } from "@/components/ui/file-uploader";
import { STORAGE_BUCKETS } from "@/lib/storage/paths";

const inputClass =
  "rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400";
const labelClass = "grid gap-2 text-sm font-medium text-slate-300";

export function ProfileForm({
  profile,
  publicBaseUrl,
}: {
  profile: { first_name: string | null; last_name: string | null; avatar_url: string | null };
  /** Public object base for the profile-images bucket, used to render the avatar. */
  publicBaseUrl: string;
}) {
  const [avatar, setAvatar] = React.useState<UploadedFile[]>([]);
  const [avatarUrl, setAvatarUrl] = React.useState(profile.avatar_url || "");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function pickAvatar(files: UploadedFile[]) {
    setAvatar(files);
    if (files[0]) setAvatarUrl(`${publicBaseUrl}/${files[0].path}`);
  }

  function submit(formData: FormData) {
    if (avatarUrl) formData.set("avatarUrl", avatarUrl);

    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await updateProfileAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setMessage("Profile updated.");
    });
  }

  return (
    <form
      action={submit}
      className="grid max-w-2xl gap-5 rounded-[24px] border border-white/10 bg-slate-950/60 p-6 backdrop-blur-2xl"
    >
      <h2 className="flex items-center gap-2 font-outfit text-lg font-semibold text-white">
        <UserRound size={18} className="text-blue-300" /> Profile
      </h2>

      <div className="flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-white/15 bg-slate-900">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Profile photo" width={64} height={64} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-500">
              <UserRound size={24} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <FileUploader
            bucket={STORAGE_BUCKETS.PROFILE_IMAGES}
            scope="avatars"
            accept="image/*"
            maxSizeMb={5}
            value={avatar}
            onChange={pickAvatar}
            disabled={pending}
            label="Change photo"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          First name
          <input name="firstName" defaultValue={profile.first_name || ""} className={inputClass} />
        </label>
        <label className={labelClass}>
          Last name
          <input name="lastName" defaultValue={profile.last_name || ""} className={inputClass} />
        </label>
      </div>

      {(message || error) && (
        <div
          className={
            error
              ? "rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              : "rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
          }
        >
          {error || message}
        </div>
      )}

      <button
        disabled={pending}
        className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
      >
        {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Save profile
      </button>
    </form>
  );
}
