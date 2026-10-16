import type { UserSummary } from "../../../domain/friendship";

const SIZES = {
  xs: "h-4 w-4 text-[7px]",
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-20 w-20 text-2xl sm:h-24 sm:w-24 sm:text-3xl",
  xl: "h-28 w-28 text-4xl",
} as const;

interface AvatarProps {
  user: Pick<UserSummary, "firstName" | "lastName" | "profilePhotoUrl">;
  size?: keyof typeof SIZES;
}

// A profile photo, or the person's initials when they haven't added one.
// Decorative: the name is always written next to it.
export function Avatar({ user, size = "sm" }: AvatarProps) {
  const initials =
    `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  if (user.profilePhotoUrl) {
    return (
      <img
        src={user.profilePhotoUrl}
        alt=""
        className={`${SIZES[size]} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${SIZES[size]} flex shrink-0 items-center justify-center rounded-full bg-neutral-300 font-semibold ${size === "lg" || size === "xl" ? "font-serif font-normal" : ""}`}
    >
      {initials}
    </span>
  );
}
