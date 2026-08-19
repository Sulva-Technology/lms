"use client";

import * as React from "react";
import Image from "next/image";
import { Loader2, Save, UserRound } from "lucide-react";
import { updateProfileAction } from "@/app/actions/onboarding";
import { FileUploader, type UploadedFile } from "@/components/ui/file-uploader";
import { STORAGE_BUCKETS } from "@/lib/storage/paths";

const inputClass =
  "rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-primary";
const labelClass = "grid gap-2 text-sm font-medium text-ink-muted";

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
      className="grid max-w-2xl gap-5 rounded-[24px] border border-line bg-surface p-6 backdrop-blur-2xl"
    >
      <h2 className="flex items-center gap-2 font-outfit text-lg font-semibold text-ink">
        <UserRound size={18} className="text-primary" /> Profile
      </h2>

      <div className="flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-line bg-surface">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Profile photo" width={64} height={64} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink-subtle">
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
        className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-contrast hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Save profile
      </button>
    </form>
  );
}
