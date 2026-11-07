/** Curva usada em todo o app: desacelera suave, como o iOS. */
export const easeApple = [0.32, 0.72, 0, 1] as const;

export const spring = {
  type: "spring",
  stiffness: 380,
  damping: 30,
  mass: 0.8,
} as const;
