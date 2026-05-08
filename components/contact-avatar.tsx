import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Distinct, saturated background tones with white text — easy to scan in a
// dense inbox without leaning on a real photo. Order is chosen for visual
// variety on adjacent rows.
const PALETTE = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-lime-600",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-violet-500",
  "bg-fuchsia-500",
  "bg-pink-500",
] as const;

function getInitials(name: string | null | undefined, fallback = "?") {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const [first, ...rest] = parts;
  if (!first) return fallback;
  if (rest.length === 0) {
    return first.slice(0, 2).toUpperCase();
  }
  const last = rest[rest.length - 1] ?? "";
  return ((first[0] ?? "") + (last[0] ?? "")).toUpperCase();
}

function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index] ?? PALETTE[0];
}

export function ContactAvatar({
  id,
  name,
  size = "default",
  className,
}: {
  id: string;
  name: string | null | undefined;
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  return (
    <Avatar size={size} className={className}>
      <AvatarFallback className={cn(colorFor(id), "font-medium text-white")}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
