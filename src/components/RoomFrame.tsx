import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { DICE, type DieConfig } from "@/data/dice";
import type { RollOutcome } from "@/utils/rolls";
import { ResultRelic } from "@/components/ResultRelic";

type RoomFrameProps = {
  die: DieConfig;
  hint: string;
  outcome: RollOutcome | null;
  children: ReactNode;
  aside?: ReactNode;
  atmosphere?: ReactNode;
};

export function RoomFrame({ die, hint, outcome, children, aside, atmosphere }: RoomFrameProps) {
  return (
    <motion.main
      animate={{ opacity: 1, y: 0 }}
      className="relative isolate min-h-screen overflow-hidden bg-[#050609] text-stone-100"
      initial={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,214,138,0.08),transparent_24rem),linear-gradient(180deg,#090b10_0%,#040507_55%,#020304_100%)]" />
      {atmosphere}

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
        <header className="mb-6 space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3 text-[0.7rem] uppercase tracking-[0.32em] text-stone-300/70">
                <Link
                  className="rounded-full border border-white/12 bg-white/4 px-3 py-1.5 transition hover:border-white/25 hover:bg-white/8"
                  to="/"
                >
                  Back to foyer
                </Link>
                <span className={`rounded-full border bg-white/5 px-3 py-1.5 ${die.accent.border} ${die.accent.ink}`}>
                  {die.kicker}
                </span>
              </div>
              <h1 className="mt-4 text-4xl leading-tight text-stone-50 sm:text-5xl">{die.roomTitle}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-300/84 sm:text-base">
                {die.roomBlurb}
              </p>
            </div>

            <nav className="flex max-w-xl flex-wrap gap-2">
              {DICE.map((entry) => (
                <NavLink
                  key={entry.id}
                  className={({ isActive }) =>
                    `rounded-full border px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.28em] transition ${
                      isActive
                        ? `${entry.accent.border} bg-white/10 ${entry.accent.ink}`
                        : "border-white/10 bg-white/4 text-stone-300/76 hover:border-white/20 hover:bg-white/8"
                    }`
                  }
                  to={entry.path}
                >
                  {entry.id}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <div className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section className={`room-panel relative overflow-hidden rounded-[2rem] p-4 sm:p-5 lg:p-6 ${die.accent.glow}`}>
            {children}
          </section>

          <aside className="flex flex-col gap-4">
            <ResultRelic hint={hint} outcome={outcome} />
            {aside}
          </aside>
        </div>
      </div>
    </motion.main>
  );
}
