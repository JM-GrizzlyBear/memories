import { useRef, useState } from "react";
import type { Memory } from "../../domain/memory";
import { setLiked } from "../../infrastructure/api/memoryApi";

// Liking feels instant: the heart fills first, then the server confirms (or we undo it)
export function useLike(memory: Pick<Memory, "id" | "likedByMe" | "likeCount">) {
  const [likedByMe, setLikedByMe] = useState(memory.likedByMe);
  const [likeCount, setLikeCount] = useState(memory.likeCount);
  const [failed, setFailed] = useState(false);
  const latestRequest = useRef(0);

  async function toggle() {
    const liked = !likedByMe;
    const before = { likedByMe, likeCount };
    const requestNumber = ++latestRequest.current;

    setLikedByMe(liked);
    setLikeCount((count) => Math.max(0, count + (liked ? 1 : -1)));
    setFailed(false);

    try {
      const result = await setLiked(memory.id, liked);
      // Clicked again while this was on its way? The newer click wins.
      if (requestNumber !== latestRequest.current) return;
      setLikedByMe(result.likedByMe);
      setLikeCount(result.likeCount);
    } catch {
      if (requestNumber !== latestRequest.current) return;
      setLikedByMe(before.likedByMe);
      setLikeCount(before.likeCount);
      setFailed(true);
    }
  }

  return { likedByMe, likeCount, failed, toggle };
}
