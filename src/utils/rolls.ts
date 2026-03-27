import { DICE_BY_ID, type DieId, type RollTier } from "@/data/dice";

export type RollOutcome = {
  dieId: DieId;
  label: string;
  value: number;
  max: number;
  tier: RollTier;
  rolledAt: number;
};

export type FakeOutOptions = {
  chance?: number;
  cooldown?: number;
  historyCount: number;
  lastFakeOutAt: number;
  minimumRolls?: number;
};

export function randomInt(max: number) {
  return Math.floor(Math.random() * max) + 1;
}

export function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pick<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)] ?? items[0];
}

export function getRollTier(value: number, max: number): RollTier {
  if (value === max) {
    return "crit";
  }

  if (value <= Math.max(1, Math.floor(max * 0.25))) {
    return "low";
  }

  if (value >= Math.max(2, Math.ceil(max * 0.8))) {
    return "high";
  }

  return "mid";
}

export function rollDie(dieId: DieId): RollOutcome {
  const die = DICE_BY_ID[dieId];
  const value = randomInt(die.sides);

  return {
    dieId,
    label: die.name,
    value,
    max: die.sides,
    tier: getRollTier(value, die.sides),
    rolledAt: Date.now(),
  };
}

export function shouldFakeOut({
  chance = 0.11,
  cooldown = 6,
  historyCount,
  lastFakeOutAt,
  minimumRolls = 3,
}: FakeOutOptions) {
  if (historyCount < minimumRolls) {
    return false;
  }

  if (historyCount - lastFakeOutAt < cooldown) {
    return false;
  }

  return Math.random() < chance;
}

export function getFakeOutValue(actual: number, max: number) {
  if (actual === max) {
    return Math.max(2, Math.ceil(max * 0.55));
  }

  return max;
}
