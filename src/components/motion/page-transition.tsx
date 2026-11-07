import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { easeApple } from "./tokens";

/** Transição entre rotas: fade + leve deslocamento, sem bloquear a navegação. */
export function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        initial={reduce ? false : { opacity: 0, y: 10, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, transition: { duration: 0.12 } }}
        transition={{ duration: 0.45, ease: easeApple }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
