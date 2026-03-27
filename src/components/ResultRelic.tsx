import { motion } from "framer-motion";
import type { RollOutcome } from "@/utils/rolls";

type ResultRelicProps = {
  hint: string;
  outcome: RollOutcome | null;
};

const TIER_COPY: Record<RollOutcome["tier"], string> = {
  low: "a little embarrassing",
  mid: "acceptable nonsense",
  high: "suspiciously impressive",
  crit: "completely insufferable",
};

export function ResultRelic({ hint, outcome }: ResultRelicProps) {
  return (
    <section className="room-panel vault-texture flex min-h-[15rem] flex-col justify-between rounded-[1.8rem] p-5">
      <div>
        <p className="font-curse text-[0.68rem] uppercase tracking-[0.34em] text-stone-300/70">
          Current result
        </p>
        <motion.div
          key={outcome ? `${outcome.dieId}-${outcome.rolledAt}` : "waiting"}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          <p className="mt-5 text-6xl font-semibold text-stone-50 sm:text-7xl">
            {outcome ? outcome.value : "?"}
          </p>
          <p className="mt-3 text-base text-stone-200/90">
            {outcome ? `${outcome.label} gave you ${outcome.value}/${outcome.max}.` : "The room is still deciding whether you deserve a number."}
          </p>
        </motion.div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.28em] text-stone-400/80">
          <span>{outcome ? TIER_COPY[outcome.tier] : "waiting politely"}</span>
        </div>
        <p className="text-sm leading-6 text-stone-300/82">{hint}</p>
      </div>
    </section>
  );
}
