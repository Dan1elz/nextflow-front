import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/forms/login-form";
import { useAuth } from "@/hooks/use-auth";
import { SESSION_MESSAGE_KEY } from "@/providers/auth.provider";
import { handleError } from "@/utils/toast.helpers";
import { NextflowLogo } from "@/components/app/NextflowLogo";

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <NextflowLogo className="h-12 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold">Bem-vindo</CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm onSubmit={login} />
        </CardContent>
      </Card>
    </div>
  );
}
