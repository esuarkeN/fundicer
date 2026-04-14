import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FullscreenRoom } from "@/components/FullscreenRoom";
import { DICE_BY_ID } from "@/data/dice";

const die = DICE_BY_ID.d4;

const DRAWERS = [
  { id: "a", label: "front-left", angle: -10 },
  { id: "b", label: "front-right", angle: 8 },
  { id: "c", label: "back-left", angle: -6 },
  { id: "d", label: "back-right", angle: 12 },
] as const;

const DRAWER_VALUES = [1, 2, 3, 4] as const;
const SEAL_DURATION_MS = 320;

type DrawerPhase = "sealed" | "revealed" | "sealing";

function shuffleDrawerValues() {
  const values = [...DRAWER_VALUES];

  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }

  return values;
}

export function D4Room() {
  const [phase, setPhase] = useState<DrawerPhase>("sealed");
  const [selectedDrawer, setSelectedDrawer] = useState<number | null>(null);
  const [drawerValues, setDrawerValues] = useState(() => shuffleDrawerValues());

  const revealed = phase === "revealed";
  const sealing = phase === "sealing";
  const selectedValue = selectedDrawer === null ? null : drawerValues[selectedDrawer];

  const statusText =
    phase === "sealed"
      ? "Pick one drawer. A shuffled 1 through 4 is hidden under the fronts."
      : sealing
        ? "The drawers are sealing first. The next shuffle starts only after the fronts are shut."
        : `You pulled a ${selectedValue}. The other drawers are open now, so every hidden number is visible.`;

  useEffect(() => {
    if (!sealing) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDrawerValues(shuffleDrawerValues());
      setSelectedDrawer(null);
      setPhase("sealed");
    }, SEAL_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [sealing]);

  function resetRound() {
    if (!revealed) {
      return;
    }

    setPhase("sealing");
  }

  return (
    <FullscreenRoom die={die}>
      <section className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_28%),radial-gradient(circle_at_24%_18%,rgba(217,70,239,0.12),transparent_22%),radial-gradient(circle_at_78%_82%,rgba(255,255,255,0.04),transparent_26%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_14%,transparent_86%,rgba(255,255,255,0.02))]" />

        <motion.div
          animate={{ scale: revealed ? [1, 1.01, 1] : 1 }}
          className="relative flex w-full max-w-5xl flex-col items-center gap-8"
          transition={{ duration: 0.4 }}
        >
          <div className="text-center">
            <p className="font-curse text-[0.68rem] uppercase tracking-[0.34em] text-fuchsia-100/68">
              Pitch-black drawer room
            </p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-stone-400">{statusText}</p>
          </div>

          <motion.div
            animate={{
              rotate: revealed ? [0, -1, 1, 0] : 0,
              x: revealed ? [0, -3, 3, 0] : 0,
            }}
            className="grid w-full max-w-3xl gap-5 sm:grid-cols-2"
            transition={{ duration: 0.46 }}
          >
            {DRAWERS.map((drawer, index) => {
              const selected = revealed && selectedDrawer === index;
              const value = drawerValues[index];

              return (
                <motion.button
                  key={drawer.id}
                  animate={{
                    rotate: selected ? drawer.angle + 2 : drawer.angle,
                    y: selected ? -10 : revealed ? -3 : 0,
                    scale: selected ? 1.03 : 1,
                  }}
                  className={`relative isolate flex min-h-[14rem] items-end justify-center overflow-hidden rounded-[2rem] border p-5 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-100/70 ${
                    selected
                      ? "border-fuchsia-200/40 bg-[radial-gradient(circle_at_top,rgba(249,168,212,0.18),transparent_52%),linear-gradient(180deg,rgba(30,8,34,0.88),rgba(0,0,0,1))] shadow-[0_24px_70px_-24px_rgba(217,70,239,0.42)]"
                      : "border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_52%),linear-gradient(180deg,rgba(14,14,18,0.9),rgba(0,0,0,1))] hover:border-white/24 disabled:hover:border-white/10"
                  }`}
                  disabled={phase !== "sealed"}
                  onClick={() => {
                    if (phase !== "sealed") {
                      return;
                    }

                    setSelectedDrawer(index);
                    setPhase("revealed");
                  }}
                  type="button"
                >
                  <div className="absolute inset-x-6 top-6 bottom-7 rounded-[1.7rem] border border-fuchsia-100/14 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_58%),linear-gradient(180deg,rgba(14,14,18,0.3),rgba(0,0,0,0.05))]" />

                  <div className="relative z-0 flex h-full w-full items-center justify-center">
                    <motion.p
                      animate={{ opacity: revealed ? 1 : 0, scale: revealed ? 1 : 0.78 }}
                      className={`text-6xl leading-none ${selected ? "text-fuchsia-50" : "text-stone-200/88"}`}
                      initial={false}
                      transition={{ duration: 0.22 }}
                    >
                      {value}
                    </motion.p>
                  </div>

                  <motion.div
                    animate={{
                      opacity: revealed ? 0.94 : 1,
                      y: revealed ? (selected ? 86 : 72) : 0,
                    }}
                    className={`absolute inset-x-4 top-4 bottom-12 rounded-[1.7rem] border ${
                      selected
                        ? "border-fuchsia-100/22 bg-[linear-gradient(180deg,rgba(249,168,212,0.2),rgba(91,33,182,0.08),rgba(12,6,16,0.94))]"
                        : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(24,24,28,0.88),rgba(4,4,6,0.97))]"
                    }`}
                    initial={false}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                  >
                    <div className="absolute inset-x-5 top-4 flex items-center justify-between text-[0.55rem] uppercase tracking-[0.28em] text-stone-300/54">
                      <span>drawer</span>
                      <span>{index + 1}</span>
                    </div>

                    <div className="absolute inset-x-6 top-1/2 h-4 -translate-y-1/2 rounded-full border border-black/28 bg-[linear-gradient(180deg,rgba(255,248,240,0.3),rgba(117,24,61,0.22))] shadow-[0_0_18px_rgba(255,255,255,0.08)]" />
                  </motion.div>

                  <div className="relative z-10">
                    <p className="font-curse text-[0.62rem] uppercase tracking-[0.32em] text-fuchsia-100/72">
                      {drawer.label}
                    </p>
                    <p className="mt-3 text-sm text-stone-300/80">
                      {selected ? "picked" : sealing ? "sealing" : revealed ? "revealed" : "sealed"}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>

          <div className="flex flex-col items-center gap-4">
            <button
              className="rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm uppercase tracking-[0.24em] text-stone-100 transition hover:border-white/24 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!revealed}
              onClick={resetRound}
              type="button"
            >
              {sealing ? "Sealing" : "Roll again"}
            </button>

            <p className="font-curse text-[0.66rem] uppercase tracking-[0.3em] text-stone-500">
              {revealed
                ? "Numbers exposed until the reset"
                : sealing
                  ? "Sealing before the shuffle"
                  : "Numbers hidden under the drawer faces"}
            </p>
          </div>
        </motion.div>
      </section>
    </FullscreenRoom>
  );
}
