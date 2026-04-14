import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "react-router-dom";
import { FullscreenRoom } from "@/components/FullscreenRoom";
import { RoomMessageBox } from "@/components/RoomMessageBox";
import { DICE_BY_ID } from "@/data/dice";
import type { PuzzleImageConfig, PuzzleNode, PuzzleTheme } from "@/features/fundicer/fundicerTypes";
import { useFundicerPuzzle } from "@/features/fundicer/useFundicerPuzzle";

type FundicerPuzzleRoomProps = {
  puzzle: PuzzleImageConfig;
  puzzles: readonly PuzzleImageConfig[];
};

type PointerPosition = {
  x: number;
  y: number;
};

type ThemeStyles = {
  tone: "cyan" | "indigo" | "amber" | "emerald";
  backgroundClassName: string;
  accentTextClassName: string;
  accentChipClassName: string;
  subtleChipClassName: string;
  primaryButtonClassName: string;
  secondaryButtonClassName: string;
  selectorActiveClassName: string;
  selectorIdleClassName: string;
  ambientClassName: string;
  completeStroke: string;
  completeGlow: string;
  activeStroke: string;
  activeGlow: string;
  guideStroke: string;
  previewStroke: string;
  pointerShadow: string;
  imageOverlayClassName: string;
};

const die = DICE_BY_ID.d20;

const AMBIENT_MOTES = Array.from({ length: 34 }, (_, index) => ({
  x: 4 + ((index * 19) % 90),
  y: 6 + ((index * 13) % 80),
  size: index % 5 === 0 ? 3.5 : index % 3 === 0 ? 2.5 : 1.8,
  delay: index * 0.12,
  duration: 2.8 + (index % 6) * 0.34,
  glow: index % 4 === 0 ? 0.58 : 0.34,
}));

const THEMES: Record<PuzzleTheme, ThemeStyles> = {
  indigo: {
    tone: "indigo",
    backgroundClassName:
      "bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.24),transparent_24%),radial-gradient(circle_at_80%_16%,rgba(56,189,248,0.12),transparent_20%),linear-gradient(180deg,rgba(8,10,28,1),rgba(0,0,0,1))]",
    accentTextClassName: "text-indigo-100/76",
    accentChipClassName: "border-indigo-100/16 bg-indigo-100/10 text-indigo-50/86",
    subtleChipClassName: "border-white/12 bg-black/24 text-stone-200/82",
    primaryButtonClassName:
      "border-indigo-100/24 bg-indigo-100/12 text-indigo-50 hover:border-indigo-100/40 hover:bg-indigo-100/16",
    secondaryButtonClassName:
      "border-white/12 bg-black/24 text-stone-200 hover:border-white/24 hover:bg-white/6",
    selectorActiveClassName: "border-indigo-100/28 bg-indigo-100/12",
    selectorIdleClassName: "border-white/10 bg-black/18 hover:border-white/20 hover:bg-white/6",
    ambientClassName: "bg-indigo-50 shadow-[0_0_18px_rgba(196,181,253,0.55)]",
    completeStroke: "rgba(196,181,253,0.96)",
    completeGlow: "rgba(196,181,253,0.36)",
    activeStroke: "rgba(224,231,255,0.98)",
    activeGlow: "rgba(196,181,253,0.72)",
    guideStroke: "rgba(196,181,253,0.44)",
    previewStroke: "rgba(224,231,255,0.72)",
    pointerShadow: "shadow-[0_0_26px_rgba(196,181,253,0.55)]",
    imageOverlayClassName:
      "bg-[radial-gradient(circle_at_top,rgba(196,181,253,0.16),transparent_30%),linear-gradient(180deg,rgba(8,9,18,0.08),rgba(3,4,10,0.36))]",
  },
  ember: {
    tone: "amber",
    backgroundClassName:
      "bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.2),transparent_24%),radial-gradient(circle_at_82%_14%,rgba(249,115,22,0.12),transparent_18%),linear-gradient(180deg,rgba(24,11,6,1),rgba(0,0,0,1))]",
    accentTextClassName: "text-amber-100/78",
    accentChipClassName: "border-amber-100/16 bg-amber-100/10 text-amber-50/86",
    subtleChipClassName: "border-white/12 bg-black/24 text-stone-200/82",
    primaryButtonClassName:
      "border-amber-100/24 bg-amber-100/12 text-amber-50 hover:border-amber-100/40 hover:bg-amber-100/18",
    secondaryButtonClassName:
      "border-white/12 bg-black/24 text-stone-200 hover:border-white/24 hover:bg-white/6",
    selectorActiveClassName: "border-amber-100/28 bg-amber-100/12",
    selectorIdleClassName: "border-white/10 bg-black/18 hover:border-white/20 hover:bg-white/6",
    ambientClassName: "bg-amber-50 shadow-[0_0_18px_rgba(251,191,36,0.48)]",
    completeStroke: "rgba(253,230,138,0.98)",
    completeGlow: "rgba(251,191,36,0.34)",
    activeStroke: "rgba(255,247,214,0.98)",
    activeGlow: "rgba(251,191,36,0.68)",
    guideStroke: "rgba(251,191,36,0.42)",
    previewStroke: "rgba(255,244,214,0.72)",
    pointerShadow: "shadow-[0_0_26px_rgba(251,191,36,0.45)]",
    imageOverlayClassName:
      "bg-[radial-gradient(circle_at_top,rgba(253,230,138,0.14),transparent_28%),linear-gradient(180deg,rgba(24,11,6,0.08),rgba(18,8,2,0.32))]",
  },
  forest: {
    tone: "emerald",
    backgroundClassName:
      "bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_24%),radial-gradient(circle_at_85%_14%,rgba(34,197,94,0.1),transparent_18%),linear-gradient(180deg,rgba(6,18,12,1),rgba(0,0,0,1))]",
    accentTextClassName: "text-emerald-100/78",
    accentChipClassName: "border-emerald-100/16 bg-emerald-100/10 text-emerald-50/86",
    subtleChipClassName: "border-white/12 bg-black/24 text-stone-200/82",
    primaryButtonClassName:
      "border-emerald-100/24 bg-emerald-100/12 text-emerald-50 hover:border-emerald-100/40 hover:bg-emerald-100/18",
    secondaryButtonClassName:
      "border-white/12 bg-black/24 text-stone-200 hover:border-white/24 hover:bg-white/6",
    selectorActiveClassName: "border-emerald-100/28 bg-emerald-100/12",
    selectorIdleClassName: "border-white/10 bg-black/18 hover:border-white/20 hover:bg-white/6",
    ambientClassName: "bg-emerald-50 shadow-[0_0_18px_rgba(52,211,153,0.42)]",
    completeStroke: "rgba(167,243,208,0.96)",
    completeGlow: "rgba(52,211,153,0.32)",
    activeStroke: "rgba(236,253,245,0.98)",
    activeGlow: "rgba(52,211,153,0.62)",
    guideStroke: "rgba(52,211,153,0.4)",
    previewStroke: "rgba(236,253,245,0.72)",
    pointerShadow: "shadow-[0_0_26px_rgba(52,211,153,0.4)]",
    imageOverlayClassName:
      "bg-[radial-gradient(circle_at_top,rgba(167,243,208,0.14),transparent_30%),linear-gradient(180deg,rgba(6,18,12,0.08),rgba(1,7,3,0.34))]",
  },
  arcane: {
    tone: "cyan",
    backgroundClassName:
      "bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_24%),radial-gradient(circle_at_84%_14%,rgba(99,102,241,0.1),transparent_18%),linear-gradient(180deg,rgba(5,16,24,1),rgba(0,0,0,1))]",
    accentTextClassName: "text-cyan-100/78",
    accentChipClassName: "border-cyan-100/16 bg-cyan-100/10 text-cyan-50/86",
    subtleChipClassName: "border-white/12 bg-black/24 text-stone-200/82",
    primaryButtonClassName:
      "border-cyan-100/24 bg-cyan-100/12 text-cyan-50 hover:border-cyan-100/40 hover:bg-cyan-100/18",
    secondaryButtonClassName:
      "border-white/12 bg-black/24 text-stone-200 hover:border-white/24 hover:bg-white/6",
    selectorActiveClassName: "border-cyan-100/28 bg-cyan-100/12",
    selectorIdleClassName: "border-white/10 bg-black/18 hover:border-white/20 hover:bg-white/6",
    ambientClassName: "bg-cyan-50 shadow-[0_0_18px_rgba(34,211,238,0.42)]",
    completeStroke: "rgba(165,243,252,0.96)",
    completeGlow: "rgba(34,211,238,0.3)",
    activeStroke: "rgba(236,254,255,0.98)",
    activeGlow: "rgba(34,211,238,0.6)",
    guideStroke: "rgba(34,211,238,0.38)",
    previewStroke: "rgba(236,254,255,0.72)",
    pointerShadow: "shadow-[0_0_26px_rgba(34,211,238,0.4)]",
    imageOverlayClassName:
      "bg-[radial-gradient(circle_at_top,rgba(165,243,252,0.14),transparent_30%),linear-gradient(180deg,rgba(5,16,24,0.08),rgba(2,8,11,0.34))]",
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildNodeLookup(nodes: readonly PuzzleNode[]) {
  const lookup: Record<string, PuzzleNode> = {};

  nodes.forEach((node) => {
    lookup[node.id] = node;
  });

  return lookup;
}

function buildPath(nodeIds: readonly string[], nodeLookup: Record<string, PuzzleNode>) {
  return nodeIds
    .map((nodeId, index) => {
      const node = nodeLookup[nodeId];
      return `${index === 0 ? "M" : "L"} ${node.x} ${node.y}`;
    })
    .join(" ");
}

function getUniqueNodeIds(segments: PuzzleImageConfig["segments"]) {
  const seen = new Set<string>();
  const nodeIds: string[] = [];

  segments.forEach((segment) => {
    segment.nodeIds.forEach((nodeId) => {
      if (!seen.has(nodeId)) {
        seen.add(nodeId);
        nodeIds.push(nodeId);
      }
    });
  });

  return nodeIds;
}

function getPointerFromEvent(event: ReactPointerEvent<HTMLDivElement>) {
  const bounds = event.currentTarget.getBoundingClientRect();

  return {
    x: clamp(((event.clientX - bounds.left) / bounds.width) * 100, 0, 100),
    y: clamp(((event.clientY - bounds.top) / bounds.height) * 100, 0, 100),
  } satisfies PointerPosition;
}

export function FundicerPuzzleRoom({ puzzle, puzzles }: FundicerPuzzleRoomProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const [pointer, setPointer] = useState<PointerPosition>({ x: 50, y: 50 });
  const [showGallery, setShowGallery] = useState(false);
  const theme = THEMES[puzzle.theme ?? "indigo"];
  const nodeLookup = buildNodeLookup(puzzle.nodes);
  const currentPuzzleIndex = puzzles.findIndex((entry) => entry.id === puzzle.id);
  const nextPuzzle = puzzles[(currentPuzzleIndex + 1) % puzzles.length] ?? puzzle;
  const {
    started,
    prompt,
    guideVisible,
    rolling,
    flashWord,
    teaserValue,
    currentRollValue,
    activeRollValue,
    traceNodeIds,
    completedSegmentIds,
    coins,
    rollHistory,
    puzzleComplete,
    showCompletionNotice,
    activeSegments,
    activeSegment,
    nextExpectedNodeId,
    startPuzzle,
    dismissGuide,
    dismissCompletionNotice,
    resetAttempt,
    clearProgress,
    roll,
    selectNode,
  } = useFundicerPuzzle({ puzzle, reducedMotion });

  const completedSet = new Set(completedSegmentIds);
  const activeNodeIds = getUniqueNodeIds(activeSegments);
  const traceSet = new Set(traceNodeIds);
  const puzzleAspectWidth = puzzle.width ?? 4;
  const puzzleAspectHeight = puzzle.height ?? 3;
  const puzzleAspectRatio = puzzleAspectWidth / puzzleAspectHeight;
  const activeRollTotal = activeRollValue === null ? 0 : puzzle.segments.filter((segment) => segment.rollValue === activeRollValue).length;
  const activeRollCompleted = activeRollTotal - activeSegments.length;
  const completionPercent = Math.round((completedSegmentIds.length / puzzle.segments.length) * 100);
  const nextNodeStep = nextExpectedNodeId && activeSegment ? activeSegment.nodeIds.indexOf(nextExpectedNodeId) + 1 : null;
  const noticeTitle =
    !started
      ? puzzle.title
      : puzzleComplete
        ? `${puzzle.title} complete`
        : activeRollValue !== null
          ? `Roll ${activeRollValue} active`
          : currentRollValue !== null
            ? `Rolled ${currentRollValue}`
            : "Ready for a roll";

  useEffect(() => {
    if (!activeSegment) {
      return;
    }

    const anchorNodeId = traceNodeIds[traceNodeIds.length - 1] ?? activeSegment.nodeIds[0];
    const anchorNode = nodeLookup[anchorNodeId];

    if (anchorNode) {
      setPointer({ x: anchorNode.x, y: anchorNode.y });
    }
  }, [activeSegment, puzzle.id, traceNodeIds]);

  return (
    <FullscreenRoom die={die} contentClassName="overflow-hidden">
      <section className={`relative flex min-h-0 flex-1 overflow-hidden ${theme.backgroundClassName}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_44%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.02)_72%,rgba(255,255,255,0.05)_100%)]" />

        <div className="pointer-events-none absolute inset-0">
          {AMBIENT_MOTES.map((mote, index) => (
            <motion.div
              key={index}
              animate={{ opacity: [0.18, mote.glow, 0.18], scale: [1, 1.22, 1] }}
              className={`absolute rounded-full ${theme.ambientClassName}`}
              style={{
                left: `${mote.x}%`,
                top: `${mote.y}%`,
                width: `${mote.size}px`,
                height: `${mote.size}px`,
              }}
              transition={{
                duration: mote.duration,
                delay: mote.delay,
                ease: "easeInOut",
                repeat: Number.POSITIVE_INFINITY,
              }}
            />
          ))}
        </div>

        {started && guideVisible ? (
          <RoomMessageBox
            description={prompt}
            dismissLabel="Hide"
            kicker="Fundicer note"
            onDismiss={dismissGuide}
            placement="top-left"
            title={noticeTitle}
            tone={theme.tone}
            variant="notice"
          />
        ) : null}

        <div className="absolute right-4 top-4 z-30 flex flex-wrap items-center justify-end gap-3 sm:right-6 sm:top-6">
          {teaserValue ? <div className={`rounded-full border px-4 py-2 text-sm ${theme.accentChipClassName}`}>provisional omen: {teaserValue}</div> : null}
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 p-4 pt-16 sm:p-6 sm:pt-20">

          <div className="room-panel relative min-h-0 flex-1 overflow-hidden rounded-[2rem] p-3 sm:p-4">
            <div className="absolute inset-x-4 top-4 z-20 flex flex-wrap items-center justify-between gap-3">
              <div className={`rounded-full border px-4 py-2 text-[0.62rem] uppercase tracking-[0.28em] ${theme.accentChipClassName}`}>
                {puzzleComplete ? "restoration complete" : activeRollValue !== null ? `roll ${activeRollValue} unlocked` : "roll to reveal a strand"}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <div className={`rounded-full border px-4 py-2 text-[0.62rem] uppercase tracking-[0.28em] ${theme.subtleChipClassName}`}>
                  {completedSegmentIds.length} / {puzzle.segments.length} paths
                </div>
                <div className={`rounded-full border px-4 py-2 text-[0.62rem] uppercase tracking-[0.28em] ${theme.subtleChipClassName}`}>
                  {nextNodeStep !== null ? `next node ${nextNodeStep}` : puzzleComplete ? "all nodes complete" : "awaiting node path"}
                </div>
              </div>
            </div>

            <div className="flex h-full items-center justify-center px-2 pb-16 pt-16 sm:px-4 sm:pb-20 sm:pt-20">
              <div
                className="relative w-full overflow-hidden rounded-[1.8rem] border border-white/10 bg-black/35"
                onPointerDown={(event) => {
                  setPointer(getPointerFromEvent(event));
                }}
                onPointerMove={(event) => {
                  setPointer(getPointerFromEvent(event));
                }}
                style={{
                  aspectRatio: `${puzzleAspectWidth} / ${puzzleAspectHeight}`,
                  maxWidth: `min(100%, calc((100dvh - 18rem) * ${puzzleAspectRatio}))`,
                }}
              >
                <img alt={puzzle.title} className="absolute inset-0 h-full w-full object-cover opacity-72" src={puzzle.imageSrc} />
                <div className={`absolute inset-0 ${theme.imageOverlayClassName}`} />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.34))]" />

                <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                  {puzzle.segments
                    .filter((segment) => completedSet.has(segment.id))
                    .map((segment) => {
                      const d = buildPath(segment.nodeIds, nodeLookup);

                      return (
                        <g key={segment.id} style={{ filter: `drop-shadow(0 0 14px ${theme.completeGlow})` }}>
                          <path d={d} fill="none" opacity="0.42" stroke={theme.completeGlow} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.05" />
                          <motion.path
                            animate={{ opacity: 1, pathLength: 1 }}
                            d={d}
                            fill="none"
                            initial={{ opacity: 0, pathLength: 0 }}
                            stroke={theme.completeStroke}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.1"
                          />
                        </g>
                      );
                    })}


                  {activeSegment && traceNodeIds.length > 1 ? (
                    <path
                      d={buildPath(traceNodeIds, nodeLookup)}
                      fill="none"
                      stroke={theme.activeStroke}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.18"
                      style={{ filter: `drop-shadow(0 0 12px ${theme.activeGlow})` }}
                    />
                  ) : null}

                  {activeSegment && traceNodeIds.length > 0 ? (
                    <line
                      stroke={theme.previewStroke}
                      strokeDasharray="1.5 1.5"
                      strokeLinecap="round"
                      strokeWidth="0.72"
                      x1={nodeLookup[traceNodeIds[traceNodeIds.length - 1]]?.x}
                      x2={pointer.x}
                      y1={nodeLookup[traceNodeIds[traceNodeIds.length - 1]]?.y}
                      y2={pointer.y}
                    />
                  ) : null}
                </svg>

                {activeSegment && !puzzleComplete ? (
                  <motion.div
                    animate={{ opacity: traceNodeIds.length > 0 ? 1 : 0.76, scale: traceNodeIds.length > 0 ? 1.08 : 1 }}
                    className={`pointer-events-none absolute left-0 top-0 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/18 bg-white/18 ${theme.pointerShadow}`}
                    style={{ left: `${pointer.x}%`, top: `${pointer.y}%` }}
                    transition={{ duration: 0.08 }}
                  />
                ) : null}

                <div className="absolute inset-0 z-20">
                  {activeNodeIds.map((nodeId) => {
                    const node = nodeLookup[nodeId];
                    const stepIndex = activeSegment?.nodeIds.indexOf(nodeId) ?? -1;
                    const currentSegmentNode = stepIndex !== -1;
                    const visited = traceSet.has(nodeId);
                    const expected = nextExpectedNodeId === nodeId;

                    return (
                      <motion.button
                        key={nodeId}
                        animate={{
                          opacity: visited ? 1 : expected ? 1 : currentSegmentNode ? 0.9 : 0.68,
                          scale: visited ? 1.14 : expected ? 1.1 : 1,
                        }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border text-xs font-semibold text-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                          currentSegmentNode ? "h-10 w-10 sm:h-11 sm:w-11" : "h-7 w-7"
                        } ${
                          visited
                            ? `${theme.accentChipClassName} shadow-[0_0_20px_rgba(255,255,255,0.12)]`
                            : expected
                              ? `${theme.selectorActiveClassName} shadow-[0_0_20px_rgba(255,255,255,0.14)]`
                              : currentSegmentNode
                                ? "border-white/16 bg-white/10 text-stone-100/90"
                                : "border-white/12 bg-black/30 text-stone-300/82"
                        }`}
                        onClick={() => {
                          setPointer({ x: node.x, y: node.y });
                          selectNode(nodeId);
                        }}
                        onPointerEnter={() => {
                          setPointer({ x: node.x, y: node.y });
                        }}
                        style={{ left: `${node.x}%`, top: `${node.y}%` }}
                        transition={{ duration: 0.18 }}
                        type="button"
                      >
                        <span aria-hidden="true">{currentSegmentNode ? stepIndex + 1 : ""}</span>
                        <span className="sr-only">Trace node {currentSegmentNode ? stepIndex + 1 : nodeId}</span>
                      </motion.button>
                    );
                  })}
                </div>

                {!puzzleComplete && !rolling && activeSegments.length === 0 ? (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
                    <div className="rounded-full border border-white/12 bg-black/42 px-5 py-3 text-center text-[0.68rem] uppercase tracking-[0.28em] text-stone-200/82 backdrop-blur">
                      Roll the d20 to reveal the next numbered strand.
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="absolute inset-x-4 bottom-4 z-20 flex flex-wrap items-center justify-between gap-3">
              <div className={`rounded-full border px-4 py-2 text-[0.62rem] uppercase tracking-[0.28em] ${theme.subtleChipClassName}`}>
                {activeSegment ? activeSegment.label ?? activeSegment.id : puzzleComplete ? "all strands restored" : "no active strand"}
              </div>
              <div className={`rounded-full border px-4 py-2 text-[0.62rem] uppercase tracking-[0.28em] ${theme.accentChipClassName}`}>
                {activeSegment
                  ? `${traceNodeIds.length}/${activeSegment.nodeIds.length} nodes traced`
                  : puzzleComplete
                    ? "whole image complete"
                    : "waiting for a roll"}
              </div>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
            <div className="room-panel rounded-[1.8rem] p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={`font-curse text-[0.64rem] uppercase tracking-[0.32em] ${theme.accentTextClassName}`}>Fundicer archive</p>
                  <h2 className="mt-2 text-xl text-stone-50 sm:text-2xl">{puzzle.title}</h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className={`rounded-full border px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.28em] ${theme.accentChipClassName}`}>
                    {completedSegmentIds.length}/{puzzle.segments.length} restored
                  </div>
                  <div className={`rounded-full border px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.28em] ${theme.subtleChipClassName}`}>
                    {coins} coins
                  </div>
                  <div className={`rounded-full border px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.28em] ${theme.subtleChipClassName}`}>
                    {currentRollValue !== null ? `last roll ${currentRollValue}` : "waiting for roll"}
                  </div>
                  <div className={`rounded-full border px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.28em] ${theme.subtleChipClassName}`}>
                    {activeRollValue !== null ? `active group ${activeRollValue}` : puzzleComplete ? "image finished" : "no group active"}
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-stone-300/82">{prompt}</p>

              {activeRollValue !== null ? (
                <div className="mt-4 rounded-[1.2rem] border border-white/10 bg-black/24 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className={`text-[0.64rem] uppercase tracking-[0.28em] ${theme.accentTextClassName}`}>
                      Roll {activeRollValue}: {activeRollCompleted}/{activeRollTotal} complete
                    </p>
                    <p className="text-[0.64rem] uppercase tracking-[0.28em] text-stone-400">
                      {completionPercent}% whole image restored
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {puzzle.segments
                      .filter((segment) => segment.rollValue === activeRollValue)
                      .map((segment) => {
                        const finished = completedSet.has(segment.id);
                        const current = segment.id === activeSegment?.id;

                        return (
                          <div
                            key={segment.id}
                            className={`rounded-full border px-3 py-2 text-sm ${
                              finished
                                ? theme.accentChipClassName
                                : current
                                  ? `${theme.selectorActiveClassName} text-stone-50`
                                  : "border-white/10 bg-black/18 text-stone-300/76"
                            }`}
                          >
                            {segment.label ?? segment.id}
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3 xl:flex-col xl:justify-center">
              <button
                className={`rounded-full border px-5 py-3 text-sm uppercase tracking-[0.24em] transition disabled:cursor-not-allowed disabled:opacity-60 ${theme.primaryButtonClassName}`}
                disabled={rolling || !started}
                onClick={roll}
                type="button"
              >
                {rolling ? "Rolling..." : "Roll d20"}
              </button>

              {started ? (
                <>
                  <button
                    className={`rounded-full border px-5 py-3 text-sm uppercase tracking-[0.24em] transition ${theme.secondaryButtonClassName}`}
                    onClick={() => {
                      setShowGallery(true);
                    }}
                    type="button"
                  >
                    Open gallery
                  </button>
                  <button
                    className={`rounded-full border px-5 py-3 text-sm uppercase tracking-[0.24em] transition ${theme.secondaryButtonClassName}`}
                    onClick={() => {
                      resetAttempt("The current strand loosens and asks you to try again.");
                    }}
                    type="button"
                  >
                    Reset attempt
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {started && showGallery ? (
            <motion.div
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-40 bg-black/78 p-4 sm:p-6"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
            >
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="room-panel soft-scrollbar mx-auto flex max-h-full w-full max-w-6xl flex-col overflow-auto rounded-[2rem] p-5 sm:p-6"
                initial={{ opacity: 0, y: 18 }}
                transition={{ duration: 0.22 }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className={`font-curse text-[0.66rem] uppercase tracking-[0.34em] ${theme.accentTextClassName}`}>Fundicer gallery</p>
                    <h2 className="mt-3 text-2xl text-stone-50 sm:text-3xl">{puzzle.title}</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-300/82">{puzzle.description}</p>
                  </div>

                  <button
                    className={`rounded-full border px-4 py-2 text-[0.64rem] uppercase tracking-[0.28em] transition ${theme.secondaryButtonClassName}`}
                    onClick={() => {
                      setShowGallery(false);
                    }}
                    type="button"
                  >
                    Close gallery
                  </button>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
                  <div>
                    <div className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-black/24">
                      <div className="grid gap-0 lg:grid-cols-[18rem_minmax(0,1fr)]">
                        <div className="relative h-full min-h-[14rem] overflow-hidden border-b border-white/10 lg:border-b-0 lg:border-r">
                          <img alt={puzzle.title} className="h-full w-full object-cover" src={puzzle.thumbnailSrc ?? puzzle.imageSrc} />
                          <div className={`absolute inset-0 ${theme.imageOverlayClassName}`} />
                        </div>

                        <div className="p-5 sm:p-6">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className={`rounded-[1.35rem] border p-4 ${theme.accentChipClassName}`}>
                              <p className="text-[0.62rem] uppercase tracking-[0.28em] opacity-70">Progress</p>
                              <p className="mt-3 text-2xl text-stone-50">{completedSegmentIds.length}/{puzzle.segments.length}</p>
                              <p className="mt-1 text-xs opacity-80">{completionPercent}% restored</p>
                            </div>
                            <div className={`rounded-[1.35rem] border p-4 ${theme.subtleChipClassName}`}>
                              <p className="text-[0.62rem] uppercase tracking-[0.28em] text-stone-400">Coins</p>
                              <p className="mt-3 text-2xl text-stone-50">{coins}</p>
                              <p className="mt-1 text-xs text-stone-400">earned on this plate</p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <div className={`rounded-full border px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.28em] ${theme.accentChipClassName}`}>
                              {currentRollValue !== null ? `last roll ${currentRollValue}` : "waiting for roll"}
                            </div>
                            <div className={`rounded-full border px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.28em] ${theme.subtleChipClassName}`}>
                              {activeRollValue !== null ? `active group ${activeRollValue}` : puzzleComplete ? "image finished" : "no group active"}
                            </div>
                          </div>

                          <p className="mt-4 text-sm leading-6 text-stone-300/82">{prompt}</p>

                          <div className="mt-5 flex flex-wrap gap-3">
                            <button
                              className={`rounded-full border px-5 py-3 text-sm uppercase tracking-[0.24em] transition ${theme.secondaryButtonClassName}`}
                              onClick={clearProgress}
                              type="button"
                            >
                              Clear saved progress
                            </button>
                            <button
                              className={`rounded-full border px-5 py-3 text-sm uppercase tracking-[0.24em] transition ${theme.secondaryButtonClassName}`}
                              onClick={() => {
                                setShowGallery(false);
                              }}
                              type="button"
                            >
                              Back to canvas
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {activeRollValue !== null ? (
                      <div className="mt-6 rounded-[1.45rem] border border-white/10 bg-black/24 p-4">
                        <p className={`text-[0.64rem] uppercase tracking-[0.28em] ${theme.accentTextClassName}`}>
                          Roll {activeRollValue}: {activeRollCompleted}/{activeRollTotal} complete
                        </p>
                        <div className="mt-3 space-y-2">
                          {puzzle.segments
                            .filter((segment) => segment.rollValue === activeRollValue)
                            .map((segment) => {
                              const finished = completedSet.has(segment.id);
                              const current = segment.id === activeSegment?.id;

                              return (
                                <div
                                  key={segment.id}
                                  className={`rounded-[1rem] border px-3 py-2 text-sm ${
                                    finished
                                      ? theme.accentChipClassName
                                      : current
                                        ? `${theme.selectorActiveClassName} text-stone-50`
                                        : "border-white/10 bg-black/18 text-stone-300/76"
                                  }`}
                                >
                                  {segment.label ?? segment.id}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-6 rounded-[1.45rem] border border-white/10 bg-black/24 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className={`font-curse text-[0.64rem] uppercase tracking-[0.32em] ${theme.accentTextClassName}`}>Roll ledger</p>
                        <p className="text-xs text-stone-400">{rollHistory.length} stored</p>
                      </div>

                      {rollHistory.length > 0 ? (
                        <div className="mt-4 overflow-hidden rounded-[1rem] border border-white/10 bg-black/18">
                          <div className="soft-scrollbar max-h-64 overflow-auto">
                            <table className="min-w-full text-left text-sm text-stone-200/84">
                              <thead className="bg-white/4 text-[0.68rem] uppercase tracking-[0.18em] text-stone-400">
                                <tr>
                                  <th className="px-3 py-2 font-medium">Try</th>
                                  <th className="px-3 py-2 font-medium">Roll</th>
                                  <th className="px-3 py-2 font-medium">Outcome</th>
                                  <th className="px-3 py-2 text-right font-medium">Reward</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rollHistory.map((entry, index) => (
                                  <tr key={entry.id} className="border-t border-white/8 align-top">
                                    <td className="px-3 py-2 text-stone-400">{index + 1}</td>
                                    <td className="px-3 py-2 font-semibold text-stone-50">{entry.value}</td>
                                    <td className="px-3 py-2 text-stone-300/82">{entry.outcomeLabel}</td>
                                    <td className={`px-3 py-2 text-right ${entry.reward > 0 ? theme.accentTextClassName : "text-stone-500"}`}>
                                      {entry.reward > 0 ? `+${entry.reward}` : "-"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-4 text-sm leading-6 text-stone-400">Your rolls will land here once the d20 starts being helpful.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[1.45rem] border border-white/10 bg-black/24 p-4">
                    <p className={`font-curse text-[0.64rem] uppercase tracking-[0.32em] ${theme.accentTextClassName}`}>Puzzle selector</p>
                    <div className="mt-4 grid gap-3">
                      {puzzles.map((entry) => (
                        <Link
                          key={entry.id}
                          className={`rounded-[1.35rem] border p-3 transition ${
                            entry.id === puzzle.id ? theme.selectorActiveClassName : theme.selectorIdleClassName
                          }`}
                          to={`/d20/${entry.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              alt={entry.title}
                              className="h-16 w-16 rounded-[1rem] border border-white/10 object-cover"
                              loading="lazy"
                              src={entry.thumbnailSrc ?? entry.imageSrc}
                            />
                            <div className="min-w-0">
                              <p className={`font-curse text-[0.58rem] uppercase tracking-[0.3em] ${theme.accentTextClassName}`}>{entry.id}</p>
                              <p className="mt-2 truncate text-sm text-stone-100">{entry.title}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {!started ? (
          <RoomMessageBox
            description="Roll the d20 to unlock numbered strands, connect each active path in order, and let the image come together piece by piece. The room will save your progress for later mischief."
            kicker="Fundicer gallery"
            actions={
              <>
                <button
                  className={`flex-1 rounded-full border px-5 py-3 text-sm uppercase tracking-[0.24em] transition ${theme.primaryButtonClassName}`}
                  onClick={startPuzzle}
                  type="button"
                >
                  Enter gallery
                </button>
                <Link
                  className={`rounded-full border px-5 py-3 text-sm uppercase tracking-[0.24em] transition ${theme.secondaryButtonClassName}`}
                  to="/"
                >
                  Back to overview
                </Link>
              </>
            }
            title={`Open ${puzzle.title}?`}
            tone={theme.tone}
          />
        ) : null}

        {showCompletionNotice ? (
          <RoomMessageBox
            dismissLabel="Keep looking"
            onDismiss={dismissCompletionNotice}
            description={prompt}
            kicker="Image complete"
            actions={
              <>
                {nextPuzzle.id !== puzzle.id ? (
                  <Link
                    className={`flex-1 rounded-full border px-5 py-3 text-sm uppercase tracking-[0.24em] transition ${theme.primaryButtonClassName}`}
                    onClick={dismissCompletionNotice}
                    to={`/d20/${nextPuzzle.id}`}
                  >
                    Open next puzzle
                  </Link>
                ) : null}
                <button
                  className={`rounded-full border px-5 py-3 text-sm uppercase tracking-[0.24em] transition ${theme.secondaryButtonClassName}`}
                  onClick={() => {
                    dismissCompletionNotice();
                    clearProgress();
                  }}
                  type="button"
                >
                  Replay puzzle
                </button>
              </>
            }
            title={`${puzzle.title} restored`}
            tone={theme.tone}
          />
        ) : null}

        <AnimatePresence>
          {flashWord ? (
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-40 flex items-center justify-center bg-[radial-gradient(circle,rgba(255,255,255,0.88),rgba(255,255,255,0.18),rgba(2,3,7,0.94))]"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0, scale: 1.06 }}
              transition={{ duration: reducedMotion ? 0.12 : 0.26 }}
            >
              <div className="text-center">
                <p className="font-curse text-[0.78rem] uppercase tracking-[0.42em] text-black/78">Fundicer reveal</p>
                <p className="mt-4 text-5xl text-black/88 sm:text-6xl">{flashWord}</p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>
    </FullscreenRoom>
  );
}








