import { useEffect, useRef, type ReactNode } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type HTMLMotionProps,
} from "motion/react";
import { easeApple } from "./tokens";

type RevealProps = HTMLMotionProps<"div"> & {
  delay?: number;
  y?: number;
  children?: ReactNode;
};

/** Entra com fade + leve subida. */
export function Reveal({ delay = 0, y = 14, children, ...props }: RevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: easeApple }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeApple },
  },
};

/** Container que revela os filhos `StaggerItem` em cascata. */
export function Stagger({ children, ...props }: HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={container}
      initial={reduce ? "show" : "hidden"}
      animate="show"
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div variants={item} {...props}>
      {children}
    </motion.div>
  );
}

/** Revela quando entra na viewport (scroll). */
export function InView({
  children,
  delay = 0,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: easeApple }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type CountUpProps = {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
};

/** Número que "rola" até o valor final quando aparece na tela. */
export function CountUp({
  value,
  format = (n) => Math.round(n).toLocaleString("pt-BR"),
  duration = 1.1,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce ? value : 0);
  const text = useTransform(mv, (n) => format(n));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, value, {
      duration: reduce ? 0 : duration,
      ease: easeApple,
    });
    return () => controls.stop();
  }, [inView, value, duration, reduce, mv]);

  return (
    <motion.span ref={ref} className={className}>
      {text}
    </motion.span>
  );
}
