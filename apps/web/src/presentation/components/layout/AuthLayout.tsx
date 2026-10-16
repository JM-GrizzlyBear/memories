import type { ReactNode } from "react";
import { Link } from "react-router";
import { MemoryPrints } from "../landing/MemoryPrints";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 p-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl md:grid-cols-2">
        {/* Left: the same prints as the landing page (hidden on small screens) */}
        <section className="hidden min-h-160 flex-col justify-between gap-10 bg-ink p-12 text-paper md:flex">
          <div>
            <Link to="/" className="font-serif text-4xl tracking-tight">
              Memories
            </Link>
            <p className="mt-4 max-w-sm text-neutral-300">
              Every photo keeps the story behind it, so you always remember why
              it mattered.
            </p>
          </div>
          <div className="flex justify-center">
            <MemoryPrints dark />
          </div>
        </section>

        {/* Right: the form */}
        <section className="p-8 sm:p-12">
          {/* Phones: the way back to the landing page */}
          <Link
            to="/"
            className="mb-8 inline-block font-serif text-2xl tracking-tight md:hidden"
          >
            Memories
          </Link>
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
