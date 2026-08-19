"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { gradientFor, initialsFor } from "@/lib/ui/identity";

/**
 * Renders an uploaded avatar, or a deterministic initials tile when the user
 * has not set one. No external avatar service is involved.
 */
export function Avatar({
  name,
  src,
  size = 32,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("shrink-0 overflow-hidden rounded-full border border-line-strong", className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt={name} width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center font-semibold text-ink"
          style={{ background: gradientFor(name), fontSize: Math.max(10, Math.round(size * 0.38)) }}
          aria-label={name}
        >
          {initialsFor(name)}
        </div>
      )}
    </div>
  );
}
