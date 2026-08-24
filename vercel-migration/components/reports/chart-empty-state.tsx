"use client";

import { motion, easeInOut } from "framer-motion";
import { ReactNode } from "react";

interface ChartEmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

const sparkAnimation = {
  animate: {
    opacity: [0.1, 0.35, 0.1],
    scale: [0.9, 1.05, 0.9],
    transition: {
  duration: 4,
  ease: easeInOut,
      repeat: Infinity,
      repeatType: "mirror" as const
    }
  }
};

export default function ChartEmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction
}: ChartEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="h-full"
    >
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 rounded-2xl border border-white/20 bg-white/[0.05] px-6 py-10 text-center shadow-[0_22px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
        <motion.div
          className="pointer-events-none absolute inset-6 rounded-2xl bg-gradient-to-br from-indigo-400/20 via-purple-400/15 to-transparent blur-3xl"
          {...sparkAnimation}
        />

        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-indigo-500/85 via-purple-500/85 to-fuchsia-500/85 text-white shadow-lg shadow-indigo-500/30">
          {icon ?? (
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M9 19V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10M9 19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m6 6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2"
              />
            </svg>
          )}
        </div>

        <div className="relative space-y-2">
          <h4 className="text-lg font-semibold text-white">{title}</h4>
          <p className="max-w-xs text-sm text-white/70">
            {description}
          </p>
        </div>

        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </motion.div>
  );
}
