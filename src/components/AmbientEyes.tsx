import { type CSSProperties } from "react";

export type PointerPoint = {
  x: number;
  y: number;
};

export type AmbientEyesProps = {
  active?: boolean;
  reducedMotion?: boolean;
  className?: string;
  pointer?: PointerPoint;
  normalizedPointer?: PointerPoint;
  eyeCount?: number;
};

type EyeAnchor = {
  x: number;
  y: number;
  size: number;
  drift: number;
  hue: "amber" | "slate" | "violet";
};

const EYE_ANCHORS: readonly EyeAnchor[] = [
  { x: 15, y: 22, size: 1, drift: 0.7, hue: "amber" },
  { x: 74, y: 16, size: 1.15, drift: 0.9, hue: "slate" },
  { x: 38, y: 42, size: 0.9, drift: 0.6, hue: "violet" },
  { x: 84, y: 58, size: 1.05, drift: 0.8, hue: "amber" },
  { x: 18, y: 70, size: 0.95, drift: 0.65, hue: "slate" },
  { x: 58, y: 82, size: 1.1, drift: 0.75, hue: "violet" },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getNormalizedPointer(pointer?: PointerPoint, normalizedPointer?: PointerPoint) {
  if (normalizedPointer) {
    return {
      x: clamp(normalizedPointer.x, 0, 1),
      y: clamp(normalizedPointer.y, 0, 1),
    };
  }

  if (!pointer) {
    return { x: 0.5, y: 0.5 };
  }

  if (pointer.x >= 0 && pointer.x <= 1 && pointer.y >= 0 && pointer.y <= 1) {
    return {
      x: clamp(pointer.x, 0, 1),
      y: clamp(pointer.y, 0, 1),
    };
  }

  if (typeof window === "undefined" || window.innerWidth === 0 || window.innerHeight === 0) {
    return { x: 0.5, y: 0.5 };
  }

  return {
    x: clamp(pointer.x / window.innerWidth, 0, 1),
    y: clamp(pointer.y / window.innerHeight, 0, 1),
  };
}

function hueClasses(hue: EyeAnchor["hue"]) {
  switch (hue) {
    case "amber":
      return {
        glow: "from-amber-200/35 via-amber-100/10 to-transparent",
        iris: "bg-amber-100/70",
        pupil: "bg-stone-950",
      };
    case "violet":
      return {
        glow: "from-fuchsia-200/25 via-violet-100/10 to-transparent",
        iris: "bg-fuchsia-100/70",
        pupil: "bg-stone-950",
      };
    default:
      return {
        glow: "from-slate-100/30 via-slate-100/10 to-transparent",
        iris: "bg-slate-100/70",
        pupil: "bg-stone-950",
      };
  }
}

export function AmbientEyes({
  active = false,
  reducedMotion = false,
  className,
  pointer,
  normalizedPointer,
  eyeCount = EYE_ANCHORS.length,
}: AmbientEyesProps) {
  const cursor = getNormalizedPointer(pointer, normalizedPointer);
  const pullStrength = reducedMotion ? 2 : active ? 10 : 4;
  const visibleAnchors = EYE_ANCHORS.slice(0, Math.max(1, eyeCount));

  const style = {
    "--ambient-x": `${cursor.x * 100}%`,
    "--ambient-y": `${cursor.y * 100}%`,
  } as CSSProperties;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
      style={style}
    >
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at var(--ambient-x) var(--ambient-y), rgba(251,191,36,0.16), rgba(251,191,36,0.05) 18%, rgba(10,10,10,0) 45%)",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,15,15,0.08),rgba(0,0,0,0.78)_70%)]" />
      <div className="absolute inset-0">
        {visibleAnchors.map((eye, index) => {
          const dx = (cursor.x - eye.x / 100) * pullStrength * 18 * eye.drift;
          const dy = (cursor.y - eye.y / 100) * pullStrength * 18 * eye.drift;
          const colors = hueClasses(eye.hue);

          return (
            <div
              key={`${eye.x}-${eye.y}-${index}`}
              className="absolute"
              style={{
                left: `${eye.x}%`,
                top: `${eye.y}%`,
                width: `${4.5 * eye.size}rem`,
                height: `${2.8 * eye.size}rem`,
                transform: "translate(-50%, -50%)",
                opacity: reducedMotion ? 0.28 : active ? 0.5 : 0.36,
              }}
            >
              <div
                className={`absolute inset-0 rounded-full border border-white/10 bg-gradient-to-b ${colors.glow} shadow-[0_0_60px_rgba(251,191,36,0.08)]`}
              />
              <div
                className={`absolute left-[12%] right-[12%] top-[18%] bottom-[18%] rounded-full border border-white/10 bg-stone-950/85 ${reducedMotion ? "" : "transition-transform duration-300 ease-out"}`}
                style={{
                  transform: `translate3d(${dx}px, ${dy}px, 0)`,
                }}
              >
                <div
                  className={`absolute inset-[28%] rounded-full ${colors.iris} blur-[0.4px]`}
                  style={{
                    transform: `translate3d(${dx * 0.45}px, ${dy * 0.45}px, 0)`,
                  }}
                />
                <div
                  className={`absolute inset-[42%] rounded-full ${colors.pupil}`}
                  style={{
                    transform: `translate3d(${dx * 0.72}px, ${dy * 0.72}px, 0)`,
                  }}
                />
                <div className="absolute left-[18%] top-[16%] h-[12%] w-[30%] rounded-full bg-white/40 blur-sm" />
              </div>
              <div className="absolute inset-x-[18%] bottom-[-10%] h-[14%] rounded-full bg-black/30 blur-md" />
            </div>
          );
        })}
      </div>
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.04), transparent 30%), radial-gradient(circle at var(--ambient-x) var(--ambient-y), rgba(255,255,255,0.05), transparent 24%)",
        }}
      />
    </div>
  );
}

