"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const standardTransition = { duration: 0.18, ease: "easeOut" } as const;
const fastTransition = { duration: 0.14, ease: "easeOut" } as const;

type MotionContainerProps = {
  children: ReactNode;
  className?: string;
};

export function DashboardTabTransition({ activeKey, children }: MotionContainerProps & { activeKey: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={activeKey}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
        transition={reduceMotion ? { duration: 0 } : standardTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function DashboardPanelMotion({ children, className }: MotionContainerProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : fastTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function DashboardListItemMotion({ children, className }: MotionContainerProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
      transition={reduceMotion ? { duration: 0 } : fastTransition}
      className={cn("min-w-0", className)}
    >
      {children}
    </motion.div>
  );
}