import type { CSSProperties } from "react";
import { Toaster } from "sonner";

// Toasts: the short messages that slide in after an action ("Memory kept").
// Desktop: top right, under the header. Phones (under 600px): full width at the top.
export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      offset={{ top: 80, right: 24 }}
      mobileOffset={{ top: 76, left: 12, right: 12 }}
      visibleToasts={3}
      closeButton
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: "font-sans! rounded-md! shadow-lg! gap-3!",
          title: "text-sm! font-medium!",
          description: "text-neutral-600!",
          icon: "text-ink!",
          actionButton: "bg-neutral-900! text-white! rounded-full! px-3!",
        },
      }}
      // Paper-and-ink colours instead of sonner's defaults
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-border": "#141414",
          "--normal-text": "#141414",
        } as CSSProperties
      }
    />
  );
}
