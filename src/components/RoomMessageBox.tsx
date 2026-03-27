import { motion } from "framer-motion";
import type { ReactNode } from "react";

type MessageTone = "cyan" | "indigo" | "amber" | "emerald";
type MessageVariant = "modal" | "notice";
type MessagePlacement = "center" | "top-left" | "top-right" | "bottom-center";

type ToneStyles = {
  kicker: string;
  panel: string;
  accent: string;
};

const TONES: Record<MessageTone, ToneStyles> = {
  cyan: {
    kicker: "text-cyan-100/72",
    panel: "border-cyan-100/16 shadow-[0_30px_120px_-40px_rgba(34,211,238,0.2)]",
    accent: "border-cyan-100/20 bg-cyan-100/8 text-cyan-50 hover:border-cyan-100/34 hover:bg-cyan-100/14",
  },
  indigo: {
    kicker: "text-indigo-100/72",
    panel: "border-indigo-100/18 shadow-[0_30px_120px_-40px_rgba(129,140,248,0.22)]",
    accent:
      "border-indigo-100/20 bg-indigo-100/8 text-indigo-50 hover:border-indigo-100/34 hover:bg-indigo-100/14",
  },
  amber: {
    kicker: "text-amber-100/72",
    panel: "border-amber-100/16 shadow-[0_30px_120px_-40px_rgba(251,191,36,0.2)]",
    accent:
      "border-amber-100/20 bg-amber-100/8 text-amber-50 hover:border-amber-100/34 hover:bg-amber-100/14",
  },
  emerald: {
    kicker: "text-emerald-100/72",
    panel: "border-emerald-100/16 shadow-[0_30px_120px_-40px_rgba(52,211,153,0.2)]",
    accent:
      "border-emerald-100/20 bg-emerald-100/8 text-emerald-50 hover:border-emerald-100/34 hover:bg-emerald-100/14",
  },
};

const NOTICE_PLACEMENT: Record<Exclude<MessagePlacement, "center">, string> = {
  "top-left": "items-start justify-start",
  "top-right": "items-start justify-end",
  "bottom-center": "items-end justify-center",
};

type RoomMessageBoxProps = {
  kicker: string;
  title: string;
  description: string;
  actions?: ReactNode;
  tone?: MessageTone;
  variant?: MessageVariant;
  placement?: MessagePlacement;
  onDismiss?: () => void;
  dismissLabel?: string;
};

export function RoomMessageBox({
  kicker,
  title,
  description,
  actions,
  tone = "cyan",
  variant = "modal",
  placement = "center",
  onDismiss,
  dismissLabel = "Dismiss",
}: RoomMessageBoxProps) {
  const styles = TONES[tone];
  const isNotice = variant === "notice";
  const containerClassName = isNotice
    ? `pointer-events-none absolute inset-0 z-20 flex p-4 sm:p-6 ${NOTICE_PLACEMENT[placement === "center" ? "top-left" : placement]}`
    : "absolute inset-0 z-20 flex items-center justify-center bg-black/78 px-4";
  const panelClassName = isNotice
    ? `pointer-events-auto w-full max-w-sm rounded-[1.75rem] border bg-[linear-gradient(180deg,rgba(10,10,12,0.94),rgba(0,0,0,0.98))] p-5 text-left sm:p-6 ${styles.panel}`
    : `w-full max-w-md rounded-[2rem] border bg-[linear-gradient(180deg,rgba(10,10,12,0.96),rgba(0,0,0,1))] p-6 text-center sm:p-8 ${styles.panel}`;
  const actionClassName = isNotice ? "mt-5 flex flex-wrap gap-3" : "mt-6 flex flex-col gap-3 sm:flex-row";

  return (
    <div aria-live={isNotice ? "polite" : undefined} className={containerClassName} role={isNotice ? "status" : "dialog"}>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className={panelClassName}
        initial={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.24 }}
      >
        <div className={`flex gap-4 ${isNotice ? "items-start justify-between" : "flex-col items-center"}`}>
          <div className={isNotice ? "min-w-0 flex-1" : "w-full"}>
            <p className={`font-curse text-[0.66rem] uppercase tracking-[0.34em] ${styles.kicker}`}>{kicker}</p>
            <h2 className={`text-stone-50 ${isNotice ? "mt-3 text-xl sm:text-2xl" : "mt-4 text-2xl sm:text-3xl"}`}>{title}</h2>
            <p className={`text-sm leading-6 text-stone-300/78 ${isNotice ? "mt-3" : "mt-4"}`}>{description}</p>
          </div>

          {onDismiss ? (
            <button
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.28em] transition ${styles.accent}`}
              onClick={onDismiss}
              type="button"
            >
              {dismissLabel}
            </button>
          ) : null}
        </div>

        {actions ? <div className={actionClassName}>{actions}</div> : null}
      </motion.div>
    </div>
  );
}
