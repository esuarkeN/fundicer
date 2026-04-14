import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FullscreenRoom } from "@/components/FullscreenRoom";
import { DICE_BY_ID } from "@/data/dice";
import { pick, rollDie, type RollOutcome } from "@/utils/rolls";

const die = DICE_BY_ID.d12;
const GAME_DURATION_MS = 5_000;
const SPAWN_INTERVAL_MS = 280;
const BUBBLE_LIFETIME_MS = 1_050;
const LEADERBOARD_LIMIT = 10;
const LEADERBOARD_STORAGE_KEY = "fundicer:d12-aim-leaderboard";

const DECREES = {
  low: ["A low ruling. Fast hands, stingy fate.", "The chamber saw the hustle and still handed you a small number."],
  mid: ["A middling verdict. The bubbles were louder than the prophecy.", "Decent score, sensible ruling, no applause."],
  high: ["The chamber respects that score and says so with a better number.", "A sharp run and a favorable verdict."],
  crit: ["Maximum verdict. The chamber calls that aim suspiciously divine.", "Perfect judgment with the bubbles still smoking."],
} satisfies Record<RollOutcome["tier"], readonly string[]>;

type Phase = "idle" | "running" | "resolving" | "finished";

type Point = {
  x: number;
  y: number;
};

type Bubble = Point & {
  id: number;
  size: number;
  expiresAt: number;
  hue: number;
};

type LeaderboardEntry = {
  id: string;
  name: string;
  outcome: number;
  playedAt: number;
  score: number;
};

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function sortLeaderboard(entries: LeaderboardEntry[]) {
  return [...entries]
    .sort((left, right) => right.score - left.score || right.playedAt - left.playedAt)
    .slice(0, LEADERBOARD_LIMIT);
}

function readLeaderboard() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(LEADERBOARD_STORAGE_KEY) ?? "[]");

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortLeaderboard(
      parsed.flatMap((entry) => {
        if (!entry || typeof entry !== "object") {
          return [];
        }

        const candidate = entry as Partial<LeaderboardEntry>;

        if (
          typeof candidate.id !== "string" ||
          typeof candidate.name !== "string" ||
          typeof candidate.score !== "number" ||
          typeof candidate.outcome !== "number" ||
          typeof candidate.playedAt !== "number"
        ) {
          return [];
        }

        return [
          {
            id: candidate.id,
            name: candidate.name,
            score: candidate.score,
            outcome: candidate.outcome,
            playedAt: candidate.playedAt,
          },
        ];
      }),
    );
  } catch {
    return [];
  }
}

function writeLeaderboard(entries: LeaderboardEntry[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(entries));
}

export function D12Room() {
  const reducedMotion = useReducedMotion() ?? false;
  const [phase, setPhase] = useState<Phase>("idle");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(GAME_DURATION_MS);
  const [outcome, setOutcome] = useState<RollOutcome | null>(null);
  const [decree, setDecree] = useState(
    "Start the five-second trial, burst every bubble you can reach, and let the chamber roll the d12 when time runs out.",
  );
  const [playerName, setPlayerName] = useState("");
  const [scoreSaved, setScoreSaved] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => readLeaderboard());
  const bubbleIdRef = useRef(0);
  const endAtRef = useRef<number | null>(null);
  const spawnTimerRef = useRef<number | null>(null);
  const tickTimerRef = useRef<number | null>(null);
  const resolveTimerRef = useRef<number | null>(null);
  const phaseRef = useRef<Phase>(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    return () => {
      if (spawnTimerRef.current !== null) {
        window.clearInterval(spawnTimerRef.current);
      }

      if (tickTimerRef.current !== null) {
        window.clearInterval(tickTimerRef.current);
      }

      if (resolveTimerRef.current !== null) {
        window.clearTimeout(resolveTimerRef.current);
      }
    };
  }, []);

  function clearLoopTimers() {
    if (spawnTimerRef.current !== null) {
      window.clearInterval(spawnTimerRef.current);
      spawnTimerRef.current = null;
    }

    if (tickTimerRef.current !== null) {
      window.clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
  }

  function clearAllTimers() {
    clearLoopTimers();

    if (resolveTimerRef.current !== null) {
      window.clearTimeout(resolveTimerRef.current);
      resolveTimerRef.current = null;
    }
  }

  function createBubble(existing: Bubble[], now = Date.now()) {
    const size = randomBetween(reducedMotion ? 11 : 10, reducedMotion ? 14 : 16);
    const padding = size / 2 + 6;
    let candidate = {
      x: 50,
      y: 50,
      size,
      expiresAt: now + (reducedMotion ? BUBBLE_LIFETIME_MS + 240 : BUBBLE_LIFETIME_MS),
      hue: pick([32, 40, 48, 56]),
    };

    for (let attempt = 0; attempt < 16; attempt += 1) {
      const next = {
        ...candidate,
        x: randomBetween(padding, 100 - padding),
        y: randomBetween(padding, 100 - padding),
      };
      const collides = existing.some((bubble) => distance(next, bubble) < (next.size + bubble.size) * 0.56);

      if (!collides) {
        candidate = next;
        break;
      }

      candidate = next;
    }

    return {
      id: bubbleIdRef.current++,
      ...candidate,
    };
  }

  function refillBubbles(current: Bubble[], now = Date.now()) {
    const targetCount = reducedMotion ? 3 : 4;
    const next = [...current];

    while (next.length < targetCount) {
      next.push(createBubble(next, now));
    }

    return next;
  }

  function finishRun() {
    if (phaseRef.current !== "running") {
      return;
    }

    clearLoopTimers();
    phaseRef.current = "resolving";
    setPhase("resolving");
    setBubbles([]);
    setTimeLeftMs(0);
    setDecree("Time. The chamber is turning your panic into a twelve-sided ruling.");

    const nextOutcome = rollDie("d12");

    resolveTimerRef.current = window.setTimeout(() => {
      phaseRef.current = "finished";
      setOutcome(nextOutcome);
      setPhase("finished");
      setDecree(pick(DECREES[nextOutcome.tier]));
    }, reducedMotion ? 140 : 620);
  }

  function startRun() {
    clearAllTimers();
    bubbleIdRef.current = 0;
    phaseRef.current = "running";
    setPhase("running");
    setOutcome(null);
    setScore(0);
    setTimeLeftMs(GAME_DURATION_MS);
    setPlayerName("");
    setScoreSaved(false);
    setShowLeaderboard(false);
    setDecree("Five seconds. Pop every bubble you can before the chamber finalizes your d12.");

    const now = Date.now();
    endAtRef.current = now + GAME_DURATION_MS;

    const startingBubbles: Bubble[] = [];
    const initialCount = reducedMotion ? 2 : 3;

    while (startingBubbles.length < initialCount) {
      startingBubbles.push(createBubble(startingBubbles, now));
    }

    setBubbles(startingBubbles);

    spawnTimerRef.current = window.setInterval(() => {
      const tickNow = Date.now();

      setBubbles((current) => {
        const alive = current.filter((bubble) => bubble.expiresAt > tickNow);

        if (phaseRef.current !== "running") {
          return alive;
        }

        return refillBubbles(alive, tickNow);
      });
    }, reducedMotion ? SPAWN_INTERVAL_MS + 120 : SPAWN_INTERVAL_MS);

    tickTimerRef.current = window.setInterval(() => {
      const endAt = endAtRef.current;

      if (endAt === null) {
        return;
      }

      const tickNow = Date.now();
      const remaining = Math.max(0, endAt - tickNow);
      setTimeLeftMs(remaining);
      setBubbles((current) => current.filter((bubble) => bubble.expiresAt > tickNow));

      if (remaining <= 0) {
        finishRun();
      }
    }, 50);
  }

  function popBubble(id: number) {
    if (phaseRef.current !== "running") {
      return;
    }

    setScore((current) => current + 1);
    setBubbles((current) => {
      const remaining = current.filter((bubble) => bubble.id !== id && bubble.expiresAt > Date.now());

      if (phaseRef.current !== "running") {
        return remaining;
      }

      return refillBubbles(remaining);
    });
  }

  function saveScore() {
    if (!outcome || scoreSaved) {
      return;
    }

    const name = playerName.trim() || "Anonymous";
    const nextEntry: LeaderboardEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.slice(0, 18),
      score,
      outcome: outcome.value,
      playedAt: Date.now(),
    };
    const nextBoard = sortLeaderboard([nextEntry, ...leaderboard]);

    setLeaderboard(nextBoard);
    setScoreSaved(true);
    setShowLeaderboard(true);
    setDecree(`${nextEntry.name} pinned ${score} pops and a d12 ${outcome.value} onto the local board.`);
    writeLeaderboard(nextBoard);
  }

  const secondsLeft = (timeLeftMs / 1000).toFixed(1);
  const phaseLabel =
    phase === "running"
      ? "Trial live"
      : phase === "resolving"
        ? "Verdict forming"
        : outcome
          ? `Verdict ${outcome.value}`
          : "Aim test ready";

  return (
    <FullscreenRoom die={die} contentClassName="overflow-hidden">
      <section className="relative flex min-h-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),transparent_22%),linear-gradient(180deg,rgba(20,14,10,1),rgba(0,0,0,1))]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(251,191,36,0.08),transparent_24%),radial-gradient(circle_at_78%_74%,rgba(245,158,11,0.08),transparent_26%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_16%,transparent_84%,rgba(255,255,255,0.03))]" />

        <div className="absolute left-4 top-4 z-10 max-w-sm rounded-[1.6rem] border border-white/10 bg-black/24 px-4 py-4 sm:left-6 sm:top-6 sm:px-5">
          <p className="font-curse text-[0.64rem] uppercase tracking-[0.32em] text-amber-100/68">Trial note</p>
          <p className="mt-3 text-sm leading-6 text-stone-300/84">{decree}</p>
        </div>

        <div className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-black/24 px-4 py-2 text-[0.64rem] uppercase tracking-[0.28em] text-stone-300/72 sm:right-6 sm:top-6">
          {phaseLabel}
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
            <div className="relative mx-auto w-full max-w-[46rem]">
              <div className="relative aspect-square overflow-hidden rounded-[2.5rem] border border-amber-100/14 bg-[radial-gradient(circle_at_center,rgba(255,245,200,0.08),rgba(255,245,200,0.02),rgba(0,0,0,0.94))] shadow-[0_30px_120px_-34px_rgba(251,191,36,0.22)]">
                <div className="absolute inset-[7%] rounded-[2rem] border border-amber-100/10" />
                <div className="absolute inset-[15%] rounded-[1.8rem] border border-white/8" />
                <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[linear-gradient(180deg,transparent,rgba(251,191,36,0.14),transparent)]" />
                <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[linear-gradient(90deg,transparent,rgba(251,191,36,0.14),transparent)]" />

                {phase === "idle" ? (
                  <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                    <div className="max-w-md rounded-[2rem] border border-white/10 bg-black/30 px-6 py-7 backdrop-blur">
                      <p className="font-curse text-[0.68rem] uppercase tracking-[0.34em] text-amber-100/74">
                        Five-second chamber
                      </p>
                      <h2 className="mt-4 text-3xl text-stone-50 sm:text-4xl">Burst as many bubbles as possible.</h2>
                      <p className="mt-4 text-sm leading-6 text-stone-300/82">
                        The chamber gives you exactly five seconds. When the timer dies, the d12 result appears and the
                        leaderboard option unlocks.
                      </p>
                    </div>
                  </div>
                ) : null}

                {phase === "resolving" ? (
                  <motion.div
                    animate={{ opacity: [0.45, 0.9, 0.45], scale: [0.96, 1.02, 0.98] }}
                    className="absolute inset-0 flex items-center justify-center bg-black/22"
                    transition={{ duration: reducedMotion ? 0.6 : 1.2, repeat: Number.POSITIVE_INFINITY }}
                  >
                    <div className="rounded-full border border-amber-100/18 bg-amber-100/8 px-6 py-3 text-[0.72rem] uppercase tracking-[0.32em] text-amber-50">
                      Counting the shots
                    </div>
                  </motion.div>
                ) : null}

                {bubbles.map((bubble) => (
                  <motion.button
                    key={bubble.id}
                    animate={{ opacity: 1, scale: 1 }}
                    aria-label="Pop bubble"
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/18"
                    initial={{ opacity: 0, scale: 0.74 }}
                    onClick={() => {
                      popBubble(bubble.id);
                    }}
                    style={{
                      left: `${bubble.x}%`,
                      top: `${bubble.y}%`,
                      width: `${bubble.size}%`,
                      height: `${bubble.size}%`,
                      background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.92), hsla(${bubble.hue}, 96%, 70%, 0.78) 22%, hsla(${bubble.hue}, 86%, 48%, 0.2) 62%, rgba(0,0,0,0.08) 100%)`,
                      boxShadow: `0 0 24px hsla(${bubble.hue}, 96%, 64%, 0.28)`,
                    }}
                    transition={{ duration: reducedMotion ? 0.08 : 0.18, ease: "easeOut" }}
                    type="button"
                  >
                    <span
                      className="pointer-events-none absolute inset-[18%] rounded-full border border-white/24"
                      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.26)" }}
                    />
                    <span className="sr-only">Pop bubble</span>
                  </motion.button>
                ))}

                <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/42 px-4 py-2 text-[0.62rem] uppercase tracking-[0.3em] text-stone-300/78">
                  {phase === "running"
                    ? "Shoot the appearing bubbles"
                    : phase === "finished"
                      ? "Run complete"
                      : phase === "resolving"
                        ? "Verdict incoming"
                        : "Start the chamber"}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
                <div className="rounded-[1.8rem] border border-white/10 bg-black/26 p-5">
                  <p className="font-curse text-[0.64rem] uppercase tracking-[0.32em] text-amber-100/70">Time left</p>
                  <p className="mt-3 text-4xl text-stone-50">{secondsLeft}s</p>
                </div>

                <div className="rounded-[1.8rem] border border-white/10 bg-black/26 p-5">
                  <p className="font-curse text-[0.64rem] uppercase tracking-[0.32em] text-amber-100/70">Bubbles popped</p>
                  <p className="mt-3 text-4xl text-stone-50">{score}</p>
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-white/10 bg-black/26 p-5">
                <p className="font-curse text-[0.64rem] uppercase tracking-[0.32em] text-amber-100/70">Result</p>
                <p className="mt-3 text-5xl text-amber-50">{outcome?.value ?? "--"}</p>
                <p className="mt-4 text-sm leading-6 text-stone-300/82">
                  {phase === "finished"
                    ? "The run is over. Save it to the local leaderboard or jump straight back in."
                    : phase === "running"
                      ? "No verdict yet. Keep clicking."
                      : phase === "resolving"
                        ? "The d12 is rolling now."
                        : "The chamber waits for the opening shot."}
                </p>
              </div>

              {phase === "finished" ? (
                <div className="rounded-[1.8rem] border border-amber-100/14 bg-[linear-gradient(180deg,rgba(41,26,6,0.42),rgba(0,0,0,0.9))] p-5">
                  <p className="font-curse text-[0.64rem] uppercase tracking-[0.32em] text-amber-100/72">Leaderboard option</p>
                  <div className="mt-4 flex gap-3">
                    <input
                      className="min-w-0 flex-1 rounded-full border border-white/12 bg-black/34 px-4 py-2.5 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-100/30"
                      maxLength={18}
                      onChange={(event) => {
                        setPlayerName(event.target.value);
                      }}
                      placeholder="Name or initials"
                      value={playerName}
                    />
                    <button
                      className="rounded-full border border-amber-100/18 bg-amber-100/8 px-4 py-2 text-[0.68rem] uppercase tracking-[0.28em] text-amber-50 transition hover:border-amber-100/30 hover:bg-amber-100/12 disabled:cursor-not-allowed disabled:opacity-45"
                      disabled={scoreSaved}
                      onClick={saveScore}
                      type="button"
                    >
                      {scoreSaved ? "Saved" : "Save"}
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      className="rounded-full border border-white/12 bg-white/6 px-4 py-2 text-[0.68rem] uppercase tracking-[0.28em] text-stone-100 transition hover:border-white/24 hover:bg-white/10"
                      onClick={() => {
                        setShowLeaderboard(true);
                      }}
                      type="button"
                    >
                      View leaderboard
                    </button>
                    <button
                      className="rounded-full border border-white/12 bg-white/6 px-4 py-2 text-[0.68rem] uppercase tracking-[0.28em] text-stone-100 transition hover:border-white/24 hover:bg-white/10"
                      onClick={startRun}
                      type="button"
                    >
                      Aim again
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="rounded-full border border-amber-100/18 bg-amber-100/8 px-6 py-3 text-sm uppercase tracking-[0.24em] text-amber-50 transition hover:border-amber-100/30 hover:bg-amber-100/12 disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={phase === "running" || phase === "resolving"}
                  onClick={startRun}
                  type="button"
                >
                  {phase === "idle" ? "Start aim test" : "Run it again"}
                </button>
              )}

              <div className="rounded-[1.5rem] border border-white/10 bg-black/22 px-4 py-4 text-sm leading-6 text-stone-400">
                Local board stores the top {LEADERBOARD_LIMIT} scores in this browser only.
              </div>
            </div>
          </div>
        </div>

        {showLeaderboard ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/76 px-4">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-xl rounded-[2rem] border border-amber-100/16 bg-[linear-gradient(180deg,rgba(26,17,8,0.96),rgba(0,0,0,1))] p-6 shadow-[0_30px_120px_-40px_rgba(251,191,36,0.22)] sm:p-7"
              initial={{ opacity: 0, y: 18 }}
              transition={{ duration: 0.22 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-curse text-[0.66rem] uppercase tracking-[0.34em] text-amber-100/74">
                    D12 leaderboard
                  </p>
                  <h2 className="mt-3 text-2xl text-stone-50 sm:text-3xl">Best bubble runs</h2>
                  <p className="mt-3 text-sm leading-6 text-stone-300/80">
                    Ranked by bubbles popped. Ties go to the more recent run.
                  </p>
                </div>

                <button
                  className="rounded-full border border-white/12 bg-white/6 px-4 py-2 text-[0.68rem] uppercase tracking-[0.28em] text-stone-200 transition hover:border-white/24 hover:bg-white/10"
                  onClick={() => {
                    setShowLeaderboard(false);
                  }}
                  type="button"
                >
                  Close
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {leaderboard.length ? (
                  leaderboard.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-[1.4rem] border border-white/10 bg-black/26 px-4 py-3"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-100/16 bg-amber-100/8 text-sm text-amber-50">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm uppercase tracking-[0.22em] text-stone-100">{entry.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.22em] text-stone-500">
                          {new Date(entry.playedAt).toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg text-stone-50">{entry.score}</p>
                        <p className="text-[0.6rem] uppercase tracking-[0.24em] text-stone-500">pops</p>
                      </div>
                      <div className="rounded-full border border-amber-100/14 bg-amber-100/8 px-3 py-1 text-[0.62rem] uppercase tracking-[0.24em] text-amber-50">
                        d12 {entry.outcome}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/24 px-5 py-6 text-center text-sm leading-6 text-stone-400">
                    No saved runs yet. Finish the chamber, save a score, and the board will start behaving like a board.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        ) : null}
      </section>
    </FullscreenRoom>
  );
}
