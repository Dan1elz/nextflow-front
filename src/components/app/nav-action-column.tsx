import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CircleFadingArrowUp,
  EditIcon,
  EllipsisVertical,
  EyeIcon,
  TrashIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface IHasId {
  id?: string;
}

interface NavActionColumnProps<T extends IHasId> {
  object: T;
  onEdit?: (object: T) => void;
  onDelete?: (object: T, reason?: string) => void;
  onView?: (object: T) => void;
  onReactivate?: (object: T) => void;
  disableDelete?: boolean;
  disableEdit?: boolean;
  disableView?: boolean;
  disableReactivate?: boolean;
  deleteRequiresReason?: boolean;
  deleteReasonLabel?: string;
  deleteLabel?: string;
  deleteDialogTitle?: string;
  deleteDialogDescription?: string;
  deleteButtonLabel?: string;
  deleteReasonOptions?: string[];
}

const OTHER_OPTION = "__other__";

export function NavActionColumn<T extends IHasId>({
  object,
  onEdit,
  onDelete,
  onView,
  onReactivate,
  disableDelete = false,
  disableEdit = false,
  disableView = false,
  disableReactivate = false,
  deleteRequiresReason = false,
  deleteReasonLabel = "Motivo da exclusão:",
  deleteLabel = "Excluir",
  deleteDialogTitle = "Deseja realmente excluir?",
  deleteDialogDescription = "Esta ação não pode ser desfeita. Todos os dados serão permanentemente deletados.",
  deleteButtonLabel = "Excluir",
  deleteReasonOptions,
}: NavActionColumnProps<T>) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");

  const handleDeleteClick = () => {
    setDeleteReason("");
    setSelectedPreset("");
    setIsDeleteDialogOpen(true);
  };

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    if (value !== OTHER_OPTION) {
      setDeleteReason(value);
    } else {
      setDeleteReason("");
    }
  };

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(object, deleteReason);
    }
    setIsDeleteDialogOpen(false);
  };

  const isReasonValid = !deleteRequiresReason || deleteReason.trim().length > 0;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <EllipsisVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {onView && !disableView && (
            <DropdownMenuItem onClick={() => onView(object)}>
              <EyeIcon className="mr-2 h-4 w-4" />
              Visualizar
            </DropdownMenuItem>
          )}

          {onEdit && !disableEdit && (
            <DropdownMenuItem onClick={() => onEdit(object)}>
              <EditIcon className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
          )}

          {onReactivate && !disableReactivate && (
            <DropdownMenuItem onClick={() => onReactivate(object)}>
              <CircleFadingArrowUp className="mr-2 h-4 w-4" />
              Reativar
            </DropdownMenuItem>
          )}

          {onDelete && !disableDelete && (
            <DropdownMenuItem
              onClick={handleDeleteClick}
              className="text-destructive focus:text-destructive"
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              {deleteLabel}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {onDelete && (
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader className="text-left">
              <AlertDialogTitle>{deleteDialogTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteDialogDescription}
              </AlertDialogDescription>
              {deleteRequiresReason && (
                <div className="grid gap-3 mt-4 py-2 text-left">
                  <Label>{deleteReasonLabel}</Label>
                  {deleteReasonOptions && deleteReasonOptions.length > 0 ? (
                    <>
                      <Select
                        value={selectedPreset}
                        onValueChange={handlePresetChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um motivo..." />
                        </SelectTrigger>
                        <SelectContent>
                          {deleteReasonOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                          <SelectItem value={OTHER_OPTION}>Outros</SelectItem>
                        </SelectContent>
                      </Select>
                      {selectedPreset === OTHER_OPTION && (
                        <Input
                          value={deleteReason}
                          onChange={(e) => setDeleteReason(e.target.value)}
                          placeholder="Descreva o motivo..."
                        />
                      )}
                    </>
                  ) : (
                    <Input
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      placeholder="Descreva o motivo..."
                    />
                  )}
                </div>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={!isReasonValid}
              >
                {deleteButtonLabel}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
