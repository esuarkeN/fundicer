import { motion } from "framer-motion";
import { useState } from "react";
import { FullscreenRoom } from "@/components/FullscreenRoom";
import { DICE_BY_ID } from "@/data/dice";
import { rollDie, type RollOutcome } from "@/utils/rolls";

const die = DICE_BY_ID.d4;

const SHARDS = [
  { id: "a", label: "front-left", angle: -10 },
  { id: "b", label: "front-right", angle: 8 },
  { id: "c", label: "back-left", angle: -6 },
  { id: "d", label: "back-right", angle: 12 },
] as const;

export function D4Room() {
  const [selectedShard, setSelectedShard] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<RollOutcome | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const statusText =
    selectedShard === null
      ? "Choose a shard to wake the drawer."
      : outcome
        ? `The drawer spat out a ${outcome.value}.`
        : "Pull the drawer when you are ready.";

  function pullDrawer() {
    if (selectedShard === null) {
      return;
    }

    setDrawerOpen(true);
    setOutcome(rollDie("d4"));
  }

  return (
    <FullscreenRoom die={die}>
      <section className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_28%),radial-gradient(circle_at_24%_18%,rgba(217,70,239,0.12),transparent_22%),radial-gradient(circle_at_78%_82%,rgba(255,255,255,0.04),transparent_26%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_14%,transparent_86%,rgba(255,255,255,0.02))]" />

        <motion.div
          animate={{ scale: drawerOpen ? [1, 1.01, 1] : 1 }}
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
              rotate: drawerOpen ? [0, -1, 1, 0] : 0,
              x: drawerOpen ? [0, -3, 3, 0] : 0,
            }}
            className="grid w-full max-w-3xl gap-5 sm:grid-cols-2"
            transition={{ duration: 0.46 }}
          >
            {SHARDS.map((shard, index) => {
              const selected = selectedShard === index;

              return (
                <motion.button
                  key={shard.id}
                  animate={{
                    rotate: selected ? shard.angle + 2 : shard.angle,
                    y: selected ? -10 : 0,
                    scale: selected ? 1.03 : 1,
                  }}
                  className={`relative isolate flex min-h-[14rem] items-end justify-center overflow-hidden rounded-[2rem] border p-5 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-100/70 ${
                    selected
                      ? "border-fuchsia-200/40 bg-[radial-gradient(circle_at_top,rgba(249,168,212,0.18),transparent_52%),linear-gradient(180deg,rgba(30,8,34,0.88),rgba(0,0,0,1))] shadow-[0_24px_70px_-24px_rgba(217,70,239,0.42)]"
                      : "border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_52%),linear-gradient(180deg,rgba(14,14,18,0.9),rgba(0,0,0,1))] hover:border-white/24"
                  }`}
                  onClick={() => {
                    setSelectedShard(index);
                    setOutcome(null);
                    setDrawerOpen(false);
                  }}
                  type="button"
                >
                  <div
                    className="absolute left-1/2 top-5 h-28 w-28 -translate-x-1/2 rounded-[1.3rem] border border-fuchsia-100/16 bg-[linear-gradient(180deg,rgba(249,168,212,0.18),rgba(91,33,182,0.06))]"
                    style={{ clipPath: "polygon(50% 4%, 96% 90%, 4% 90%)" }}
                  />

                  <div className="relative z-10">
                    <p className="font-curse text-[0.62rem] uppercase tracking-[0.32em] text-fuchsia-100/72">
                      {shard.label}
                    </p>
                    <p className="mt-3 text-sm text-stone-300/80">{selected ? "selected" : "waiting"}</p>

                    {selected && outcome ? (
                      <motion.p
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-4 text-4xl text-fuchsia-100"
                        initial={{ opacity: 0, scale: 0.7 }}
                        transition={{ duration: 0.22 }}
                      >
                        {outcome.value}
                      </motion.p>
                    ) : null}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>

          <div className="flex flex-col items-center gap-4">
            <button
              className="rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm uppercase tracking-[0.24em] text-stone-100 transition hover:border-white/24 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={selectedShard === null}
              onClick={pullDrawer}
              type="button"
            >
              Pull the drawer
            </button>

            <p className="font-curse text-[0.66rem] uppercase tracking-[0.3em] text-stone-500">
              {selectedShard === null ? "No shard selected" : outcome ? "Result locked in the shard" : "Drawer armed"}
            </p>
          </div>
        </motion.div>
      </section>
    </FullscreenRoom>
  );
}
