import { useEffect, useRef, useState } from "react";
import type { PuzzleImageConfig, PuzzleSegment } from "@/features/fundicer/fundicerTypes";
import { getFakeOutValue, pick, rollDie, shouldFakeOut, type RollOutcome } from "@/utils/rolls";

const DEFAULT_SEGMENT_REWARD = 8;
const DEFAULT_COMPLETION_BONUS = 45;
const DEFAULT_DUPLICATE_REWARD = 1;
const MAX_ROLL_HISTORY = 24;
const STORAGE_PREFIX = "fundicer-progress:v1";
const FLASH_WORDS = ["DRAW THREAD", "COUNT AGAIN", "HOLD STILL"] as const;
const ROLL_NOTES = {
  low: [
    "The gallery produces a number with suspicious restraint.",
    "A humble roll, delivered like a minor administrative threat.",
  ],
  mid: [
    "The lacquer wakes up and allows it.",
    "Respectable energy. The puzzle pretends not to be impressed.",
  ],
  high: [
    "A bright result. The frame starts taking you seriously.",
    "That roll lands with enough swagger to light the edges.",
  ],
  crit: [
    "Natural twenty behavior. Even the image leans in.",
    "The d20 is unbearably pleased with itself and, annoyingly, correct.",
  ],
} satisfies Record<RollOutcome["tier"], readonly string[]>;

type RollHistoryEntry = {
  id: string;
  value: number;
  outcomeLabel: string;
  reward: number;
};

type StoredProgress = {
  started: boolean;
  completedSegmentIds: string[];
  currentRollValue: number | null;
  activeRollValue: number | null;
  activeSegmentId: string | null;
  traceNodeIds: string[];
  coins: number;
  completionBonusAwarded: boolean;
  rollHistory: RollHistoryEntry[];
};

type RuntimeState = StoredProgress & {
  prompt: string;
  guideVisible: boolean;
  rolling: boolean;
  flashWord: string | null;
  teaserValue: string | null;
  historyCount: number;
  lastFakeOutAt: number;
  showCompletionNotice: boolean;
};

type UseFundicerPuzzleOptions = {
  puzzle: PuzzleImageConfig;
  reducedMotion: boolean;
};

function getStorageKey(puzzleId: string) {
  return `${STORAGE_PREFIX}:${puzzleId}`;
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

function isValidRoll(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 20;
}

function getIncompleteSegmentsForRoll(
  puzzle: PuzzleImageConfig,
  rollValue: number | null,
  completedSegmentIds: readonly string[],
) {
  if (rollValue === null) {
    return [];
  }

  const completedSet = new Set(completedSegmentIds);
  return puzzle.segments.filter((segment) => segment.rollValue === rollValue && !completedSet.has(segment.id));
}

function sanitizeTraceNodeIds(traceNodeIds: unknown, activeSegment: PuzzleSegment | null) {
  if (!activeSegment || !Array.isArray(traceNodeIds)) {
    return [];
  }

  const nextTrace: string[] = [];

  for (const nodeId of traceNodeIds) {
    if (typeof nodeId !== "string") {
      break;
    }

    if (activeSegment.nodeIds[nextTrace.length] !== nodeId) {
      break;
    }

    nextTrace.push(nodeId);
  }

  return nextTrace;
}

function sanitizeRollHistory(rollHistory: unknown) {
  if (!Array.isArray(rollHistory)) {
    return [];
  }

  const entries: RollHistoryEntry[] = [];

  for (const entry of rollHistory) {
    if (typeof entry !== "object" || entry === null) {
      continue;
    }

    const candidate = entry as Partial<RollHistoryEntry>;

    if (!isValidRoll(candidate.value) || typeof candidate.outcomeLabel !== "string" || !candidate.outcomeLabel.trim()) {
      continue;
    }

    entries.push({
      id: typeof candidate.id === "string" && candidate.id ? candidate.id : `${candidate.value}-${entries.length}`,
      value: candidate.value,
      outcomeLabel: candidate.outcomeLabel,
      reward: typeof candidate.reward === "number" && Number.isFinite(candidate.reward) && candidate.reward > 0 ? candidate.reward : 0,
    });

    if (entries.length >= MAX_ROLL_HISTORY) {
      break;
    }
  }

  return entries;
}

function pushRollHistory(rollHistory: readonly RollHistoryEntry[], entry: RollHistoryEntry) {
  return [entry, ...rollHistory].slice(0, MAX_ROLL_HISTORY);
}

function createPrompt(puzzle: PuzzleImageConfig, progress: StoredProgress) {
  if (progress.completedSegmentIds.length === puzzle.segments.length) {
    return puzzle.completionMessage ?? "The image is complete. The gallery would like you to admire it properly.";
  }

  if (progress.activeRollValue !== null && progress.activeSegmentId) {
    return `Roll ${progress.activeRollValue} is still active. Connect the numbered nodes in order to keep revealing the image.`;
  }

  if (progress.completedSegmentIds.length > 0) {
    return "Your progress held. Roll the d20 to unlock another numbered group.";
  }

  return "Roll the d20 to reveal a number, then connect that group in order like a very dramatic paint-by-numbers ritual.";
}

function createEmptyProgress(started = false): StoredProgress {
  return {
    started,
    completedSegmentIds: [],
    currentRollValue: null,
    activeRollValue: null,
    activeSegmentId: null,
    traceNodeIds: [],
    coins: 0,
    completionBonusAwarded: false,
    rollHistory: [],
  };
}

function createRuntimeState(puzzle: PuzzleImageConfig, progress: StoredProgress): RuntimeState {
  return {
    ...progress,
    prompt: createPrompt(puzzle, progress),
    guideVisible: true,
    rolling: false,
    flashWord: null,
    teaserValue: null,
    historyCount: 0,
    lastFakeOutAt: -10,
    showCompletionNotice: false,
  };
}

function readStoredProgress(puzzle: PuzzleImageConfig): StoredProgress | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(puzzle.id));

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredProgress>;
    const segmentIdSet = new Set(puzzle.segments.map((segment) => segment.id));
    const completedSegmentIds = Array.isArray(parsed.completedSegmentIds)
      ? parsed.completedSegmentIds.filter((segmentId): segmentId is string => typeof segmentId === "string" && segmentIdSet.has(segmentId))
      : [];
    const currentRollValue = isValidRoll(parsed.currentRollValue) ? parsed.currentRollValue : null;
    let activeRollValue = isValidRoll(parsed.activeRollValue) ? parsed.activeRollValue : null;
    let activeSegments = getIncompleteSegmentsForRoll(puzzle, activeRollValue, completedSegmentIds);

    if (activeSegments.length === 0) {
      activeRollValue = null;
    }

    activeSegments = getIncompleteSegmentsForRoll(puzzle, activeRollValue, completedSegmentIds);

    const activeSegmentId =
      typeof parsed.activeSegmentId === "string" && activeSegments.some((segment) => segment.id === parsed.activeSegmentId)
        ? parsed.activeSegmentId
        : activeSegments[0]?.id ?? null;
    const activeSegment = activeSegments.find((segment) => segment.id === activeSegmentId) ?? null;
    const traceNodeIds = sanitizeTraceNodeIds(parsed.traceNodeIds, activeSegment);
    const rollHistory = sanitizeRollHistory(parsed.rollHistory);
    const started =
      typeof parsed.started === "boolean"
        ? parsed.started
        : completedSegmentIds.length > 0 || currentRollValue !== null || activeRollValue !== null || rollHistory.length > 0;
    const coins = typeof parsed.coins === "number" && Number.isFinite(parsed.coins) && parsed.coins >= 0 ? parsed.coins : 0;
    const completionBonusAwarded =
      Boolean(parsed.completionBonusAwarded) || completedSegmentIds.length === puzzle.segments.length;

    return {
      started,
      completedSegmentIds,
      currentRollValue: currentRollValue ?? activeRollValue,
      activeRollValue,
      activeSegmentId,
      traceNodeIds,
      coins,
      completionBonusAwarded,
      rollHistory,
    };
  } catch {
    return null;
  }
}

export function useFundicerPuzzle({ puzzle, reducedMotion }: UseFundicerPuzzleOptions) {
  const [state, setState] = useState<RuntimeState>(() => {
    const stored = readStoredProgress(puzzle);
    return createRuntimeState(puzzle, stored ?? createEmptyProgress(false));
  });
  const stateRef = useRef(state);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const payload: StoredProgress = {
      started: state.started,
      completedSegmentIds: state.completedSegmentIds,
      currentRollValue: state.currentRollValue,
      activeRollValue: state.activeRollValue,
      activeSegmentId: state.activeSegmentId,
      traceNodeIds: state.traceNodeIds,
      coins: state.coins,
      completionBonusAwarded: state.completionBonusAwarded,
      rollHistory: state.rollHistory,
    };
    const isEmptySave =
      !payload.started &&
      payload.completedSegmentIds.length === 0 &&
      payload.currentRollValue === null &&
      payload.activeRollValue === null &&
      payload.coins === 0 &&
      payload.rollHistory.length === 0;

    if (isEmptySave) {
      window.localStorage.removeItem(getStorageKey(puzzle.id));
      return;
    }

    window.localStorage.setItem(getStorageKey(puzzle.id), JSON.stringify(payload));
  }, [
    puzzle.id,
    state.started,
    state.completedSegmentIds,
    state.currentRollValue,
    state.activeRollValue,
    state.activeSegmentId,
    state.traceNodeIds,
    state.coins,
    state.completionBonusAwarded,
    state.rollHistory,
  ]);

  function clearTimers() {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }

  function queue(callback: () => void, delay: number) {
    timersRef.current.push(window.setTimeout(callback, delay));
  }

  function resolveRoll(outcome: RollOutcome, willFake: boolean) {
    const snapshot = stateRef.current;
    const unlockedSegments = getIncompleteSegmentsForRoll(puzzle, outcome.value, snapshot.completedSegmentIds);
    const matchingSegments = puzzle.segments.filter((segment) => segment.rollValue === outcome.value);
    const duplicateReward = Math.max(0, puzzle.duplicateRollReward ?? DEFAULT_DUPLICATE_REWARD);
    const nextHistoryCount = snapshot.historyCount + 1;
    let nextCoins = snapshot.coins;
    let prompt = pick(ROLL_NOTES[outcome.tier]);
    let activeRollValue: number | null = null;
    let activeSegmentId: string | null = null;
    let outcomeLabel = "";
    let reward = 0;

    if (unlockedSegments.length === 0) {
      if (duplicateReward > 0) {
        nextCoins += duplicateReward;
        reward = duplicateReward;
      }

      if (matchingSegments.length === 0) {
        outcomeLabel = "No matching strand";
        prompt = duplicateReward > 0
          ? `Rolled ${outcome.value}. No strand answers that number here, but the gallery pays ${duplicateReward} salvage ${pluralize(duplicateReward, "coin")}.`
          : `Rolled ${outcome.value}. No strand answers that number here.`;
      } else {
        outcomeLabel = "Already complete";
        prompt = duplicateReward > 0
          ? `Rolled ${outcome.value}. That group is already complete, so you pocket ${duplicateReward} encore ${pluralize(duplicateReward, "coin")}.`
          : `Rolled ${outcome.value}. That group is already complete.`;
      }
    } else {
      activeRollValue = outcome.value;
      activeSegmentId = unlockedSegments[0]?.id ?? null;
      outcomeLabel = `${unlockedSegments.length} ${pluralize(unlockedSegments.length, "strand")} unlocked`;
      prompt = `Rolled ${outcome.value}. ${outcomeLabel}. ${pick(ROLL_NOTES[outcome.tier])}`;
    }

    const rollHistory = pushRollHistory(snapshot.rollHistory, {
      id: `${outcome.rolledAt}-${outcome.value}-${nextHistoryCount}`,
      value: outcome.value,
      outcomeLabel,
      reward,
    });

    setState((current) => ({
      ...current,
      rolling: false,
      flashWord: null,
      teaserValue: null,
      currentRollValue: outcome.value,
      activeRollValue,
      activeSegmentId,
      traceNodeIds: [],
      coins: nextCoins,
      prompt,
      guideVisible: true,
      historyCount: nextHistoryCount,
      lastFakeOutAt: willFake ? nextHistoryCount : snapshot.lastFakeOutAt,
      rollHistory,
    }));
  }

  function completeSegment(segment: PuzzleSegment) {
    const snapshot = stateRef.current;

    if (snapshot.completedSegmentIds.includes(segment.id)) {
      return;
    }

    const completedSegmentIds = [...snapshot.completedSegmentIds, segment.id];
    const segmentReward = segment.reward ?? DEFAULT_SEGMENT_REWARD;
    const puzzleComplete = completedSegmentIds.length === puzzle.segments.length;
    const completionBonus = puzzleComplete && !snapshot.completionBonusAwarded ? puzzle.completionBonus ?? DEFAULT_COMPLETION_BONUS : 0;
    const remainingForRoll = getIncompleteSegmentsForRoll(puzzle, snapshot.activeRollValue, completedSegmentIds);
    let activeRollValue = snapshot.activeRollValue;
    let activeSegmentId = snapshot.activeSegmentId;
    let prompt = `Segment complete. +${segmentReward} ${pluralize(segmentReward, "coin")}.`;
    let completionBonusAwarded = snapshot.completionBonusAwarded;
    let showCompletionNotice = snapshot.showCompletionNotice;

    if (puzzleComplete) {
      activeRollValue = null;
      activeSegmentId = null;
      completionBonusAwarded = true;
      showCompletionNotice = true;
      prompt = completionBonus > 0
        ? `${puzzle.completionMessage ?? "The image is complete."} +${completionBonus} bonus ${pluralize(completionBonus, "coin")}.`
        : puzzle.completionMessage ?? "The image is complete.";
    } else if (remainingForRoll.length > 0) {
      activeSegmentId = remainingForRoll[0]?.id ?? null;
      prompt = `Segment complete. +${segmentReward} ${pluralize(segmentReward, "coin")}. ${remainingForRoll.length} ${pluralize(remainingForRoll.length, "strand")} remain for roll ${snapshot.activeRollValue}.`;
    } else {
      activeRollValue = null;
      activeSegmentId = null;
      prompt = `Roll ${snapshot.activeRollValue} cleared. +${segmentReward} ${pluralize(segmentReward, "coin")}. Roll again to unlock another group.`;
    }

    setState((current) => ({
      ...current,
      completedSegmentIds,
      activeRollValue,
      activeSegmentId,
      traceNodeIds: [],
      coins: snapshot.coins + segmentReward + completionBonus,
      prompt,
      guideVisible: true,
      completionBonusAwarded,
      showCompletionNotice,
    }));
  }

  function startPuzzle() {
    setState((current) => ({
      ...current,
      started: true,
      guideVisible: true,
      prompt:
        current.completedSegmentIds.length > 0
          ? "The gallery kept your progress. Roll the d20 when you want the next numbered reveal."
          : "Roll the d20 to unlock a number, then connect the numbered nodes in order.",
    }));
  }

  function dismissGuide() {
    setState((current) => ({ ...current, guideVisible: false }));
  }

  function dismissCompletionNotice() {
    setState((current) => ({ ...current, showCompletionNotice: false }));
  }

  function resetAttempt(message = "The active strand resets. Your completed work still stands.") {
    setState((current) => ({
      ...current,
      traceNodeIds: [],
      guideVisible: true,
      prompt: message,
    }));
  }

  function clearProgress() {
    clearTimers();

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(getStorageKey(puzzle.id));
    }

    setState(createRuntimeState(puzzle, createEmptyProgress(true)));
  }

  function roll() {
    const snapshot = stateRef.current;

    if (!snapshot.started || snapshot.rolling) {
      return;
    }

    if (snapshot.completedSegmentIds.length === puzzle.segments.length) {
      setState((current) => ({
        ...current,
        guideVisible: true,
        showCompletionNotice: true,
        prompt: puzzle.completionMessage ?? "This image is already complete.",
      }));
      return;
    }

    if (snapshot.activeRollValue !== null && getIncompleteSegmentsForRoll(puzzle, snapshot.activeRollValue, snapshot.completedSegmentIds).length > 0) {
      setState((current) => ({
        ...current,
        guideVisible: true,
        prompt: `Finish roll ${snapshot.activeRollValue} before calling the d20 again.`,
      }));
      return;
    }

    clearTimers();
    const outcome = rollDie("d20");
    const willFake = !reducedMotion && shouldFakeOut({
      historyCount: snapshot.historyCount,
      lastFakeOutAt: snapshot.lastFakeOutAt,
      minimumRolls: 2,
      cooldown: 5,
      chance: 0.15,
    });

    setState((current) => ({
      ...current,
      rolling: true,
      guideVisible: true,
      flashWord: pick(FLASH_WORDS),
      teaserValue: null,
      prompt: "The frame shuffles lacquer, numbers, and unnecessary suspense.",
    }));

    if (willFake) {
      queue(() => {
        setState((current) => ({
          ...current,
          teaserValue: String(getFakeOutValue(outcome.value, outcome.max)),
        }));
      }, 280);
    }

    queue(() => {
      resolveRoll(outcome, willFake);
    }, willFake ? 1120 : 760);
  }

  function selectNode(nodeId: string) {
    const snapshot = stateRef.current;

    if (!snapshot.started || snapshot.rolling) {
      return;
    }

    const activeSegments = getIncompleteSegmentsForRoll(puzzle, snapshot.activeRollValue, snapshot.completedSegmentIds);
    const activeSegment = activeSegments.find((segment) => segment.id === snapshot.activeSegmentId) ?? activeSegments[0] ?? null;

    if (!activeSegment) {
      setState((current) => ({
        ...current,
        guideVisible: true,
        prompt: "Roll the d20 to unlock a numbered group before tracing anything.",
      }));
      return;
    }

    const expectedNodeId = activeSegment.nodeIds[snapshot.traceNodeIds.length];

    if (nodeId !== expectedNodeId) {
      const prompt =
        snapshot.traceNodeIds.length === 0
          ? "Start on the first numbered node for this strand."
          : "Wrong order. Only the active strand resets, so the rest of the image stays safe.";

      setState((current) => ({
        ...current,
        traceNodeIds: [],
        guideVisible: true,
        prompt,
      }));
      return;
    }

    const traceNodeIds = [...snapshot.traceNodeIds, nodeId];

    if (traceNodeIds.length === activeSegment.nodeIds.length) {
      completeSegment(activeSegment);
      return;
    }

    setState((current) => ({
      ...current,
      traceNodeIds,
      guideVisible: true,
      prompt: `Thread ${traceNodeIds.length}/${activeSegment.nodeIds.length} placed. Keep following the numbered nodes.`,
    }));
  }

  const activeSegments = getIncompleteSegmentsForRoll(puzzle, state.activeRollValue, state.completedSegmentIds);
  const activeSegment = activeSegments.find((segment) => segment.id === state.activeSegmentId) ?? activeSegments[0] ?? null;
  const puzzleComplete = state.completedSegmentIds.length === puzzle.segments.length;
  const nextExpectedNodeId = activeSegment?.nodeIds[state.traceNodeIds.length] ?? null;

  return {
    started: state.started,
    prompt: state.prompt,
    guideVisible: state.guideVisible,
    rolling: state.rolling,
    flashWord: state.flashWord,
    teaserValue: state.teaserValue,
    currentRollValue: state.currentRollValue,
    activeRollValue: state.activeRollValue,
    activeSegmentId: state.activeSegmentId,
    traceNodeIds: state.traceNodeIds,
    completedSegmentIds: state.completedSegmentIds,
    coins: state.coins,
    rollHistory: state.rollHistory,
    puzzleComplete,
    showCompletionNotice: state.showCompletionNotice,
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
  };
}
