import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AmbientEyes } from "@/components/AmbientEyes";
import { FullscreenRoom } from "@/components/FullscreenRoom";
import { DICE_BY_ID } from "@/data/dice";
import { pick, rollDie, type RollOutcome } from "@/utils/rolls";

const die = DICE_BY_ID.d12;
const STEP_MS = 180;

const DECREES = {
  low: ["The court issues a small, dignified disappointment.", "Judgment delivered. The eyes were hoping for more."],
  mid: ["The court approves this number with bureaucratic restraint.", "A reasonable decree, slightly annoyed at being reasonable."],
  high: ["The chamber leans in and calls this promising.", "A favorable ruling with just a touch of smug pageantry."],
  crit: ["A perfect verdict. The chamber nearly applauds itself.", "Maximum approval. The room will be speaking about this for hours."],
} satisfies Record<RollOutcome["tier"], readonly string[]>;

type Point = {
  x: number;
  y: number;
};

type Zone = Point & {
  radius: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function createZone(radius: number, anchor: Point) {
  return {
    x: clamp(anchor.x, 18 + radius, 82 - radius),
    y: clamp(anchor.y, 18 + radius, 82 - radius),
    radius,
  };
}

function driftZone(zone: Zone, reducedMotion: boolean) {
  const wobble = reducedMotion ? 4.5 : 7.5;
  const nextRadius = Math.max(7, zone.radius - (reducedMotion ? 0.06 : 0.14));

  return {
    x: clamp(zone.x + (Math.random() * 2 - 1) * wobble, 18 + nextRadius, 82 - nextRadius),
    y: clamp(zone.y + (Math.random() * 2 - 1) * wobble, 18 + nextRadius, 82 - nextRadius),
    radius: nextRadius,
  };
}

export function D12Room() {
  const reducedMotion = useReducedMotion() ?? false;
  const [pointer, setPointer] = useState<Point>({ x: 50, y: 40 });
  const [challengeActive, setChallengeActive] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outcome, setOutcome] = useState<RollOutcome | null>(null);
  const [decree, setDecree] = useState("Open the channel and keep the pointer inside the wandering seal until the court is satisfied.");
  const [zone, setZone] = useState<Zone>(() => createZone(16, { x: 50, y: 50 }));
  const timers = useRef<number[]>([]);
  const stepTimer = useRef<number | null>(null);
  const pointerRef = useRef(pointer);
  const zoneRef = useRef(zone);
  const activeRef = useRef(challengeActive);
  const resolvingRef = useRef(resolving);

  useEffect(() => {
    pointerRef.current = pointer;
  }, [pointer]);

  useEffect(() => {
    zoneRef.current = zone;
  }, [zone]);

  useEffect(() => {
    activeRef.current = challengeActive;
  }, [challengeActive]);

  useEffect(() => {
    resolvingRef.current = resolving;
  }, [resolving]);

  useEffect(() => {
    return () => {
      if (stepTimer.current !== null) {
        window.clearTimeout(stepTimer.current);
      }
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current = [];
    };
  }, []);

  function queue(callback: () => void, delay: number) {
    timers.current.push(window.setTimeout(callback, delay));
  }

  function stopStepLoop() {
    if (stepTimer.current !== null) {
      window.clearTimeout(stepTimer.current);
      stepTimer.current = null;
    }
  }

  function finishVerdict() {
    const next = rollDie("d12");
    stopStepLoop();
    setChallengeActive(false);
    setResolving(true);
    setProgress(1);
    setDecree("The chamber is aligning twelve opinions and one unnecessary gasp.");

    queue(() => {
      setOutcome(next);
      setResolving(false);
      setProgress(0);
      setZone(createZone(16, { x: 50, y: 50 }));
      setDecree(pick(DECREES[next.tier]));
    }, reducedMotion ? 120 : 680);
  }

  function advanceChallenge() {
    if (!activeRef.current || resolvingRef.current) {
      return;
    }

    const currentZone = zoneRef.current;
    const inside = distance(pointerRef.current, currentZone) <= currentZone.radius;
    const nextZone = driftZone(currentZone, reducedMotion);
    zoneRef.current = nextZone;
    setZone(nextZone);

    let reachedVerdict = false;
    setProgress((current) => {
      const delta = inside ? (reducedMotion ? 0.16 : 0.1) : -(reducedMotion ? 0.14 : 0.2);
      const next = clamp(current + delta, 0, 1);
      if (next >= 1) {
        reachedVerdict = true;
      }
      return next;
    });

    if (reachedVerdict) {
      finishVerdict();
      return;
    }

    stepTimer.current = window.setTimeout(advanceChallenge, STEP_MS);
  }

  function startVerdict() {
    if (activeRef.current || resolvingRef.current) {
      return;
    }

    stopStepLoop();
    setOutcome(null);
    setProgress(0);
    const nextZone = createZone(reducedMotion ? 15 : 16, { x: 50, y: 50 });
    zoneRef.current = nextZone;
    setZone(nextZone);
    setChallengeActive(true);
    setDecree("Keep the pointer inside the moving seal until the chamber tires of watching.");
    stepTimer.current = window.setTimeout(advanceChallenge, STEP_MS);
  }

  function stopVerdict() {
    if (!activeRef.current || resolvingRef.current) {
      return;
    }

    stopStepLoop();
    setChallengeActive(false);
    setProgress(0);
    const nextZone = createZone(16, { x: 50, y: 50 });
    zoneRef.current = nextZone;
    setZone(nextZone);
    setDecree("Too twitchy. The chamber requires a steadier hand.");
  }

  return (
    <FullscreenRoom die={die} contentClassName="overflow-hidden">
      <section
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(214,158,46,0.16),transparent_24%),linear-gradient(180deg,rgba(22,16,10,1),rgba(0,0,0,1))]"
        onPointerMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          const next = {
            x: ((event.clientX - bounds.left) / bounds.width) * 100,
            y: ((event.clientY - bounds.top) / bounds.height) * 100,
          };
          pointerRef.current = next;
          setPointer(next);
        }}
      >
        <AmbientEyes
          active
          className="absolute inset-0 opacity-75"
          normalizedPointer={{ x: pointer.x / 100, y: pointer.y / 100 }}
          reducedMotion={reducedMotion}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_44%)]" />

        <div className="absolute left-4 top-4 z-10 max-w-sm rounded-[1.6rem] border border-white/10 bg-black/24 px-4 py-4 sm:left-6 sm:top-6 sm:px-5">
          <p className="font-curse text-[0.64rem] uppercase tracking-[0.32em] text-amber-100/68">Decree</p>
          <p className="mt-3 text-sm leading-6 text-stone-300/84">{decree}</p>
        </div>

        <div className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-black/24 px-4 py-2 text-[0.64rem] uppercase tracking-[0.28em] text-stone-300/72 sm:right-6 sm:top-6">
          {resolving ? "Judging" : outcome ? `Verdict ${outcome.value}` : challengeActive ? "Channel open" : "Court attentive"}
        </div>

        <div className="relative flex h-full w-full items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="relative h-[22rem] w-[22rem] max-w-full">
            {Array.from({ length: 12 }, (_, index) => {
              const angle = (index / 12) * Math.PI * 2;
              const x = 50 + Math.cos(angle) * 42;
              const y = 50 + Math.sin(angle) * 42;

              return (
                <div
                  key={index}
                  className="absolute h-3 w-3 rounded-full bg-amber-100/50 shadow-[0_0_16px_rgba(251,191,36,0.35)]"
                  style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
                />
              );
            })}

            <div className="absolute inset-[14%] rounded-full border border-amber-100/14" />
            <div className="absolute inset-[24%] rounded-full border border-amber-100/10" />

            <motion.div
              animate={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: `${zone.radius * 2}%`,
                height: `${zone.radius * 2}%`,
                opacity: challengeActive || resolving ? 1 : 0.55,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-100/26 bg-[radial-gradient(circle,rgba(251,191,36,0.22),rgba(251,191,36,0.04),transparent_72%)] shadow-[0_0_40px_rgba(251,191,36,0.16)]"
              transition={{ duration: 0.18, ease: "easeOut" }}
            />

            <motion.div
              animate={{ left: `${pointer.x}%`, top: `${pointer.y}%`, opacity: challengeActive || resolving ? 1 : 0.7 }}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
              transition={{ duration: 0.08 }}
            >
              <div className="relative h-20 w-20">
                <div className="absolute inset-0 rounded-full border border-amber-100/16 bg-[radial-gradient(circle,rgba(255,245,200,0.2),rgba(255,245,200,0.08),transparent_72%)] shadow-[0_0_28px_rgba(255,240,188,0.16)]" />
                <div className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-stone-200/24 bg-[linear-gradient(180deg,rgba(37,37,42,0.96),rgba(8,8,10,1))] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]" />
                <div className="absolute left-[54%] top-[57%] h-8 w-2.5 rounded-full bg-[linear-gradient(180deg,rgba(120,120,124,0.95),rgba(42,42,46,1))] rotate-[38deg] origin-top" />
                <div className="absolute left-[62%] top-[86%] h-3.5 w-9 -translate-x-1/2 rounded-full border border-stone-200/12 bg-[linear-gradient(180deg,rgba(72,72,76,0.95),rgba(19,19,22,1))]" />
              </div>
            </motion.div>

            <motion.div
              animate={{ opacity: challengeActive || resolving ? 1 : 0 }}
              className="absolute inset-x-4 bottom-4 rounded-[1.5rem] border border-white/10 bg-black/42 px-4 py-3 text-center"
              initial={false}
            >
              <p className="font-curse text-[0.62rem] uppercase tracking-[0.3em] text-amber-100/74">
                {resolving ? "Judgment forming" : challengeActive ? "Keep the eye inside the seal" : "Open the channel to begin"}
              </p>
              <div className="mx-auto mt-3 h-1.5 w-40 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  animate={{ width: `${progress * 100}%` }}
                  className="h-full rounded-full bg-amber-100"
                  initial={false}
                  transition={{ duration: 0.08 }}
                />
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute inset-x-4 bottom-4 z-10 flex justify-center sm:inset-x-6 sm:bottom-6">
          <div className="flex gap-3 rounded-full border border-white/10 bg-black/28 p-2 backdrop-blur">
            <button
              className="rounded-full border border-amber-100/18 bg-amber-100/8 px-5 py-2 text-[0.68rem] uppercase tracking-[0.28em] text-amber-50 transition hover:border-amber-100/30 hover:bg-amber-100/12 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={challengeActive || resolving}
              onClick={startVerdict}
              type="button"
            >
              Open channel
            </button>
            <button
              className="rounded-full border border-white/12 bg-white/6 px-5 py-2 text-[0.68rem] uppercase tracking-[0.28em] text-stone-200 transition hover:border-white/24 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!challengeActive || resolving}
              onClick={stopVerdict}
              type="button"
            >
              Close channel
            </button>
          </div>
        </div>

        {outcome ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-6 left-1/2 z-10 w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 rounded-[1.8rem] border border-amber-100/16 bg-[linear-gradient(180deg,rgba(22,16,10,0.84),rgba(0,0,0,0.96))] p-5 text-center shadow-[0_24px_80px_-24px_rgba(251,191,36,0.36)]"
            initial={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.24 }}
          >
            <p className="font-curse text-[0.66rem] uppercase tracking-[0.34em] text-amber-100/76">Verdict issued</p>
            <p className="mt-4 text-6xl text-amber-50 sm:text-7xl">{outcome.value}</p>
          </motion.div>
        ) : null}
      </section>
    </FullscreenRoom>
  );
}
