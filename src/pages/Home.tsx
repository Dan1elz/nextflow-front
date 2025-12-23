import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Home() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao Sistema ERP</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Selecione uma opção no menu para começar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
