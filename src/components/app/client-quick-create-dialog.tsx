import { ClientQuickForm } from "@/components/forms/client-quick-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import type {
  ClientOptionDto,
  QuickCreateClientRequestDto,
} from "@/interfaces/client.interface";
import { clientService } from "@/services/client.service";
import { handleSuccess } from "@/utils/toast.helpers";

interface ClientQuickCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (client: ClientOptionDto) => void;
}

/** Novo cliente na hora da venda (T-CD4): grava em Pessoas e devolve a opção já pronta para o combo. */
export function ClientQuickCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: ClientQuickCreateDialogProps) {
  const { token } = useAuth();

  const handleSubmit = async (dto: QuickCreateClientRequestDto) => {
    const client = await clientService.quickCreate(dto, token ?? undefined);
    handleSuccess("Cliente cadastrado");
    onOpenChange(false);
    onCreated(client);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo cliente</DialogTitle>
          <DialogDescription>
            Nome e telefone bastam para a venda; o resto do cadastro pode ser
            completado depois em Clientes.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ClientQuickForm
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
