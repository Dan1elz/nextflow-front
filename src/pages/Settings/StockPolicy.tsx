import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";

import { StockPolicyForm } from "@/components/forms/stock-policy-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStockPolicies } from "@/hooks/use-stock-policies";
import type { StockPolicyDto } from "@/interfaces/stock-policy.interface";
import { StockPoliciesProvider } from "@/providers/stock-policies.provider";
import type { StockPolicyFormData } from "@/schemas/stock-policy.schema";
import { ABC_CLASS_LABELS, TAbcClass } from "@/types/enums";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

/** Regra de cada classe pela receita (RN-CE29): texto fixo, a análise é que classifica. */
const CLASS_RULES: Record<TAbcClass, string> = {
  A: "80% da receita",
  B: "Próximos 15% da receita",
  C: "Últimos 5% da receita",
};

/** T13: cobertura alvo e dias de segurança por classe ABC. O produto com cobertura própria é a exceção. */
function StockPolicySettings() {
  const { policies, loading, loadPolicies, updatePolicy } = useStockPolicies();
  const [editing, setEditing] = useState<StockPolicyDto | null>(null);

  useEffect(() => {
    loadPolicies().catch((error) =>
      handleError(error, "Erro ao carregar a política de estoque")
    );
  }, [loadPolicies]);

  const handleSave = async (data: StockPolicyFormData) => {
    if (!editing) return;
    await updatePolicy(editing.id, {
      targetCoverageDays: Number(data.targetCoverageDays),
      safetyDays: Number(data.safetyDays),
    });
    handleSuccess("Política atualizada com sucesso");
    setEditing(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Política de estoque</CardTitle>
          <CardDescription>
            A classe ABC de cada produto é recalculada a cada análise de
            previsão. Produto com cobertura alvo própria ignora a da classe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <>
              {/* Celular: um card por classe. */}
              <div className="flex flex-col gap-3 md:hidden">
                {policies.map((policy) => (
                  <div
                    key={policy.id}
                    className="flex flex-col gap-3 rounded-xl border p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-col gap-1">
                        <Badge variant="outline" className="self-start">
                          {ABC_CLASS_LABELS[policy.abcClass]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {CLASS_RULES[policy.abcClass]}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar ${ABC_CLASS_LABELS[policy.abcClass]}`}
                        onClick={() => setEditing(policy)}
                      >
                        <Pencil />
                      </Button>
                    </div>
                    <dl className="grid grid-cols-3 gap-2 text-center">
                      <div className="flex flex-col gap-0.5 rounded-lg bg-muted p-2">
                        <dt className="text-xs text-muted-foreground">
                          Cobertura
                        </dt>
                        <dd className="font-semibold">
                          {policy.targetCoverageDays} dias
                        </dd>
                      </div>
                      <div className="flex flex-col gap-0.5 rounded-lg bg-muted p-2">
                        <dt className="text-xs text-muted-foreground">
                          Segurança
                        </dt>
                        <dd className="font-semibold">
                          {policy.safetyDays} dias
                        </dd>
                      </div>
                      <div className="flex flex-col gap-0.5 rounded-lg bg-muted p-2">
                        <dt className="text-xs text-muted-foreground">
                          Produtos
                        </dt>
                        <dd className="font-semibold">{policy.productCount}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto rounded-lg border md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Classe</TableHead>
                      <TableHead>Regra</TableHead>
                      <TableHead className="text-right">
                        Cobertura alvo
                      </TableHead>
                      <TableHead className="text-right">
                        Dias de segurança
                      </TableHead>
                      <TableHead className="text-right">Produtos</TableHead>
                      <TableHead className="sr-only">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policies.map((policy) => (
                      <TableRow key={policy.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {ABC_CLASS_LABELS[policy.abcClass]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {CLASS_RULES[policy.abcClass]}
                        </TableCell>
                        <TableCell className="text-right">
                          {policy.targetCoverageDays} dias
                        </TableCell>
                        <TableCell className="text-right">
                          {policy.safetyDays} dias
                        </TableCell>
                        <TableCell className="text-right">
                          {policy.productCount}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Editar ${ABC_CLASS_LABELS[policy.abcClass]}`}
                            onClick={() => setEditing(policy)}
                          >
                            <Pencil />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? ABC_CLASS_LABELS[editing.abcClass] : "Classe"}
            </DialogTitle>
            <DialogDescription>
              Cobertura alvo e dias de segurança, em dias inteiros de 0 a 365.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <StockPolicyForm
              initialData={editing}
              onSubmit={handleSave}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function StockPolicySettingsPage() {
  return (
    <StockPoliciesProvider>
      <StockPolicySettings />
    </StockPoliciesProvider>
  );
}
