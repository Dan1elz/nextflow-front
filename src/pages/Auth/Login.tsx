import { useEffect } from "react";
import { LoginForm } from "@/components/forms/login-form";
import { NextflowLogo } from "@/components/app/NextflowLogo";
import { Reveal } from "@/components/motion/primitives";
import { useAuth } from "@/hooks/use-auth";
import { SESSION_MESSAGE_KEY } from "@/providers/auth.provider";
import { handleError } from "@/utils/toast.helpers";

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
    <div className="brand-glow relative flex min-h-screen items-center justify-center bg-background p-6 sm:p-12">
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
  );
}
