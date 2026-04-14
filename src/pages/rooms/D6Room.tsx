import { useRef, useState } from "react";
import { Link } from "react-router-dom";

type Phase = "intro" | "search";
type D6Result = 1 | 2 | 3 | 4 | 5 | 6;
type ScreenPosition = {
  x: number;
  y: number;
};

const TARGET_PADDING = 14;
const REVEAL_DISTANCE = 220;
const CLICK_DISTANCE = 120;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function rollD6(): D6Result {
  return (Math.floor(Math.random() * 6) + 1) as D6Result;
}

function randomTargetPosition(): ScreenPosition {
  return {
    x: TARGET_PADDING + Math.random() * (100 - TARGET_PADDING * 2),
    y: TARGET_PADDING + Math.random() * (100 - TARGET_PADDING * 2),
  };
}

export function D6Room() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [phase, setPhase] = useState<Phase>("intro");
  const [result, setResult] = useState<D6Result | null>(null);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [targetPosition, setTargetPosition] = useState<ScreenPosition>({ x: 50, y: 50 });
  const [mousePosition, setMousePosition] = useState<ScreenPosition>({ x: 50, y: 50 });

  function updateMousePosition(clientX: number, clientY: number) {
    const bounds = containerRef.current?.getBoundingClientRect();

    if (!bounds) {
      return;
    }

    setMousePosition({
      x: clamp(((clientX - bounds.left) / bounds.width) * 100, 0, 100),
      y: clamp(((clientY - bounds.top) / bounds.height) * 100, 0, 100),
    });
  }

  function startRoll(nextMousePosition?: ScreenPosition) {
    setResult(rollD6());
    setShowResultPopup(false);
    setTargetPosition(randomTargetPosition());
    setMousePosition(nextMousePosition ?? mousePosition);
    setPhase("search");
  }

  const bounds = containerRef.current?.getBoundingClientRect();

  const distanceToTarget = bounds
    ? Math.hypot(
        ((mousePosition.x - targetPosition.x) / 100) * bounds.width,
        ((mousePosition.y - targetPosition.y) / 100) * bounds.height,
      )
    : Number.POSITIVE_INFINITY;

  const reveal = clamp(1 - distanceToTarget / REVEAL_DISTANCE, 0, 1);
  const canClickResult = distanceToTarget <= CLICK_DISTANCE;
  const resultOpacity = phase === "search" ? 0.015 + reveal * 0.985 : 0;
  const resultScale = 0.92 + reveal * 0.18;

  return (
    <main className="min-h-screen bg-black text-stone-100">
      <div
        ref={containerRef}
        className={`relative min-h-screen overflow-hidden bg-black ${phase === "search" ? "cursor-none" : ""}`}
        onPointerDown={(event) => {
          updateMousePosition(event.clientX, event.clientY);
        }}
        onPointerEnter={(event) => {
          updateMousePosition(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          updateMousePosition(event.clientX, event.clientY);
        }}
      >
        <div className="absolute inset-0 bg-black" />

        {phase === "search" && result ? (
          <>
            <button
              aria-label={`Result ${result}. Click to reveal the result popup.`}
              className="absolute z-10 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/6 text-[clamp(2.5rem,7vw,4.5rem)] font-semibold leading-none text-stone-50 transition-[opacity,transform,box-shadow,filter] duration-150 ease-out disabled:pointer-events-none"
              disabled={!canClickResult || showResultPopup}
              onClick={(event) => {
                event.stopPropagation();
                setShowResultPopup(true);
              }}
              style={{
                left: `${targetPosition.x}%`,
                top: `${targetPosition.y}%`,
                opacity: resultOpacity,
                transform: `translate(-50%, -50%) scale(${resultScale})`,
                filter: `blur(${(1 - reveal) * 10}px)`,
                boxShadow: `0 0 ${18 + reveal * 56}px rgba(255, 255, 255, ${0.04 + reveal * 0.34})`,
                background: `radial-gradient(circle, rgba(255,255,255,${0.08 + reveal * 0.12}) 0%, rgba(255,255,255,${0.02 + reveal * 0.08}) 58%, rgba(255,255,255,0) 100%)`,
                textShadow: `0 0 ${10 + reveal * 18}px rgba(255, 255, 255, ${0.1 + reveal * 0.45})`,
              }}
              type="button"
            >
              {result}
            </button>

            <div
              className="pointer-events-none absolute inset-0 z-20"
              style={{
                background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, transparent 0px, rgba(0,0,0,0.15) 80px, rgba(0,0,0,0.92) 180px, rgba(0,0,0,1) 280px)`,
              }}
            />

            <div
              className="pointer-events-none absolute z-30 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${mousePosition.x}%`,
                top: `${mousePosition.y}%`,
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(196,229,255,0.12) 34%, rgba(255,255,255,0.04) 54%, rgba(255,255,255,0) 76%)",
                filter: "blur(20px)",
              }}
            />

            <Link
              className="absolute left-4 top-4 z-40 rounded-full border border-white/14 bg-black/50 px-3 py-2 text-[0.62rem] uppercase tracking-[0.28em] text-stone-200 transition hover:border-white/28 hover:bg-black/72 sm:left-6 sm:top-6"
              to="/"
            >
              Back to overview
            </Link>

            {showResultPopup ? (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/72 px-4">
                <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,10,12,0.96),rgba(0,0,0,1))] p-7 text-center shadow-[0_24px_80px_rgba(0,0,0,0.72)]">
                  <p className="text-[0.68rem] uppercase tracking-[0.34em] text-stone-500">Result found</p>
                  <p className="mt-5 text-6xl text-stone-50">{result}</p>
                  <p className="mt-4 text-sm leading-6 text-stone-400">
                    The dark finally admitted it. Use this result, then start the next search when you are ready.
                  </p>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <button
                      className="flex-1 rounded-full border border-white/18 bg-white/8 px-5 py-3 text-sm uppercase tracking-[0.24em] text-stone-100 transition hover:border-white/30 hover:bg-white/14"
                      onClick={() => {
                        startRoll();
                      }}
                      type="button"
                    >
                      Roll again
                    </button>

                    <Link
                      className="rounded-full border border-white/14 px-5 py-3 text-sm uppercase tracking-[0.24em] text-stone-300 transition hover:border-white/26 hover:bg-white/6"
                      to="/"
                    >
                      Overview
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {phase === "intro" ? (
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-black/88 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur">
              <p className="text-[0.68rem] uppercase tracking-[0.36em] text-stone-500">D6 dark room</p>
              <h1 className="mt-4 text-2xl font-semibold text-stone-100">Find the result in the dark.</h1>
              <p className="mt-4 text-sm leading-6 text-stone-400">
                Roll the die, sweep the page with the spotlight, and click the revealed number to start the next roll.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  className="flex-1 rounded-full border border-white/18 bg-white/8 px-5 py-3 text-sm uppercase tracking-[0.24em] text-stone-100 transition hover:border-white/30 hover:bg-white/14"
                  onClick={() => {
                    startRoll({ x: 50, y: 50 });
                  }}
                  type="button"
                >
                  Roll d6
                </button>

                <Link
                  className="rounded-full border border-white/14 px-5 py-3 text-sm uppercase tracking-[0.24em] text-stone-300 transition hover:border-white/26 hover:bg-white/6"
                  to="/"
                >
                  Back to overview
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
