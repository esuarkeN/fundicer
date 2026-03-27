export type DieId = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";

export type RollTier = "low" | "mid" | "high" | "crit";

export type DieConfig = {
  id: DieId;
  path: `/${DieId}`;
  sides: number;
  name: string;
  alias: string;
  portalTitle: string;
  portalBlurb: string;
  roomTitle: string;
  roomBlurb: string;
  kicker: string;
  attitude: string;
  accent: {
    card: string;
    border: string;
    glow: string;
    ink: string;
  };
};

export const DICE: readonly DieConfig[] = [
  {
    id: "d4",
    path: "/d4",
    sides: 4,
    name: "The Drawer Imp",
    alias: "caltrop demon",
    portalTitle: "Sharp-object drawer",
    portalBlurb: "Reach into a rude little drawer full of pyramid trouble.",
    roomTitle: "The drawer of tiny betrayals",
    roomBlurb: "Select a shard, pretend it feels safe, and then discover the d4 never wanted to be held politely.",
    kicker: "Pointy ritual",
    attitude: "small, sharp, and smug about both",
    accent: {
      card: "from-fuchsia-500/20 via-violet-500/12 to-stone-950",
      border: "border-fuchsia-200/25",
      glow: "shadow-[0_24px_70px_-18px_rgba(217,70,239,0.38)]",
      ink: "text-fuchsia-100",
    },
  },
  {
    id: "d6",
    path: "/d6",
    sides: 6,
    name: "The Missing Brick",
    alias: "little blackout gremlin",
    portalTitle: "Dark-room search",
    portalBlurb: "The result already exists. The room simply declines to show it to you.",
    roomTitle: "The dark room with one obvious secret",
    roomBlurb: "Sweep the darkness with a lantern and find the number hiding in plain sight like an overconfident cube.",
    kicker: "Lantern game",
    attitude: "dumb enough to hide badly, confident enough to call it mystery",
    accent: {
      card: "from-cyan-500/16 via-sky-500/10 to-stone-950",
      border: "border-cyan-200/22",
      glow: "shadow-[0_24px_70px_-18px_rgba(34,211,238,0.32)]",
      ink: "text-cyan-100",
    },
  },
  {
    id: "d8",
    path: "/d8",
    sides: 8,
    name: "The Falling Crystal",
    alias: "impact enthusiast",
    portalTitle: "Drop chamber",
    portalBlurb: "Summon the die from above and let the floor regret it.",
    roomTitle: "The crystal drop shaft",
    roomBlurb: "This one does not arrive so much as descend with theatrical force, bounce twice too many times, and call it elegance.",
    kicker: "Impact ritual",
    attitude: "nervous, bright, and a little too eager to meet the floor",
    accent: {
      card: "from-emerald-500/16 via-cyan-500/10 to-stone-950",
      border: "border-emerald-200/22",
      glow: "shadow-[0_24px_70px_-18px_rgba(52,211,153,0.3)]",
      ink: "text-emerald-100",
    },
  },
  {
    id: "d10",
    path: "/d10",
    sides: 10,
    name: "The Decimal Engine",
    alias: "glitch terminal",
    portalTitle: "Machine confession",
    portalBlurb: "Feed a cursed machine and wait for the number to stop lying.",
    roomTitle: "The decimal engine",
    roomBlurb: "The machine insists every result should be scrambled first, as if secrecy makes basic arithmetic more divine.",
    kicker: "Terminal seance",
    attitude: "cold, smug, and glitchy on purpose",
    accent: {
      card: "from-lime-500/16 via-emerald-500/10 to-stone-950",
      border: "border-lime-200/24",
      glow: "shadow-[0_24px_70px_-18px_rgba(163,230,53,0.28)]",
      ink: "text-lime-100",
    },
  },
  {
    id: "d12",
    path: "/d12",
    sides: 12,
    name: "The Chamberlain",
    alias: "judgment ornament",
    portalTitle: "Eye court",
    portalBlurb: "Stand still and let a dozen suspicious eyes decide how lucky you look.",
    roomTitle: "The chamber of twelve opinions",
    roomBlurb: "This room watches first, speaks second, and only then remembers to produce a number.",
    kicker: "Judgment rite",
    attitude: "dramatic, supervisory, and far too pleased with itself",
    accent: {
      card: "from-amber-500/18 via-rose-500/10 to-stone-950",
      border: "border-amber-200/24",
      glow: "shadow-[0_24px_70px_-18px_rgba(251,191,36,0.32)]",
      ink: "text-amber-100",
    },
  },
  {
    id: "d20",
    path: "/d20",
    sides: 20,
    name: "The Star Tyrant",
    alias: "gallery tyrant",
    portalTitle: "Fundicer gallery",
    portalBlurb: "Roll a d20 to unlock numbered image strands and restore a rude little plate.",
    roomTitle: "The star tyrant gallery",
    roomBlurb: "Each roll wakes a numbered path. Trace the unlocked strands, restore the image, and let the d20 act smug about the whole exhibition.",
    kicker: "Image ritual",
    attitude: "ornate, supervisory, and convinced every puzzle needs a theatrical reveal",
    accent: {
      card: "from-indigo-500/18 via-sky-500/10 to-stone-950",
      border: "border-indigo-200/24",
      glow: "shadow-[0_24px_70px_-18px_rgba(129,140,248,0.34)]",
      ink: "text-indigo-100",
    },
  },
];

export const DICE_BY_ID = Object.fromEntries(DICE.map((die) => [die.id, die])) as Record<DieId, DieConfig>;

