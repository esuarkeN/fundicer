export type PuzzleTheme = "indigo" | "ember" | "forest" | "arcane";

export type PuzzleNode = {
  id: string;
  x: number;
  y: number;
};

export type PuzzleSegment = {
  id: string;
  rollValue: number;
  nodeIds: readonly string[];
  label?: string;
  reward?: number;
};

export type PuzzleImageConfig = {
  id: string;
  title: string;
  description?: string;
  imageSrc: string;
  thumbnailSrc?: string;
  width?: number;
  height?: number;
  nodes: readonly PuzzleNode[];
  segments: readonly PuzzleSegment[];
  completionMessage?: string;
  completionBonus?: number;
  duplicateRollReward?: number;
  theme?: PuzzleTheme;
};
