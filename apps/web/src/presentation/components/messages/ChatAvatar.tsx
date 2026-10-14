import { Users } from "lucide-react";
import type { Conversation } from "../../../domain/conversation";
import type { UserSummary } from "../../../domain/friendship";
import { otherMember } from "../../format/chatText";
import { thumbnailUrl } from "../../format/photoUrl";
import { Avatar } from "../user/Avatar";

const BOX = { sm: "h-9 w-9", md: "h-12 w-12", lg: "h-20 w-20" } as const;

interface ChatAvatarProps {
  conversation: Conversation;
  myId: string;
  size?: keyof typeof BOX;
}

// Direct chat: the other person. Group: its photo, or two of its people overlapping.
export function ChatAvatar({
  conversation,
  myId,
  size = "md",
}: ChatAvatarProps) {
  if (conversation.kind === "direct") {
    const other = otherMember(conversation, myId);
    if (!other)
      return (
        <span className={`${BOX[size]} shrink-0 rounded-full bg-neutral-300`} />
      );
    return (
      <Avatar
        user={other}
        size={size === "lg" ? "lg" : size === "md" ? "md" : "sm"}
      />
    );
  }

  if (conversation.photoUrl) {
    return (
      <img
        src={thumbnailUrl(conversation.photoUrl, 160, 160)}
        alt=""
        className={`${BOX[size]} shrink-0 rounded-full object-cover`}
      />
    );
  }

  const [first, second] = conversation.members.filter(
    (member) => member.id !== myId,
  );
  if (!first || !second) {
    return (
      <span
        aria-hidden="true"
        className={`${BOX[size]} flex shrink-0 items-center justify-center rounded-full bg-neutral-300`}
      >
        <Users size={size === "lg" ? 28 : 18} />
      </span>
    );
  }

  // Two faces, one tucked behind the other
  return (
    <span
      aria-hidden="true"
      className={`${BOX[size]} relative inline-block shrink-0`}
    >
      <Face user={second} className="absolute left-0 top-0" size={size} />
      <Face
        user={first}
        className="absolute bottom-0 right-0 ring-2 ring-paper"
        size={size}
      />
    </span>
  );
}

const FACE = {
  sm: "h-6 w-6 text-[9px]",
  md: "h-8 w-8 text-[11px]",
  lg: "h-14 w-14 text-lg",
} as const;

// A small round photo (or initials) for the two-face group picture
function Face({
  user,
  size,
  className,
}: {
  user: UserSummary;
  size: keyof typeof FACE;
  className: string;
}) {
  if (user.profilePhotoUrl) {
    return (
      <img
        src={thumbnailUrl(user.profilePhotoUrl, 96, 96)}
        alt=""
        className={`${FACE[size]} ${className} rounded-full object-cover`}
      />
    );
  }
  return (
    <span
      className={`${FACE[size]} ${className} flex items-center justify-center rounded-full bg-neutral-300 font-semibold`}
    >
      {`${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()}
    </span>
  );
}
