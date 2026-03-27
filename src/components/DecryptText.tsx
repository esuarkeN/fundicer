import { createElement, useEffect, useState, type ComponentPropsWithoutRef, type ElementType } from "react";

const DEFAULT_POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?@#$%&*+-=<>/\\[]{}";

function isScramblable(char: string) {
  return /[A-Za-z0-9]/.test(char);
}

function buildScrambledText(text: string, revealCount: number, seed: number, pool: string) {
  const chars = Array.from(text);

  return chars
    .map((char, index) => {
      if (!isScramblable(char) || index < revealCount) {
        return char;
      }

      const roll = Math.abs(Math.sin(seed + index * 12.9898 + revealCount * 0.618) * 43758.5453);
      return pool[Math.floor(roll) % pool.length] ?? char;
    })
    .join("");
}

export type DecryptTextProps<TAs extends ElementType = "span"> = {
  as?: TAs;
  text: string;
  active?: boolean;
  reducedMotion?: boolean;
  className?: string;
  durationMs?: number;
  tickMs?: number;
  scrambleChars?: string;
} & Omit<ComponentPropsWithoutRef<TAs>, "as" | "children">;

export function DecryptText<TAs extends ElementType = "span">({
  as,
  text,
  active = false,
  reducedMotion = false,
  className,
  durationMs = 520,
  tickMs = 28,
  scrambleChars = DEFAULT_POOL,
  ...rest
}: DecryptTextProps<TAs>) {
  const Component = (as ?? "span") as ElementType;
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    if (!active || reducedMotion) {
      setDisplayText(text);
      return;
    }

    let cancelled = false;
    let timeoutId: number | undefined;
    const seed = Math.random() * 1000;
    const startedAt = performance.now();
    const pool = scrambleChars.length > 0 ? scrambleChars : DEFAULT_POOL;

    const step = () => {
      if (cancelled) {
        return;
      }

      const elapsed = performance.now() - startedAt;
      const progress = Math.min(1, elapsed / durationMs);
      const revealCount = Math.floor(progress * text.length);

      setDisplayText(buildScrambledText(text, revealCount, seed, pool));

      if (progress < 1) {
        timeoutId = window.setTimeout(step, tickMs);
        return;
      }

      setDisplayText(text);
    };

    setDisplayText(buildScrambledText(text, 0, seed, pool));
    timeoutId = window.setTimeout(step, tickMs);

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [active, durationMs, reducedMotion, scrambleChars, text, tickMs]);

  useEffect(() => {
    if (!active || reducedMotion) {
      setDisplayText(text);
    }
  }, [active, reducedMotion, text]);

  return createElement(Component, { "aria-label": text, className, ...rest }, displayText);
}
