import type { MessagePrivacy } from "@memories/shared";
import { useState } from "react";
import { toast } from "sonner";
import { useUpdateMessagePrivacy } from "../../../application/account/useAccountMutations";
import { SettingsSection } from "./SettingsSection";

const OPTIONS: { value: MessagePrivacy; label: string; detail: string }[] = [
  {
    value: "friends",
    label: "Friends",
    detail: "Only your friends can message you or add you to groups.",
  },
  {
    value: "anyone",
    label: "Anyone",
    detail:
      "People who aren't your friends can message you too. Their first message arrives as a request you can accept or decline.",
  },
];

// Settings → Privacy → "Who can message me?"
export function PrivacySection({ current }: { current: MessagePrivacy }) {
  const update = useUpdateMessagePrivacy();
  // The new choice shows right away while it saves (and goes back if it fails)
  const [saving, setSaving] = useState<MessagePrivacy | null>(null);
  const shown = saving ?? current;

  async function choose(value: MessagePrivacy) {
    if (value === current || update.isPending) return;
    setSaving(value);
    try {
      await update.mutateAsync(value);
      toast.success(
        value === "anyone"
          ? "Anyone can message you now"
          : "Only friends can message you now",
      );
    } catch {
      // The error toast says what went wrong
    } finally {
      setSaving(null);
    }
  }

  return (
    <SettingsSection
      id="privacy"
      title="Privacy"
      description="Choose who can reach you in Messages."
    >
      <fieldset>
        <legend className="text-sm font-medium">Who can message me?</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {OPTIONS.map((option) => {
            const isOn = option.value === shown;
            return (
              <label
                key={option.value}
                className={`flex cursor-pointer gap-3 rounded-md border p-4 transition ${
                  isOn
                    ? "border-ink bg-neutral-50"
                    : "border-line hover:border-neutral-400"
                } has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink`}
              >
                <input
                  type="radio"
                  name="message-privacy"
                  value={option.value}
                  checked={isOn}
                  disabled={update.isPending}
                  onChange={() => void choose(option.value)}
                  className="mt-1 h-4 w-4 accent-neutral-900"
                />
                <span>
                  <span className="block font-medium">{option.label}</span>
                  <span className="mt-0.5 block text-sm text-neutral-500">
                    {option.detail}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </SettingsSection>
  );
}
