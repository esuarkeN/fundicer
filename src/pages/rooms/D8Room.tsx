import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FullscreenRoom } from "@/components/FullscreenRoom";
import { DICE_BY_ID } from "@/data/dice";
import { pick, rollDie, type RollOutcome } from "@/utils/rolls";

const die = DICE_BY_ID.d8;

const NOTES = {
  low: ["A delicate impact followed by a fairly rude number.", "It landed beautifully and still let you down."],
  mid: ["A respectable bounce. The floor remains cautiously optimistic.", "Solid landing. Nobody claps, but nobody boos."],
  high: ["Impact with benefits. The crystal sparkles like it planned this.", "A dramatic drop and a number to match."],
  crit: ["Maximum impact. The shaft pretends this happens all the time.", "The crystal lands like a tiny prophecy."],
} satisfies Record<RollOutcome["tier"], readonly string[]>;

type TimingBand = "perfect" | "good" | "late" | "miss";

export function D8Room() {
  const reducedMotion = useReducedMotion() ?? false;
  const [outcome, setOutcome] = useState<RollOutcome | null>(null);
  const [armed, setArmed] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [dropKey, setDropKey] = useState(0);
  const [band, setBand] = useState<TimingBand>("miss");
  const [note, setNote] = useState("Call the crystal down from the shaft and let the floor do the convincing.");
  const [meterText, setMeterText] = useState("Arm the shaft, then wait for the amber release window.");
  const timers = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const startedAt = useRef(0);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current = [];
    };
  }, []);

  useEffect(() => {
    if (!armed || releasing) {
      return;
    }

    startedAt.current = performance.now();

    const step = (time: number) => {
      const elapsed = time - startedAt.current;
      setPulse((elapsed % 1400) / 1400);
      rafRef.current = window.requestAnimationFrame(step);
    };

    rafRef.current = window.requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [armed, releasing]);

  function queue(callback: () => void, delay: number) {
    timers.current.push(window.setTimeout(callback, delay));
  }

  function armShaft() {
    if (releasing) {
      return;
    }

    setOutcome(null);
    setBand("miss");
    setNote("The shaft is armed. Watch the pulse and choose the release moment.");
    setMeterText("The pulse is live. Release when it crosses the amber band.");
    setArmed(true);
  }

  function releaseCrystal() {
    if (!armed || releasing) {
      return;
    }

    const next = rollDie("d8");
    const pulsePosition = pulse * 100;
    const windowStart = 38;
    const windowEnd = 58;
    const center = 48;
    const withinWindow = pulsePosition >= windowStart && pulsePosition <= windowEnd;
    const timingBand: TimingBand = withinWindow ? (Math.abs(pulsePosition - center) <= 4 ? "perfect" : "good") : pulsePosition < windowStart ? "miss" : "late";

    setReleasing(true);
    setArmed(false);
    setDropKey((value) => value + 1);
    setBand(timingBand);
    setNote(
      timingBand === "perfect"
        ? "Clean release. The crystal trusts you for a suspiciously brief moment."
        : timingBand === "good"
          ? "Good timing. The crystal catches the window and keeps moving."
          : timingBand === "late"
            ? "Too late. The window passed and the floor wrote its own ending."
            : "Too early. The shaft swallows the timing and laughs at the attempt.",
    );
    setMeterText(
      timingBand === "perfect"
        ? "Perfect timing. The release window opens like it wanted this."
        : timingBand === "good"
          ? "Good timing. You clipped the bright band on the way through."
          : timingBand === "late"
            ? "Late release. You missed the bright band by a heartbeat."
            : "Early release. The crystal lunged before the window opened.",
    );

    queue(() => {
      setOutcome(next);
      setNote(pick(NOTES[next.tier]));
      setMeterText("The crystal has settled. Arm the shaft again for another throw.");
    }, reducedMotion ? 160 : 720);

    queue(() => {
      setReleasing(false);
    }, reducedMotion ? 260 : 1320);
  }

  const pulsePosition = pulse * 100;
  const bandGlow =
    band === "perfect"
      ? "shadow-[0_0_28px_rgba(251,191,36,0.4)]"
      : band === "good"
        ? "shadow-[0_0_20px_rgba(251,191,36,0.24)]"
        : band === "late"
          ? "shadow-[0_0_18px_rgba(248,113,113,0.16)]"
          : "shadow-[0_0_18px_rgba(255,255,255,0.1)]";

  return (
    <FullscreenRoom die={die} contentClassName="overflow-hidden">
      <section className="relative flex min-h-0 flex-1 overflow-hidden bg-[linear-gradient(180deg,rgba(5,12,15,1),rgba(0,0,0,1))]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.03)_50%,transparent_100%)] opacity-30" />
        <div className="absolute inset-x-[18%] top-0 h-full rounded-b-[4rem] border-x border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_18%,rgba(255,255,255,0.02)_78%,rgba(255,255,255,0.06)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_46%)]" />

        <div className="absolute left-4 top-4 z-10 max-w-sm rounded-[1.6rem] border border-white/10 bg-black/28 px-4 py-4 sm:left-6 sm:top-6 sm:px-5">
          <p className="font-curse text-[0.64rem] uppercase tracking-[0.32em] text-emerald-100/68">Release note</p>
          <p className="mt-3 text-sm leading-6 text-stone-300/84">{note}</p>
          <p className="mt-3 text-[0.64rem] uppercase tracking-[0.28em] text-stone-400">{meterText}</p>
        </div>

        <div className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-black/24 px-4 py-2 text-[0.64rem] uppercase tracking-[0.28em] text-stone-300/72 sm:right-6 sm:top-6">
          {releasing ? "Crystal in motion" : outcome ? `Locked ${outcome.value}` : armed ? "Ready to release" : "Awaiting release"}
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-between px-4 py-8 sm:px-6 lg:px-10">
          <div className="rounded-full border border-white/10 bg-black/18 px-4 py-2 text-[0.68rem] uppercase tracking-[0.28em] text-stone-300/74">
            Release shaft
          </div>

          <div className="relative flex w-full flex-1 items-end justify-center">
            <motion.div
              key={dropKey}
              animate={
                releasing
                  ? {
                      rotate: reducedMotion ? 0 : [-16, 18, -12, 8, 0],
                      scale: [0.88, 1.04, 0.98, 1.01, 1],
                      y: reducedMotion ? [0, 18, 0] : [-320, 0, -56, 0, -22, 0],
                    }
                  : { rotate: 0, scale: 1, y: 0 }
              }
              className={`relative mb-10 flex h-40 w-36 items-center justify-center rounded-[32%] border border-emerald-100/20 bg-[linear-gradient(180deg,rgba(167,243,208,0.34),rgba(14,116,144,0.16),rgba(10,12,14,0.92))] shadow-[0_30px_90px_-24px_rgba(16,185,129,0.42)] ${bandGlow}`}
              initial={false}
              transition={{
                duration: reducedMotion ? 0.42 : 1.15,
                times: reducedMotion ? [0, 0.7, 1] : [0, 0.58, 0.72, 0.86, 0.94, 1],
                ease: "easeOut",
              }}
            >
              <div className="absolute inset-3 rounded-[28%] border border-white/10" />
              <motion.span
                animate={{ opacity: outcome ? 1 : 0.45, scale: releasing ? [0.86, 1.08, 1] : 1 }}
                className="text-6xl text-emerald-50"
                transition={{ duration: 0.2 }}
              >
                {outcome?.value ?? 8}
              </motion.span>
            </motion.div>

            {releasing ? (
              <motion.div
                animate={{ opacity: [0.15, 0.5, 0], scale: [0.75, 1.16, 1.28] }}
                className="absolute bottom-10 h-20 w-56 rounded-full border border-emerald-100/12 bg-emerald-100/8 blur-sm"
                transition={{ duration: reducedMotion ? 0.3 : 0.7, times: [0, 0.55, 1] }}
              />
            ) : null}
          </div>

          <div className="flex w-full flex-col items-center gap-5 text-center">
            <div className="w-full max-w-3xl">
              <div className="relative h-4 overflow-hidden rounded-full border border-white/10 bg-black/28">
                <div
                  className="absolute inset-y-0 left-[38%] right-[42%] rounded-full bg-amber-100/28"
                  style={{ boxShadow: "0 0 24px rgba(251, 191, 36, 0.18)" }}
                />
                <motion.div
                  animate={{ left: `${pulsePosition}%` }}
                  className="absolute top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-100/30 bg-[radial-gradient(circle,rgba(255,245,200,0.92),rgba(251,191,36,0.18),rgba(17,17,20,0.92))] shadow-[0_0_30px_rgba(255,245,200,0.28)]"
                  initial={false}
                  transition={{ duration: reducedMotion ? 0 : 0.08 }}
                  style={{ left: "0%" }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[0.62rem] uppercase tracking-[0.28em] text-stone-500">
                <span>early</span>
                <span className="text-amber-100/72">release window</span>
                <span>late</span>
              </div>
              <div className="mt-2 h-px w-full bg-white/5" />
              <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-black/30">
                <div className="w-[38%] bg-transparent" />
                <div className="w-[20%] bg-amber-100/24" />
                <div className="w-[42%] bg-transparent" />
              </div>
            </div>

            <p className="max-w-xl text-sm leading-6 text-stone-300/82">
              Arm the shaft, wait for the bright window, and time the release as the pulse passes through the amber band.
            </p>
            <button
              className="rounded-full border border-emerald-100/16 bg-emerald-100/8 px-6 py-3 text-sm uppercase tracking-[0.24em] text-emerald-50 transition hover:border-emerald-100/26 hover:bg-emerald-100/12 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={releasing}
              onClick={() => {
                if (!armed) {
                  armShaft();
                  return;
                }

                releaseCrystal();
              }}
              type="button"
            >
              {releasing ? "Crystal in motion" : !armed ? "Arm the shaft" : "Release now"}
            </button>
          </div>
        </div>
      </section>
    </FullscreenRoom>
  );
}





