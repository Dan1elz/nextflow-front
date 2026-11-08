import { useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { easeApple } from "./tokens";

/**
 * Transição entre rotas: a página nova entra com fade + leve deslocamento.
 * Sem animação de saída de propósito: o <Outlet> do elemento que sai já lê a rota nova,
 * então um exit com AnimatePresence montaria a página nova duas vezes (e dispararia os fetches em dobro).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  // Na primeira carga não anima (as páginas já têm o próprio Reveal); só a partir da 1ª navegação.
  const [prevPath, setPrevPath] = useState(pathname);
  const [navigated, setNavigated] = useState(false);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setNavigated(true);
  }

  return (
    <motion.div
      key={pathname}
      initial={
        reduce || !navigated
          ? false
          : { opacity: 0, y: 10, filter: "blur(4px)" }
      }
      // Limpa o filter no fim: com filter ativo o wrapper vira containing block de position: fixed.
      animate={{
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transitionEnd: { filter: "none" },
      }}
      transition={{ duration: 0.45, ease: easeApple }}
    >
      {children}
    </motion.div>
  );
}
