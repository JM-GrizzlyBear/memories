import { Globe, Lock, Users } from "lucide-react";
import type { Visibility } from "../../../domain/memory";

export const VISIBILITY = {
  public: { label: "Everyone", Icon: Globe },
  friends: { label: "Friends", Icon: Users },
  private: { label: "Only me", Icon: Lock },
} satisfies Record<Visibility, { label: string; Icon: typeof Globe }>;
