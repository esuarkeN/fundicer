import { motion } from "framer-motion";
import { useState, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "react-router-dom";
import { DecryptText } from "@/components/DecryptText";
import type { DieConfig } from "@/data/dice";

type PortalCardProps = {
  die: DieConfig;
};

type Tilt = {
  x: number;
  y: number;
  rotateX: number;
  rotateY: number;
};

const RESET_TILT: Tilt = {
  x: 0,
  y: 0,
  rotateX: 0,
  rotateY: 0,
};

export function PortalCard({ die }: PortalCardProps) {
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState<Tilt>(RESET_TILT);

  function handleMove(event: ReactPointerEvent<HTMLAnchorElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
    const offsetY = (event.clientY - rect.top) / rect.height - 0.5;

    setTilt({
      x: offsetX * 18,
      y: offsetY * 12,
      rotateX: offsetY * -12,
      rotateY: offsetX * 14,
    });
  }

  return (
    <motion.article
      animate={{
        x: tilt.x,
        y: tilt.y,
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY,
        scale: hovered ? 1.02 : 1,
      }}
      className={`group relative rounded-[1.8rem] ${die.accent.glow}`}
      style={{ transformPerspective: 1200, transformStyle: "preserve-3d" }}
      transition={{ type: "spring", stiffness: 240, damping: 18, mass: 0.8 }}
    >
      <Link
        className={`room-panel vault-texture relative block min-h-[16rem] overflow-hidden rounded-[1.8rem] border p-5 ${die.accent.border}`}
        onBlur={() => {
          setHovered(false);
          setTilt(RESET_TILT);
        }}
        onFocus={() => {
          setHovered(true);
        }}
        onPointerEnter={() => {
          setHovered(true);
        }}
        onPointerLeave={() => {
          setHovered(false);
          setTilt(RESET_TILT);
        }}
        onPointerMove={handleMove}
        to={die.path}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${die.accent.card} opacity-90 transition-opacity duration-300 group-hover:opacity-100`} />
        <div className="absolute inset-x-5 top-5 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent" />

        <div className="relative z-10 flex h-full flex-col justify-between">
          <div>
            <p className="font-curse text-[0.66rem] uppercase tracking-[0.34em] text-stone-300/70">{die.id}</p>
            <DecryptText
              active={hovered}
              className={`mt-4 block text-2xl leading-tight ${die.accent.ink}`}
              text={die.portalTitle}
            />
            <p className="mt-3 text-sm leading-6 text-stone-200/84">{die.portalBlurb}</p>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <span className="rounded-full border border-white/12 bg-black/18 px-3 py-1.5 text-[0.66rem] uppercase tracking-[0.3em] text-stone-100/84">
              {die.alias}
            </span>
            <span className="text-sm text-stone-200/86">Enter room</span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
