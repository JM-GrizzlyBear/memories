import { useState } from "react";
import { Link } from "react-router";
import { MemoryPrints } from "../components/landing/MemoryPrints";
import { Photo } from "../components/landing/Photo";
import { PHOTOS } from "../components/landing/photos";

const VISIBILITY = [
  {
    id: "public",
    label: "Everyone",
    hint: "Anyone on Memories",
    explain: "Everyone on Memories can see it, like it and comment on it.",
  },
  {
    id: "friends",
    label: "Friends",
    hint: "Only your friends",
    explain:
      "Only the friends you've accepted see it. Unfriend someone and it's gone for them too.",
  },
  {
    id: "private",
    label: "Only me",
    hint: "A private keepsake",
    explain:
      "Nobody else ever sees it. It still shows in your journal and your album.",
  },
] as const;

const STEPS = [
  {
    title: "Add the photos",
    text: "Up to ten from the same moment. The first one becomes the cover.",
  },
  {
    title: "Write why it mattered",
    text: "A title, the date it happened, the place, and the story only you can tell.",
  },
  {
    title: "Choose who sees it",
    text: "Everyone, your friends, or only you. You can change it later.",
  },
];

const primaryButton =
  "flex h-13 items-center justify-center rounded-full bg-ink px-7 text-base font-medium text-paper transition hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const secondaryButton =
  "flex h-13 items-center justify-center rounded-full border border-ink px-7 text-base font-medium transition hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const sectionTitle =
  "font-serif text-4xl leading-tight tracking-tight sm:text-5xl";

// What logged-out visitors see at "/": what Memories is, and the way in
export function LandingPage() {
  const [visibility, setVisibility] =
    useState<(typeof VISIBILITY)[number]["id"]>("friends");
  const chosen = VISIBILITY.find((option) => option.id === visibility);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="font-serif text-2xl font-medium tracking-tight sm:text-[28px]"
          >
            Memories
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
            <a
              href="#how"
              className="hidden h-11 items-center rounded-full px-3.5 text-[15px] text-neutral-600 hover:text-ink md:flex"
            >
              How it works
            </a>
            <a
              href="#features"
              className="hidden h-11 items-center rounded-full px-3.5 text-[15px] text-neutral-600 hover:text-ink md:flex"
            >
              Features
            </a>
            <a
              href="#privacy"
              className="hidden h-11 items-center rounded-full px-3.5 text-[15px] text-neutral-600 hover:text-ink md:flex"
            >
              Privacy
            </a>
            <Link
              to="/login"
              className="flex h-11 items-center rounded-full border border-ink px-4.5 text-[15px] font-medium transition hover:bg-neutral-100"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="hidden h-11 items-center rounded-full bg-ink px-5 text-[15px] font-medium text-paper transition hover:bg-neutral-800 sm:flex"
            >
              Create an account
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section
          aria-labelledby="hero-title"
          className="mx-auto flex max-w-6xl flex-wrap items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:gap-16 lg:pb-24 lg:pt-22"
        >
          <div className="min-w-0 flex-[1_1_460px]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-600 sm:text-[13px]">
              A social photo journal
            </p>
            <h1
              id="hero-title"
              className="mt-4 font-serif text-5xl leading-none tracking-tight sm:mt-5 sm:text-7xl lg:text-[84px]"
            >
              Every photo keeps the story behind it.
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-neutral-600 sm:text-[19px]">
              Keep a memory: a few photos, the day it happened, and why it
              mattered. Share it with everyone, only your friends, or just
              yourself, and look back on it years from now.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link to="/register" className={primaryButton}>
                Start your journal, it's free
              </Link>
              <Link to="/login" className={secondaryButton}>
                I already have an account
              </Link>
            </div>
          </div>

          <div className="flex min-w-0 flex-[1_1_420px] justify-center">
            <MemoryPrints />
          </div>
        </section>

        {/* How it works */}
        <section
          id="how"
          aria-labelledby="how-title"
          className="scroll-mt-4 border-t border-line bg-white"
        >
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-22">
            <h2 id="how-title" className={sectionTitle}>
              Three steps, then it's yours to keep.
            </h2>
            <ol className="mt-8 grid gap-7 sm:mt-12 md:grid-cols-3 md:gap-8">
              {STEPS.map((step, index) => (
                <li key={step.title} className="border-t border-ink pt-5">
                  <p
                    aria-hidden="true"
                    className="font-serif text-4xl leading-none sm:text-[44px]"
                  >
                    {index + 1}
                  </p>
                  <h3 className="mt-4 text-lg font-semibold sm:text-xl">
                    {step.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-neutral-600">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          aria-labelledby="features-title"
          className="scroll-mt-4 border-t border-line"
        >
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-22">
            <h2 id="features-title" className={`${sectionTitle} max-w-3xl`}>
              Made for looking back, together.
            </h2>
            <div className="mt-8 grid gap-4 sm:mt-12 md:grid-cols-3 md:gap-6">
              <article className="rounded-xl border border-line bg-white p-6 sm:p-7">
                <div aria-hidden="true" className="flex h-36 gap-2.5">
                  <div className="flex flex-1 items-end rounded-l-md bg-ink p-3.5 font-serif text-lg text-paper">
                    An album
                  </div>
                  <div className="flex flex-1 flex-col justify-between gap-2.5 rounded-r-md border border-line bg-[#f2f1ec] p-3.5">
                    <Photo
                      src={PHOTOS.friends}
                      className="h-16 rounded-sm bg-[#cbc8c1]"
                    />
                    <span className="font-serif text-[34px] leading-none">
                      2024
                    </span>
                  </div>
                </div>
                <h3 className="mt-6 text-lg font-semibold sm:text-xl">
                  Your album, year by year
                </h3>
                <p className="mt-2 leading-relaxed text-neutral-600">
                  Your memories become a book you flip through, one page per
                  year, with a line you write about each one.
                </p>
              </article>

              <article className="rounded-xl border border-line bg-white p-6 sm:p-7">
                <div
                  aria-hidden="true"
                  className="flex h-36 flex-col justify-end gap-2"
                >
                  <p className="max-w-[80%] self-start rounded-2xl border border-line px-3.5 py-2.5 text-[15px]">
                    Who's in for Saturday?
                  </p>
                  <p className="max-w-[80%] self-end rounded-2xl bg-ink px-3.5 py-2.5 text-[15px] text-paper">
                    Me! I'll bring the camera
                  </p>
                  <p className="self-end text-xs text-neutral-500">Seen</p>
                </div>
                <h3 className="mt-6 text-lg font-semibold sm:text-xl">
                  Chats and groups
                </h3>
                <p className="mt-2 leading-relaxed text-neutral-600">
                  Message friends live, start a group, share photos. People who
                  aren't your friends ask first.
                </p>
              </article>

              <article className="rounded-xl border border-line bg-white p-6 sm:p-7">
                <div
                  aria-hidden="true"
                  className="flex h-36 flex-col justify-end gap-2.5"
                >
                  <p className="flex items-center gap-2.5 rounded-lg border border-line px-3.5 py-3 text-[15px]">
                    <span className="h-7 w-7 shrink-0 rounded-full bg-[#cbc8c1]" />
                    Ben liked your memory
                  </p>
                  <p className="flex items-center gap-2.5 rounded-lg border border-line px-3.5 py-3 text-[15px]">
                    <span className="h-7 w-7 shrink-0 rounded-full bg-[#d9d7d1]" />
                    Cara sent you a friend request
                  </p>
                </div>
                <h3 className="mt-6 text-lg font-semibold sm:text-xl">
                  Friends, likes and comments
                </h3>
                <p className="mt-2 leading-relaxed text-neutral-600">
                  Add friends, like and comment on what they keep, and get
                  notified the moment it happens.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section
          id="privacy"
          aria-labelledby="privacy-title"
          className="scroll-mt-4 bg-ink text-paper"
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-start gap-10 px-4 py-14 sm:px-6 lg:gap-14 lg:py-22">
            <div className="min-w-0 flex-[1_1_380px]">
              <h2 id="privacy-title" className={sectionTitle}>
                You decide who sees every memory.
              </h2>
              <p className="mt-5 text-[17px] leading-relaxed text-neutral-300">
                Pick one when you keep it. Try it:
              </p>
            </div>
            <div className="min-w-0 flex-[1_1_480px]">
              <div
                role="group"
                aria-label="Who can see it?"
                className="grid gap-2.5 sm:grid-cols-3"
              >
                {VISIBILITY.map((option) => {
                  const isOn = option.id === visibility;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={isOn}
                      onClick={() => setVisibility(option.id)}
                      className={`min-h-18 rounded-xl border px-4 py-3.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper ${
                        isOn
                          ? "border-paper bg-paper text-ink"
                          : "border-neutral-600 text-paper hover:border-neutral-400"
                      }`}
                    >
                      <span className="block font-semibold">
                        {option.label}
                      </span>
                      <span
                        className={`mt-1 block text-sm ${isOn ? "text-neutral-600" : "text-neutral-300"}`}
                      >
                        {option.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p
                aria-live="polite"
                className="mt-7 border-t border-neutral-600 pt-5 font-serif text-2xl leading-snug sm:text-[26px]"
              >
                {chosen?.explain}
              </p>
            </div>
          </div>
        </section>

        {/* Last call */}
        <section aria-labelledby="cta-title" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:py-26">
            <h2
              id="cta-title"
              className="mx-auto max-w-3xl font-serif text-[40px] leading-[1.05] tracking-tight sm:text-6xl"
            >
              The little things are worth keeping.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-neutral-600">
              Free to use. Your first memory takes about a minute.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/register" className={primaryButton}>
                Create an account
              </Link>
              <Link to="/login" className={secondaryButton}>
                Log in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-3 px-4 py-7 text-sm text-neutral-600 sm:px-6">
          <span className="font-serif text-xl text-ink">Memories</span>
          <span>
            A portfolio project. Made with React, Express and Postgres.
          </span>
        </div>
      </footer>
    </div>
  );
}
