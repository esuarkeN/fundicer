import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { DecryptText } from "@/components/DecryptText";
import { FullscreenRoom } from "@/components/FullscreenRoom";
import { DICE_BY_ID } from "@/data/dice";
import { getFakeOutValue, pick, randomBetween, rollDie, shouldFakeOut, type RollOutcome } from "@/utils/rolls";

const die = DICE_BY_ID.d10;

const LOCK_LINES = {
  low: ["The engine locks in with a look of mechanical disappointment.", "Machine result accepted. Enthusiasm not included."],
  mid: ["A stable reading. The engine hates how normal this feels.", "Decimal integrity preserved. Barely theatrical."],
  high: ["The machine hums like it expected applause.", "A strong reading and an even stronger ego."],
  crit: ["Perfect decimal smugness achieved.", "The terminal emits the digital equivalent of a victory cape."],
} satisfies Record<RollOutcome["tier"], readonly string[]>;

const DEFAULT_LINES = [
  "decimal engine asleep",
  "awaiting a dramatic misuse of machinery",
];

function makeNoise() {
  const glyphs = "#$%&<>!?/\\=+";
  return Array.from({ length: 2 }, () => glyphs[randomBetween(0, glyphs.length - 1)]).join("");
}

export function D10Room() {
  const [outcome, setOutcome] = useState<RollOutcome | null>(null);
  const [displayValue, setDisplayValue] = useState("--");
  const [status, setStatus] = useState("idle");
  const [command, setCommand] = useState("ROLL");
  const [lines, setLines] = useState<string[]>(DEFAULT_LINES);
  const [history, setHistory] = useState<string[]>(DEFAULT_LINES);
  const [historyCount, setHistoryCount] = useState(0);
  const [lastFakeOutAt, setLastFakeOutAt] = useState(-10);
  const [busy, setBusy] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current = [];
    };
  }, []);

  function queue(callback: () => void, delay: number) {
    timers.current.push(window.setTimeout(callback, delay));
  }

  function runEngine() {
    if (busy) {
      return;
    }

    const trimmedCommand = command.trim();
    if (!trimmedCommand) {
      setHistory((current) => [">_", "enter a command to wake the terminal", ...current].slice(0, 8));
      return;
    }

    const next = rollDie("d10");
    const willFake = shouldFakeOut({
      historyCount,
      lastFakeOutAt,
      minimumRolls: 4,
      cooldown: 6,
      chance: 0.14,
    });

    setBusy(true);
    setStatus("booting");
    setOutcome(null);
    setDisplayValue("..");
    setHistory((current) => [`> ${trimmedCommand}`, "command accepted", ...current].slice(0, 8));
    setLines([
      `boot sequence for "${trimmedCommand.toUpperCase()}"`,
      "clearing out last round's unnecessary confidence",
    ]);

    for (let step = 0; step < 6; step += 1) {
      queue(() => {
        setDisplayValue(`${makeNoise()}${randomBetween(0, 9)}`);
        setLines((current) => [`checksum ${randomBetween(10, 99)} unstable`, ...current].slice(0, 5));
      }, step * 110);
    }

    queue(() => {
      setStatus("decrypting");
      setLines((current) => [`terminal parsing ${trimmedCommand.toLowerCase()}`, "result spool engaged", ...current].slice(0, 5));
    }, 420);

    if (willFake) {
      queue(() => {
        setDisplayValue(String(getFakeOutValue(next.value, next.max)).padStart(2, "0"));
        setLines((current) => ["premature celebration flagged and mocked", ...current].slice(0, 5));
      }, 780);
    }

    queue(() => {
      setDisplayValue(String(next.value).padStart(2, "0"));
      setStatus("locked");
      setOutcome(next);
      setLines((current) => [pick(LOCK_LINES[next.tier]), ...current].slice(0, 5));
      setBusy(false);
      setHistoryCount((current) => current + 1);
      if (willFake) {
        setLastFakeOutAt(historyCount);
      }
    }, willFake ? 1240 : 980);
  }

  return (
    <FullscreenRoom die={die} contentClassName="overflow-hidden">
      <section className="relative flex min-h-0 flex-1 overflow-hidden bg-[linear-gradient(180deg,rgba(3,10,6,1),rgba(0,0,0,1))] px-4 py-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(163,230,53,0.08),transparent_22rem),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_22%,transparent_78%,rgba(255,255,255,0.02))]" />

        <div className="relative grid min-h-0 flex-1 gap-4 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="flex min-h-[24rem] flex-col rounded-[2rem] border border-lime-100/12 bg-[linear-gradient(180deg,rgba(4,15,9,0.9),rgba(4,5,5,0.98))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-curse text-[0.66rem] uppercase tracking-[0.34em] text-lime-100/74">Decimal engine</p>
                <DecryptText
                  active={busy}
                  className="mt-3 block text-sm uppercase tracking-[0.28em] text-lime-100/86"
                  text={status}
                />
              </div>
              <div className="rounded-full border border-lime-100/12 bg-lime-100/6 px-3 py-1.5 text-[0.66rem] uppercase tracking-[0.26em] text-lime-100/76">
                {outcome ? `Locked ${outcome.value}` : "d10 terminal"}
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center py-8">
              <motion.div
                animate={{
                  boxShadow: busy
                    ? "0 0 0 1px rgba(163,230,53,0.14), 0 0 40px rgba(163,230,53,0.12)"
                    : "0 0 0 1px rgba(163,230,53,0.06)",
                }}
                className="w-full max-w-xl rounded-[1.8rem] border border-lime-100/12 bg-[#020504] p-6 text-center"
                transition={{ duration: 0.2 }}
              >
                <p className="font-curse text-[0.62rem] uppercase tracking-[0.3em] text-lime-100/62">Locked value</p>
                <motion.p
                  animate={{ opacity: 1 }}
                  className="mt-6 font-curse text-6xl tracking-[0.22em] text-lime-100 sm:text-8xl"
                  key={`${displayValue}-${status}`}
                  initial={{ opacity: 0.4 }}
                  transition={{ duration: 0.14 }}
                >
                  {displayValue}
                </motion.p>
              </motion.div>
            </div>

            <div className="mt-auto space-y-3">
              <p className="max-w-2xl text-sm leading-6 text-stone-300/82">
                Boot the terminal, submit a fake command, and wait for the d10 to stop lying in green text.
              </p>

              <div className="rounded-[1.6rem] border border-lime-100/10 bg-black/20 p-4">
                <label className="font-curse text-[0.64rem] uppercase tracking-[0.28em] text-lime-100/72" htmlFor="d10-command">
                  Terminal input
                </label>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <div className="flex flex-1 items-center rounded-[1.2rem] border border-lime-100/12 bg-black/30 px-4 py-3 font-curse text-sm tracking-[0.22em] text-lime-100/82">
                    <span className="mr-3 text-lime-100/48">&gt;</span>
                    <input
                      id="d10-command"
                      className="w-full bg-transparent outline-none placeholder:text-lime-100/28"
                      disabled={busy}
                      onChange={(event) => {
                        setCommand(event.target.value);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          runEngine();
                        }
                      }}
                      placeholder="ROLL"
                      value={command}
                    />
                  </div>
                  <button
                    className="rounded-full border border-lime-100/16 bg-lime-100/8 px-5 py-3 font-curse text-sm uppercase tracking-[0.28em] text-lime-100 transition hover:border-lime-100/26 hover:bg-lime-100/12 disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={busy}
                    onClick={runEngine}
                    type="button"
                  >
                    {busy ? "Processing" : "Execute"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-col gap-4">
            <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,12,0.9),rgba(0,0,0,0.98))] p-5 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.6)]">
              <p className="font-curse text-[0.66rem] uppercase tracking-[0.32em] text-stone-300/72">Machine state</p>
              <p className="mt-4 text-sm leading-6 text-stone-300/84">
                {busy
                  ? "The engine is performing certainty very loudly."
                  : "Idle, humming, and pretending it is too advanced for ordinary numbers."}
              </p>
            </div>

            <div className="soft-scrollbar min-h-0 flex-1 overflow-auto rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,10,10,0.92),rgba(0,0,0,0.98))] p-5 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.6)]">
              <p className="font-curse text-[0.66rem] uppercase tracking-[0.34em] text-stone-300/72">Console spill</p>
              <div className="mt-4 space-y-3">
                {history.map((line, index) => (
                  <motion.div
                    key={`${line}-${index}`}
                    animate={{ opacity: 1, x: 0 }}
                    className={`rounded-[1.2rem] border px-3 py-3 font-curse text-xs uppercase tracking-[0.24em] ${
                      line.startsWith("> ")
                        ? "border-lime-100/12 bg-lime-100/8 text-lime-50"
                        : "border-white/8 bg-black/18 text-lime-100/76"
                    }`}
                    initial={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.18, delay: index * 0.03 }}
                  >
                    {line}
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,12,0.9),rgba(0,0,0,0.98))] p-5 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.6)]">
              <p className="font-curse text-[0.66rem] uppercase tracking-[0.32em] text-stone-300/72">Live feed</p>
              <div className="mt-4 space-y-3">
                {lines.map((line, index) => (
                  <motion.div
                    key={`${line}-${index}`}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-[1.2rem] border border-white/8 bg-black/18 px-3 py-3 font-curse text-xs uppercase tracking-[0.24em] text-lime-100/76"
                    initial={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.18, delay: index * 0.03 }}
                  >
                    {line}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </FullscreenRoom>
  );
}
