import type { PuzzleImageConfig } from "@/features/fundicer/fundicerTypes";

function isPercentage(value: number) {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

function pushDuplicateIssues(items: readonly string[], label: string, issues: string[]) {
  const seen = new Set<string>();

  items.forEach((item) => {
    if (seen.has(item)) {
      issues.push(`duplicate ${label} id "${item}"`);
      return;
    }

    seen.add(item);
  });
}

export function validatePuzzleConfig(puzzle: PuzzleImageConfig) {
  const issues: string[] = [];
  const nodeIds = puzzle.nodes.map((node) => node.id);
  const segmentIds = puzzle.segments.map((segment) => segment.id);
  const nodeIdSet = new Set(nodeIds);

  if (!puzzle.id.trim()) {
    issues.push("puzzle id must not be empty");
  }

  if (!puzzle.title.trim()) {
    issues.push("puzzle title must not be empty");
  }

  if (!Number.isFinite(puzzle.width ?? 100) || (puzzle.width ?? 100) <= 0) {
    issues.push("puzzle width must be a positive number");
  }

  if (!Number.isFinite(puzzle.height ?? 100) || (puzzle.height ?? 100) <= 0) {
    issues.push("puzzle height must be a positive number");
  }

  pushDuplicateIssues(nodeIds, "node", issues);
  pushDuplicateIssues(segmentIds, "segment", issues);

  puzzle.nodes.forEach((node) => {
    if (!node.id.trim()) {
      issues.push("node id must not be empty");
    }

    if (!isPercentage(node.x) || !isPercentage(node.y)) {
      issues.push(`node "${node.id}" must stay within 0..100 percentage bounds`);
    }
  });

  puzzle.segments.forEach((segment) => {
    if (!segment.id.trim()) {
      issues.push("segment id must not be empty");
    }

    if (!Number.isInteger(segment.rollValue) || segment.rollValue < 1 || segment.rollValue > 20) {
      issues.push(`segment "${segment.id}" has invalid rollValue ${segment.rollValue}`);
    }

    if (segment.nodeIds.length < 2) {
      issues.push(`segment "${segment.id}" must reference at least 2 nodes`);
    }

    segment.nodeIds.forEach((nodeId) => {
      if (!nodeIdSet.has(nodeId)) {
        issues.push(`segment "${segment.id}" references missing node "${nodeId}"`);
      }
    });

    if (segment.reward !== undefined && (!Number.isFinite(segment.reward) || segment.reward < 0)) {
      issues.push(`segment "${segment.id}" has invalid reward ${segment.reward}`);
    }
  });

  return issues;
}

export function validatePuzzleRegistry(puzzles: readonly PuzzleImageConfig[]) {
  const issues: string[] = [];
  pushDuplicateIssues(
    puzzles.map((puzzle) => puzzle.id),
    "puzzle",
    issues,
  );

  puzzles.forEach((puzzle) => {
    validatePuzzleConfig(puzzle).forEach((issue) => {
      issues.push(`[${puzzle.id}] ${issue}`);
    });
  });

  return issues;
}

export function definePuzzleRegistry<const T extends readonly PuzzleImageConfig[]>(puzzles: T) {
  const issues = validatePuzzleRegistry(puzzles);

  if (issues.length > 0) {
    throw new Error(`Invalid Fundicer puzzle registry:\n- ${issues.join("\n- ")}`);
  }

  return puzzles;
}
