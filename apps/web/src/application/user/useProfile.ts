import { useCallback, useEffect, useState } from "react";
import type { Profile } from "../../domain/friendship";
import { ApiError } from "../../infrastructure/api/http";
import { getProfile } from "../../infrastructure/api/userApi";

type Status = "loading" | "ready" | "not-found" | "error";

interface Loaded {
  key: string; // which username + attempt this answer belongs to
  profile: Profile | null;
  status: Exclude<Status, "loading">;
}

export function useProfile(username: string) {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const key = `${username}#${attempt}`;

  useEffect(() => {
    let cancelled = false;

    getProfile(username)
      .then((profile) => {
        if (!cancelled) setLoaded({ key, profile, status: "ready" });
      })
      .catch((error) => {
        if (cancelled) return;
        setLoaded({
          key,
          profile: null,
          status:
            error instanceof ApiError && error.status === 404
              ? "not-found"
              : "error",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [username, key]);

  // An answer for another username (or an older attempt) means we're still loading
  const isCurrent = loaded?.key === key;
  const status: Status = isCurrent ? loaded.status : "loading";
  const profile = isCurrent ? loaded.profile : null;

  // Update the shown profile, e.g. after becoming friends
  const setProfile = useCallback(
    (update: (current: Profile | null) => Profile | null) => {
      setLoaded((current) =>
        current ? { ...current, profile: update(current.profile) } : current,
      );
    },
    [],
  );

  return {
    profile,
    status,
    setProfile,
    retry: () => setAttempt((current) => current + 1),
  };
}
