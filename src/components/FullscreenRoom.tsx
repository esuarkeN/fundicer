import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { DieConfig } from "@/data/dice";

type FullscreenRoomProps = {
  die: DieConfig;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function FullscreenRoom({
  die,
  children,
  className = "",
  contentClassName = "",
}: FullscreenRoomProps) {
  return (
    <motion.main
      animate={{ opacity: 1 }}
      className={`min-h-screen bg-black text-stone-100 ${className}`}
      initial={{ opacity: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
    >
      <div className="flex min-h-screen flex-col">
        <header className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-white/10 bg-black/92 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
          <Link
            className="rounded-full border border-white/12 px-4 py-2 text-[0.68rem] uppercase tracking-[0.28em] text-stone-200 transition hover:border-white/24 hover:bg-white/6"
            to="/"
          >
            Overview
          </Link>

          <div className="min-w-0 text-center">
            <p className="font-curse text-[0.58rem] uppercase tracking-[0.34em] text-stone-500">{die.id}</p>
            <h1 className="truncate text-sm uppercase tracking-[0.24em] text-stone-100 sm:text-base">{die.roomTitle}</h1>
          </div>

          <div className="hidden justify-self-end rounded-full border border-white/10 px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.28em] text-stone-400 sm:block">
            {die.name}
          </div>
        </header>

        <div className={`flex-1 ${contentClassName}`}>{children}</div>
      </div>
    </motion.main>
  );
}
