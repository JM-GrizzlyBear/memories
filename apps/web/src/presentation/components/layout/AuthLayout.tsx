import type { ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 p-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl md:grid-cols-2">
        {/* Left: photo panel (hidden on small screens) */}
        <section className="relative hidden min-h-160 md:block">
          {/* TODO: replace this placeholder with the final illustration */}
          <img
            src="https://static.wikia.nocookie.net/webarebears/images/7/7a/GRIZZLY_GOD.png/revision/latest?cb=20200722140123"
            alt=""
            className="absolute inset-0 h-full w-full object-cover grayscale"
          />
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative flex h-full flex-col justify-center p-12 text-white">
            <h2 className="text-4xl font-bold tracking-tight">Memories</h2>
            <p className="mt-4 max-w-sm text-neutral-200">
              Every photo keeps the story behind it, so you always remember why
              it mattered.
            </p>
          </div>
        </section>

        {/* Right: the form */}
        <section className="p-8 sm:p-12">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
            {title}
          </h1>
          <p className="mt-2 text-sm text-neutral-600">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
