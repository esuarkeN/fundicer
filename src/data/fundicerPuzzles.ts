import { definePuzzleRegistry } from "@/features/fundicer/fundicerValidation";
import type { PuzzleImageConfig, PuzzleTheme } from "@/features/fundicer/fundicerTypes";

type PuzzleStyle = "constellation" | "outline" | "botanical";
type PointTuple = readonly [number, number];

type PuzzleSeed = {
  id: string;
  title: string;
  description: string;
  completionMessage: string;
  theme: PuzzleTheme;
  style: PuzzleStyle;
  paths: readonly string[];
};

const THEME_SWATCHES: Record<PuzzleTheme, { background: string; haze: string; accent: string; ember: string }> = {
  indigo: {
    background: "#080b18",
    haze: "#1e2f62",
    accent: "#c8b8ff",
    ember: "#f1f4ff",
  },
  ember: {
    background: "#170a05",
    haze: "#55270f",
    accent: "#ffd38e",
    ember: "#fff3d6",
  },
  forest: {
    background: "#07130d",
    haze: "#174433",
    accent: "#a4ebc0",
    ember: "#effff5",
  },
  arcane: {
    background: "#07141a",
    haze: "#103d49",
    accent: "#9fe8ff",
    ember: "#effdff",
  },
};

function parsePath(path: string) {
  return path
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      return [x, y] as const;
    });
}

function toSvgPath(points: readonly PointTuple[]) {
  return points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`).join(" ");
}

function getSegmentLabel(style: PuzzleStyle, rollValue: number) {
  if (style === "constellation") {
    return `Star line ${rollValue}`;
  }

  if (style === "botanical") {
    return `Bloom line ${rollValue}`;
  }

  return `Outline ${rollValue}`;
}

function createIllustration(style: PuzzleStyle, theme: PuzzleTheme, paths: readonly (readonly PointTuple[])[]) {
  const swatch = THEME_SWATCHES[theme];
  const glowWidth = style === "constellation" ? 3.2 : style === "botanical" ? 4.8 : 4.2;
  const nodeRadius = style === "constellation" ? 0.9 : 0.72;
  const nodeOpacity = style === "constellation" ? 0.22 : 0.14;
  const hazeOpacity = style === "constellation" ? 0.12 : 0.08;
  const allPoints = paths.flat();
  const pathMarkup = paths
    .map(
      (points) =>
        `<path d="${toSvgPath(points)}" fill="none" stroke="${swatch.accent}" stroke-opacity="${hazeOpacity}" stroke-width="${glowWidth}" stroke-linecap="round" stroke-linejoin="round" />`,
    )
    .join("");
  const pointMarkup = allPoints
    .map(
      ([x, y], index) =>
        `<circle cx="${x}" cy="${y}" r="${nodeRadius + (index % 5 === 0 ? 0.3 : 0)}" fill="${swatch.ember}" fill-opacity="${nodeOpacity}" />`,
    )
    .join("");
  const emberMarkup = allPoints
    .filter((_, index) => index % 4 === 0)
    .map(
      ([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="${swatch.accent}" fill-opacity="0.05" />`,
    )
    .join("");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="1200" height="900" fill="none">
      <defs>
        <linearGradient id="bg" x1="10" y1="4" x2="90" y2="96" gradientUnits="userSpaceOnUse">
          <stop stop-color="${swatch.haze}" stop-opacity="0.42" />
          <stop offset="1" stop-color="${swatch.background}" />
        </linearGradient>
        <radialGradient id="halo" cx="50%" cy="34%" r="56%">
          <stop offset="0" stop-color="${swatch.accent}" stop-opacity="0.14" />
          <stop offset="1" stop-color="${swatch.accent}" stop-opacity="0" />
        </radialGradient>
        <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>
      <rect width="100" height="100" fill="${swatch.background}" />
      <rect width="100" height="100" fill="url(#bg)" />
      <rect width="100" height="100" fill="url(#halo)" />
      <g filter="url(#blur)">${pathMarkup}${emberMarkup}</g>
      ${pointMarkup}
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createGeneratedPuzzle(seed: PuzzleSeed): PuzzleImageConfig {
  const parsedPaths = seed.paths.map(parsePath);

  if (parsedPaths.length !== 20) {
    throw new Error(`${seed.id} must define exactly 20 paths, received ${parsedPaths.length}`);
  }

  const nodes: { id: string; x: number; y: number }[] = [];
  const segments = parsedPaths.map((points, index) => {
    const rollValue = index + 1;
    const nodeIds = points.map((_, pointIndex) => `${seed.id}-r${rollValue}-n${pointIndex + 1}`);

    points.forEach(([x, y], pointIndex) => {
      nodes.push({
        id: nodeIds[pointIndex],
        x,
        y,
      });
    });

    return {
      id: `${seed.id}-roll-${rollValue}`,
      label: getSegmentLabel(seed.style, rollValue),
      rollValue,
      nodeIds,
      reward: (seed.style === "constellation" ? 7 : 8) + (rollValue % 4 === 0 ? 2 : 0),
    };
  });

  return {
    id: seed.id,
    title: seed.title,
    description: seed.description,
    imageSrc: createIllustration(seed.style, seed.theme, parsedPaths),
    width: 1200,
    height: 900,
    nodes,
    segments,
    completionMessage: seed.completionMessage,
    completionBonus: seed.style === "botanical" ? 58 : seed.style === "constellation" ? 48 : 52,
    duplicateRollReward: 2,
    theme: seed.theme,
  };
}

const PUZZLE_SEEDS = [
  {
    id: "moon-moth",
    title: "Moon Moth Study",
    description: "A lunar moth plate full of wing arcs, antennae, and a quietly rude amount of symmetry.",
    completionMessage: "The moth settles into full focus and the gallery pretends it doubted you the whole time.",
    theme: "indigo",
    style: "outline",
    paths: [
      "50,18 50,28 50,40",
      "50,40 50,54 50,70",
      "50,18 46,12 40,8",
      "50,18 54,12 60,8",
      "47,28 40,24 30,22",
      "30,22 22,30 18,42",
      "18,42 22,56 32,68",
      "32,68 42,62 46,50",
      "53,28 60,24 70,22",
      "70,22 78,30 82,42",
      "82,42 78,56 68,68",
      "68,68 58,62 54,50",
      "46,34 36,40 32,50",
      "54,34 64,40 68,50",
      "32,50 40,58 46,62",
      "68,50 60,58 54,62",
      "14,20 12,30 14,40",
      "86,20 88,30 86,40",
      "44,36 50,34 56,36",
      "44,50 50,48 56,50",
    ],
  },
  {
    id: "ember-bloom",
    title: "Ember Bloom Plate",
    description: "A heated botanical plate with petal rings, halo sparks, and stern little leaves.",
    completionMessage: "The bloom opens completely and the room concedes that yes, this is now undeniably gorgeous.",
    theme: "ember",
    style: "botanical",
    paths: [
      "50,56 50,70 50,84",
      "46,72 38,66 28,74",
      "54,72 62,66 72,74",
      "50,44 46,28 50,16",
      "50,16 54,28 50,44",
      "46,46 38,34 30,24",
      "54,46 62,34 70,24",
      "44,48 30,44 20,40",
      "56,48 70,44 80,40",
      "46,52 38,58 30,64",
      "54,52 62,58 70,64",
      "50,54 46,60 50,68",
      "50,68 54,60 50,54",
      "14,24 10,38 14,56",
      "86,24 90,38 86,56",
      "44,24 38,16 30,10",
      "56,24 62,16 70,10",
      "24,16 20,24 24,30",
      "76,16 80,24 76,30",
      "44,48 50,42 56,48 50,54 44,48",
    ],
  },
  {
    id: "north-swan",
    title: "North Swan Constellation",
    description: "A star-study swan with a long neck, split wings, and a smug little beak.",
    completionMessage: "The swan glides into view and the observatory acts like this was obvious all along.",
    theme: "indigo",
    style: "constellation",
    paths: [
      "78,28 84,25 88,27",
      "76,30 72,24 68,18",
      "74,32 68,34 62,34",
      "62,34 56,38 52,44",
      "52,44 48,50 46,58",
      "46,58 38,62 30,62",
      "30,62 22,58 18,52",
      "18,52 20,46 26,42",
      "26,42 34,40 42,42",
      "42,42 48,46 54,52",
      "34,40 28,34 24,28",
      "24,28 22,22 26,18",
      "26,18 34,20 40,26",
      "54,52 60,58 68,60",
      "68,60 76,60 82,56",
      "58,56 56,64 58,72",
      "58,72 64,78 72,80",
      "52,68 46,74 38,78",
      "38,78 30,80 24,76",
      "66,38 74,42 82,46",
    ],
  },
  {
    id: "drift-crown",
    title: "Drift Crown Constellation",
    description: "An old celestial crown with tilted spires and too much ceremonial confidence.",
    completionMessage: "The crown resolves into lacquered starlight and looks annoyingly regal about it.",
    theme: "arcane",
    style: "constellation",
    paths: [
      "20,60 26,46 32,34",
      "32,34 36,22 40,16",
      "40,16 44,24 48,36",
      "48,36 52,20 56,12",
      "56,12 60,24 64,38",
      "64,38 68,22 72,16",
      "72,16 76,28 80,44",
      "80,44 84,58 82,70",
      "82,70 72,76 62,78",
      "62,78 50,74 38,78",
      "38,78 28,76 18,70",
      "18,70 16,60 20,50",
      "26,60 38,58 50,60",
      "50,60 62,58 74,60",
      "30,48 40,46 48,48",
      "52,48 60,46 70,48",
      "34,64 46,68 58,68",
      "58,68 70,64 78,58",
      "22,58 18,50 20,42",
      "80,44 84,38 86,30",
    ],
  },
  {
    id: "comet-fox",
    title: "Comet Fox",
    description: "A fox built out of quick star-lines, sharp ears, and a theatrical tail flare.",
    completionMessage: "The fox snaps into the dark and the room approves of your suspiciously neat work.",
    theme: "indigo",
    style: "constellation",
    paths: [
      "78,30 86,26 90,30",
      "76,28 72,20 66,16",
      "74,32 66,34 58,34",
      "58,34 52,38 48,46",
      "48,46 44,56 40,66",
      "40,66 32,72 24,72",
      "24,72 18,66 18,58",
      "18,58 22,52 30,50",
      "30,50 38,52 44,58",
      "44,58 50,64 58,66",
      "58,66 68,64 78,58",
      "78,58 84,50 86,42",
      "64,40 70,44 76,50",
      "56,34 50,28 44,22",
      "44,22 36,18 30,22",
      "30,22 28,30 34,36",
      "34,36 42,38 48,34",
      "24,72 20,80 24,86",
      "40,66 38,78 42,86",
      "66,64 72,74 82,82",
    ],
  },
  {
    id: "tide-whale",
    title: "Tide Whale",
    description: "A whale study made from sea-cold stars and one very committed spout.",
    completionMessage: "The whale drifts across the plate and the tide room gets oddly sentimental about it.",
    theme: "arcane",
    style: "constellation",
    paths: [
      "18,54 26,46 36,42",
      "36,42 46,40 56,42",
      "56,42 66,46 76,54",
      "76,54 84,60 88,66",
      "88,66 84,70 78,70",
      "78,70 72,66 68,60",
      "68,60 62,62 56,68",
      "56,68 50,74 42,76",
      "42,76 34,74 28,68",
      "28,68 24,62 24,56",
      "24,56 20,52 14,50",
      "24,52 22,44 26,36",
      "26,36 34,30 44,28",
      "44,28 56,28 66,32",
      "66,32 74,38 80,46",
      "48,46 50,38 54,32",
      "58,48 64,44 70,40",
      "34,56 30,62 28,70",
      "14,50 10,46 8,40",
      "16,44 12,36 10,28",
    ],
  },
  {
    id: "lantern-owl",
    title: "Lantern Owl",
    description: "A wide-eyed owl plate with heavy wings and a lantern-maker's posture.",
    completionMessage: "The owl finally stares back in full and the gallery becomes very quiet about it.",
    theme: "indigo",
    style: "outline",
    paths: [
      "36,20 30,12 24,18",
      "64,20 70,12 76,18",
      "24,18 22,30 26,40",
      "76,18 78,30 74,40",
      "26,40 30,52 38,58",
      "74,40 70,52 62,58",
      "38,58 50,62 62,58",
      "30,30 36,28 42,32",
      "70,30 64,28 58,32",
      "42,32 44,40 40,48",
      "58,32 56,40 60,48",
      "40,48 46,54 50,58",
      "60,48 54,54 50,58",
      "50,62 50,72 48,82",
      "48,82 44,88 40,86",
      "52,62 52,72 54,82",
      "54,82 58,88 62,86",
      "18,50 12,58 14,66",
      "82,50 88,58 86,66",
      "44,20 50,24 56,20",
    ],
  },
  {
    id: "meadow-rabbit",
    title: "Meadow Rabbit",
    description: "A quick rabbit outline with high ears, tucked paws, and one spring-loaded tail.",
    completionMessage: "The rabbit settles into place and looks ready to vanish the second you blink.",
    theme: "forest",
    style: "outline",
    paths: [
      "70,12 72,4 76,10",
      "62,14 64,4 68,12",
      "60,16 56,24 54,32",
      "54,32 56,40 62,44",
      "62,44 70,44 76,40",
      "76,40 82,46 82,54",
      "82,54 76,58 68,58",
      "68,58 60,56 54,52",
      "54,52 50,58 46,66",
      "46,66 38,72 30,72",
      "30,72 22,68 20,60",
      "20,60 24,52 32,50",
      "32,50 40,52 46,58",
      "28,72 26,82 30,88",
      "40,72 40,82 44,88",
      "48,34 44,40 40,46",
      "40,46 36,42 34,36",
      "50,28 46,24 42,22",
      "58,52 64,66 74,76",
      "54,22 50,18 46,16",
    ],
  },
  {
    id: "ember-cat",
    title: "Ember Cat",
    description: "A singed little cat silhouette with twitchy whiskers and an offended tail.",
    completionMessage: "The cat appears in full and immediately looks like it disapproves of your timing.",
    theme: "ember",
    style: "outline",
    paths: [
      "68,18 72,8 78,18",
      "54,18 50,8 44,18",
      "44,18 40,30 42,40",
      "78,18 82,30 80,40",
      "42,40 46,52 56,58",
      "80,40 74,52 64,58",
      "56,58 50,68 48,80",
      "64,58 68,68 70,80",
      "48,80 44,88 38,86",
      "70,80 74,88 80,86",
      "50,44 46,48 42,50",
      "50,46 40,44 34,42",
      "62,44 66,48 70,50",
      "62,46 72,44 78,42",
      "50,30 52,36 48,40",
      "62,30 60,36 64,40",
      "56,54 60,56 64,54",
      "34,70 26,76 20,72",
      "20,72 14,66 16,58",
      "44,58 38,62 34,68",
    ],
  },
  {
    id: "river-koi",
    title: "River Koi",
    description: "A swimming koi rendered as a clean plate of fins, tail flashes, and a lazy arc.",
    completionMessage: "The koi coils into view and the waterline glow finally makes sense.",
    theme: "arcane",
    style: "outline",
    paths: [
      "26,48 18,44 12,48",
      "12,48 18,52 26,48",
      "26,48 34,40 44,36",
      "44,36 56,34 68,38",
      "68,38 78,44 84,52",
      "84,52 78,60 68,64",
      "68,64 56,66 44,64",
      "44,64 34,60 26,52",
      "34,48 38,42 44,40",
      "44,40 52,42 60,48",
      "60,48 68,54 74,56",
      "44,64 48,72 50,82",
      "50,82 46,88 42,84",
      "60,38 64,28 70,24",
      "70,24 76,28 74,36",
      "54,50 50,54 46,50",
      "26,52 24,60 26,68",
      "26,68 22,76 16,82",
      "32,44 28,36 24,28",
      "24,28 18,24 14,30",
    ],
  },
  {
    id: "moss-turtle",
    title: "Moss Turtle",
    description: "A patient turtle outline with a broad shell and several determined little feet.",
    completionMessage: "The turtle plate resolves and somehow feels older than the room itself.",
    theme: "forest",
    style: "outline",
    paths: [
      "24,48 18,42 14,34",
      "14,34 18,28 24,32",
      "24,32 34,26 46,24",
      "46,24 58,24 70,28",
      "70,28 80,34 84,44",
      "84,44 82,54 74,60",
      "74,60 62,66 50,68",
      "50,68 38,66 28,60",
      "28,60 22,54 20,46",
      "30,34 26,24 20,18",
      "44,24 42,14 36,10",
      "64,26 68,16 74,12",
      "76,58 82,68 86,76",
      "60,66 62,78 66,86",
      "38,66 34,78 28,86",
      "24,58 16,68 12,78",
      "36,36 46,32 56,34",
      "56,34 66,40 70,48",
      "32,52 42,58 54,58",
      "54,58 64,54 72,48",
    ],
  },
  {
    id: "hollow-stag",
    title: "Hollow Stag",
    description: "A stag head study with branching antlers and a carved, almost mask-like face.",
    completionMessage: "The stag steps out of the dark grain and the whole plate feels sharper for it.",
    theme: "forest",
    style: "outline",
    paths: [
      "54,22 50,12 46,6",
      "46,6 40,10 38,18",
      "58,22 62,12 68,6",
      "68,6 74,10 76,18",
      "50,22 44,28 40,36",
      "60,22 66,28 70,36",
      "40,36 38,48 42,58",
      "70,36 72,48 68,58",
      "42,58 50,64 58,64",
      "58,64 66,58 68,48",
      "48,34 46,40 44,46",
      "60,34 62,40 64,46",
      "50,50 54,52 58,50",
      "48,64 46,76 44,88",
      "44,88 40,94 36,90",
      "60,64 62,76 64,88",
      "64,88 68,94 72,90",
      "28,44 20,40 14,44",
      "82,44 90,40 96,44",
      "52,64 50,78 50,92",
    ],
  },
  {
    id: "dusk-wolf",
    title: "Dusk Wolf",
    description: "A prowling wolf silhouette with long legs, a narrow snout, and a tail full of bad ideas.",
    completionMessage: "The wolf locks into place and the dusk around it suddenly feels very deliberate.",
    theme: "indigo",
    style: "outline",
    paths: [
      "78,22 82,14 88,18",
      "78,22 70,24 62,28",
      "62,28 56,36 54,46",
      "54,46 48,54 40,58",
      "40,58 30,60 22,58",
      "22,58 18,52 20,44",
      "20,44 26,40 34,40",
      "34,40 42,44 48,50",
      "48,50 56,56 66,58",
      "66,58 76,54 84,46",
      "84,46 88,38 86,30",
      "58,30 52,24 44,20",
      "44,20 36,22 34,30",
      "34,30 38,36 46,36",
      "28,58 24,70 26,84",
      "26,84 22,90 18,86",
      "44,58 42,72 44,86",
      "62,58 66,72 70,86",
      "70,86 74,92 78,88",
      "66,54 74,66 84,80",
    ],
  },
  {
    id: "glint-crane",
    title: "Glint Crane",
    description: "A crane plate of long legs, a sharp beak, and wings folded like paper knives.",
    completionMessage: "The crane unfolds into view and the whole room suddenly feels more vertical.",
    theme: "arcane",
    style: "outline",
    paths: [
      "62,12 66,6 72,10",
      "60,16 68,20 76,24",
      "58,18 54,26 50,36",
      "50,36 48,48 48,60",
      "48,60 42,72 34,80",
      "34,80 28,88 22,86",
      "52,60 58,70 64,78",
      "64,78 70,86 76,84",
      "50,30 44,24 36,22",
      "36,22 28,24 24,30",
      "24,30 26,38 34,42",
      "34,42 42,44 48,40",
      "52,40 60,44 68,44",
      "68,44 76,40 80,32",
      "48,60 46,76 46,90",
      "46,90 42,96 38,92",
      "52,60 54,76 56,92",
      "56,92 60,96 64,92",
      "76,24 84,26 90,32",
      "18,40 12,46 10,54",
    ],
  },
  {
    id: "spiral-seahorse",
    title: "Spiral Seahorse",
    description: "A curled seahorse with a lifted crest and a tail that refuses to end simply.",
    completionMessage: "The seahorse curls into full view and the plate finally stops pretending to be calm.",
    theme: "arcane",
    style: "outline",
    paths: [
      "64,18 70,12 76,18",
      "64,18 60,26 60,34",
      "60,34 64,40 70,42",
      "70,42 74,48 74,56",
      "74,56 70,64 62,66",
      "62,66 54,68 48,64",
      "48,64 44,56 46,48",
      "46,48 52,42 60,40",
      "48,64 42,72 38,80",
      "38,80 40,88 48,90",
      "48,90 56,88 60,82",
      "60,82 58,74 52,70",
      "52,70 46,68 42,72",
      "52,40 46,34 38,32",
      "38,32 30,34 24,40",
      "24,40 24,48 30,54",
      "30,54 38,56 46,52",
      "62,28 68,26 74,30",
      "52,52 48,58 46,66",
      "34,30 30,24 28,18",
    ],
  },
  {
    id: "orchard-snail",
    title: "Orchard Snail",
    description: "A snail study with a generous shell spiral and a body taking its time on purpose.",
    completionMessage: "The snail slides into full view and, somehow, still looks in no hurry whatsoever.",
    theme: "forest",
    style: "outline",
    paths: [
      "24,62 20,54 22,46",
      "22,46 28,40 36,38",
      "36,38 46,38 54,42",
      "54,42 60,50 60,58",
      "60,58 56,66 48,68",
      "48,68 40,66 36,60",
      "36,60 36,52 42,48",
      "42,48 48,48 52,52",
      "52,52 52,58 48,62",
      "48,62 42,62 40,56",
      "24,62 34,70 46,72",
      "46,72 58,72 70,68",
      "70,68 80,62 84,54",
      "84,54 82,46 74,44",
      "74,44 66,46 62,52",
      "62,52 60,60 64,66",
      "46,72 46,82 44,90",
      "44,90 40,96 36,92",
      "60,72 62,82 66,90",
      "66,90 72,96 76,92",
    ],
  },
  {
    id: "canyon-lizard",
    title: "Canyon Lizard",
    description: "A sun-baked lizard outline with splayed feet, a narrow head, and a whip tail.",
    completionMessage: "The lizard sprawls across the plate and the canyon heat finally has a shape.",
    theme: "ember",
    style: "outline",
    paths: [
      "74,28 82,24 88,28",
      "74,28 66,32 58,32",
      "58,32 50,36 46,44",
      "46,44 42,52 34,56",
      "34,56 26,56 20,52",
      "20,52 18,44 24,40",
      "24,40 32,40 40,44",
      "58,32 62,24 68,18",
      "68,18 74,16 80,20",
      "38,52 32,66 30,80",
      "30,80 26,88 20,84",
      "44,48 46,64 48,80",
      "48,80 50,90 56,86",
      "54,42 62,50 70,54",
      "70,54 78,58 84,56",
      "70,54 72,68 70,82",
      "70,82 74,90 80,86",
      "34,56 30,66 24,72",
      "24,72 18,78 12,74",
      "20,52 14,60 10,68",
    ],
  },
  {
    id: "velvet-bat",
    title: "Velvet Bat",
    description: "A wide bat silhouette with hinged wings and a body that looks delighted to be ominous.",
    completionMessage: "The bat opens over the plate and the ceiling suddenly feels much closer.",
    theme: "indigo",
    style: "outline",
    paths: [
      "36,24 28,14 18,20",
      "18,20 14,30 18,38",
      "18,38 28,42 36,38",
      "36,38 42,30 46,24",
      "64,24 72,14 82,20",
      "82,20 86,30 82,38",
      "82,38 72,42 64,38",
      "64,38 58,30 54,24",
      "46,24 50,18 54,24",
      "50,18 50,28 48,36",
      "50,28 52,36 50,46",
      "48,46 42,52 36,58",
      "52,46 58,52 64,58",
      "36,58 28,64 22,72",
      "22,72 26,78 34,76",
      "64,58 72,64 78,72",
      "78,72 74,78 66,76",
      "34,76 40,82 46,86",
      "66,76 60,82 54,86",
      "46,86 50,92 54,86",
    ],
  },
  {
    id: "harbor-octopus",
    title: "Harbor Octopus",
    description: "An octopus plate of soft crown lines and tentacles that insist on taking the scenic route.",
    completionMessage: "The octopus spills into view and the harbor dark gets a lot more interesting.",
    theme: "arcane",
    style: "outline",
    paths: [
      "50,24 44,20 38,24",
      "50,24 56,20 62,24",
      "38,24 32,30 30,38",
      "62,24 68,30 70,38",
      "30,38 32,46 38,50",
      "70,38 68,46 62,50",
      "38,50 44,52 50,50",
      "50,50 56,52 62,50",
      "36,52 30,60 28,70",
      "28,70 30,80 36,86",
      "42,54 38,64 38,76",
      "38,76 42,86 48,90",
      "50,54 50,66 50,78",
      "50,78 50,88 46,94",
      "58,54 62,64 62,76",
      "62,76 58,86 52,90",
      "64,52 70,60 72,70",
      "72,70 70,80 64,86",
      "44,34 46,38 44,42",
      "56,34 54,38 56,42",
    ],
  },
  {
    id: "comet-serpent",
    title: "Comet Serpent",
    description: "A serpent constellation with a looping middle and a head that keeps curving toward trouble.",
    completionMessage: "The serpent threads itself through the plate and the comet trail finally behaves.",
    theme: "indigo",
    style: "constellation",
    paths: [
      "18,42 24,34 32,30",
      "32,30 42,28 52,30",
      "52,30 62,34 70,40",
      "70,40 78,48 82,58",
      "82,58 80,68 72,74",
      "72,74 62,78 52,78",
      "52,78 42,74 36,66",
      "36,66 34,56 40,48",
      "40,48 48,44 58,46",
      "58,46 64,52 64,60",
      "64,60 58,66 50,66",
      "50,66 44,62 44,56",
      "44,56 48,52 56,54",
      "18,42 12,36 8,28",
      "8,28 10,20 18,16",
      "18,16 28,18 34,24",
      "34,24 40,18 46,12",
      "46,12 54,10 62,14",
      "62,14 70,20 74,28",
      "74,28 82,24 90,20",
    ],
  },
] as const satisfies readonly PuzzleSeed[];

export const FUNDICER_PUZZLES = definePuzzleRegistry(PUZZLE_SEEDS.map((seed) => createGeneratedPuzzle(seed)));

export const DEFAULT_FUNDICER_PUZZLE_ID = FUNDICER_PUZZLES[0]?.id ?? "";

export const FUNDICER_PUZZLES_BY_ID = Object.fromEntries(
  FUNDICER_PUZZLES.map((puzzle) => [puzzle.id, puzzle]),
) as Record<string, PuzzleImageConfig>;

