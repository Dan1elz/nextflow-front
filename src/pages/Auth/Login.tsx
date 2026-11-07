import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { BarChart3, Boxes, Sparkles } from "lucide-react";
import { LoginForm } from "@/components/forms/login-form";
import { NextflowLogo } from "@/components/app/NextflowLogo";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/primitives";
import { useAuth } from "@/hooks/use-auth";
import { SESSION_MESSAGE_KEY } from "@/providers/auth.provider";
import { handleError } from "@/utils/toast.helpers";

const highlights = [
  { icon: BarChart3, text: "Vendas e faturamento em tempo real" },
  { icon: Boxes, text: "Estoque, compras e fornecedores num só lugar" },
  { icon: Sparkles, text: "Previsão de demanda com inteligência artificial" },
];

function BrandPanel() {
  const reduce = useReducedMotion();
  const float = (duration: number, delay = 0) =>
    reduce
      ? {}
      : {
          animate: {
            x: [0, 40, -20, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.1, 0.95, 1],
          },
          transition: {
            duration,
            delay,
            repeat: Infinity,
            ease: "easeInOut" as const,
          },
        };

  return (
    <div className="relative hidden overflow-hidden bg-[oklch(0.2_0.12_293)] lg:flex lg:flex-col lg:justify-between lg:p-14">
      {/* Orbes de luz em movimento lento */}
      <motion.div
        className="absolute -left-24 -top-24 size-[480px] rounded-full bg-[oklch(0.541_0.281_293)] opacity-60 blur-[110px]"
        {...float(18)}
      />
      <motion.div
        className="absolute -bottom-32 -right-20 size-[520px] rounded-full bg-[oklch(0.62_0.22_320)] opacity-40 blur-[120px]"
        {...float(22, 2)}
      />
      <motion.div
        className="absolute left-1/3 top-1/2 size-[300px] rounded-full bg-[oklch(0.7_0.15_260)] opacity-30 blur-[100px]"
        {...float(26, 4)}
      />
      {/* Grão sutil para dar profundidade */}
      <div className="absolute inset-0 bg-[radial-gradient(oklch(1_0_0/6%)_1px,transparent_1px)] [background-size:24px_24px]" />

      <Reveal className="relative z-10 text-sm font-medium text-white/70">
        ERP para o seu negócio
      </Reveal>

      <div className="relative z-10 max-w-lg">
        <Reveal delay={0.1}>
          <h2 className="text-5xl font-semibold leading-[1.05] tracking-tight text-white xl:text-6xl">
            Gestão simples.
            <br />
            <span className="bg-gradient-to-r from-white to-violet-300 bg-clip-text text-transparent">
              Decisões melhores.
            </span>
          </h2>
        </Reveal>
        <Stagger
          className="mt-10 space-y-4"
          transition={{ delayChildren: 0.4 }}
        >
          {highlights.map(({ icon: Icon, text }) => (
            <StaggerItem
              key={text}
              className="flex items-center gap-3.5 text-[15px] text-white/80"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
                <Icon className="size-[18px]" />
              </span>
              {text}
            </StaggerItem>
          ))}
        </Stagger>
      </div>

      <p className="relative z-10 text-xs text-white/40">
        © {new Date().getFullYear()} Nextflow
      </p>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();

  useEffect(() => {
    const message = sessionStorage.getItem(SESSION_MESSAGE_KEY);
    if (message) {
      handleError(null, message);
      sessionStorage.removeItem(SESSION_MESSAGE_KEY);
    }
  }, []);

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="brand-glow relative flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Reveal>
            <NextflowLogo className="mb-12 h-10 w-auto" />
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="text-4xl font-semibold tracking-tight">Bem-vindo</h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Entre com suas credenciais para acessar o sistema.
            </p>
          </Reveal>
          <Reveal delay={0.16} className="mt-8">
            <LoginForm onSubmit={login} />
          </Reveal>
        </div>
      </div>
      <BrandPanel />
    </div>
  );
}
