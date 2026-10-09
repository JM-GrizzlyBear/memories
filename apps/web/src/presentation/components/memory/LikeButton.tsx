import { Heart } from "lucide-react";
import { useLike } from "../../../application/memory/useLike";
import type { Memory } from "../../../domain/memory";

interface LikeButtonProps {
  memory: Pick<Memory, "id" | "title" | "likedByMe" | "likeCount">;
}

export function LikeButton({ memory }: LikeButtonProps) {
  const { likedByMe, likeCount, failed, toggle } = useLike(memory);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={likedByMe}
        aria-label={`Like "${memory.title}"`}
        className="flex h-11 items-center gap-2 rounded-full px-3 text-sm transition hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-neutral-900"
      >
        <Heart
          size={20}
          aria-hidden="true"
          className={`transition ${likedByMe ? "fill-red-600 text-red-600 motion-safe:scale-110" : ""}`}
        />
        <span className="tabular-nums">
          {likeCount}
          <span className="sr-only">{likeCount === 1 ? " like" : " likes"}</span>
        </span>
      </button>
      {failed && (
        <span role="alert" className="text-xs text-red-600">
          Couldn't save your like
        </span>
      )}
    </div>
  );
}
