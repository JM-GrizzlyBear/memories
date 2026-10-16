import type { ReactNode } from "react";

interface SettingsSectionProps {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}

// One white card on the Settings page, with its own heading
export function SettingsSection({
  id,
  title,
  description,
  children,
}: SettingsSectionProps) {
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="rounded-md border border-line bg-white p-5 sm:p-8"
    >
      <h2 id={headingId} className="font-serif text-2xl tracking-tight">
        {title}
      </h2>
      <p className="mt-1 text-sm text-neutral-500">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}
