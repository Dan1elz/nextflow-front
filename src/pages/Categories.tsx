import { Fragment, useEffect, useState } from "react";
import { CornerDownRight, Plus, Tag } from "lucide-react";

import { NavActionColumn } from "@/components/app/nav-action-column";
import { CategoryForm } from "@/components/forms/category-form";
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCategories } from "@/hooks/use-categories";
import type { CategoryNodeDto } from "@/interfaces/category.interface";
import { CategoriesProvider } from "@/providers/categories.provider";
import type { CategoryFormData } from "@/schemas/category.schema";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

type CategoryDialog = {
  category: CategoryNodeDto | null;
  parent: CategoryNodeDto | null;
} | null;

function Categories() {
  const {
    tree,
    loading,
    loadTree,
    createCategory,
    updateCategory,
    deleteCategory,
    reactivateCategory,
  } = useCategories();
  const [dialog, setDialog] = useState<CategoryDialog>(null);

  useEffect(() => {
    loadTree().catch((error) =>
      handleError(error, "Erro ao buscar categorias")
    );
  }, [loadTree]);

  const run = async (action: () => Promise<void>, success: string) => {
    try {
      await action();
      handleSuccess(success);
    } catch (error) {
      handleError(error);
    }
  };

  const handleSave = async (data: CategoryFormData) => {
    const dto = {
      name: data.name,
      description: data.description.trim() || null,
      parentId: data.parentId || null,
    };
    if (dialog?.category) {
      await updateCategory(dialog.category.id, dto);
      handleSuccess("Categoria atualizada com sucesso");
    } else {
      await createCategory(dto);
      handleSuccess("Categoria criada com sucesso");
    }
    setDialog(null);
  };

  const renderRow = (
    category: CategoryNodeDto,
    parent: CategoryNodeDto | null
  ) => (
    <TableRow key={category.id}>
      <TableCell>
        <div
          className={parent ? "flex items-center gap-2 pl-6" : "font-medium"}
        >
          {parent && (
            <CornerDownRight
              aria-hidden
              className="size-4 text-muted-foreground"
            />
          )}
          {category.name}
        </div>
      </TableCell>
      <TableCell className="max-w-64 truncate">
        {category.description ?? "-"}
      </TableCell>
      <TableCell>{category.productCount}</TableCell>
      <TableCell>
        <Badge variant={category.isActive ? "default" : "secondary"}>
          {category.isActive ? "Ativa" : "Inativa"}
        </Badge>
      </TableCell>
      <TableCell className="max-md:sticky max-md:right-0 max-md:bg-card">
        <NavActionColumn
          object={category}
          onEdit={() => setDialog({ category, parent })}
          onDelete={() =>
            run(
              () => deleteCategory(category.id),
              "Categoria inativada com sucesso"
            )
          }
          onReactivate={() =>
            run(
              () => reactivateCategory(category.id),
              "Categoria reativada com sucesso"
            )
          }
          disableView
          disableEdit={!category.isActive}
          disableDelete={!category.isActive}
          disableReactivate={category.isActive}
          deleteLabel="Inativar"
          deleteDialogTitle="Inativar esta categoria?"
          deleteDialogDescription="A categoria sai dos combos. Você pode reativá-la depois."
          deleteButtonLabel="Inativar"
          // RN-CE23: subcategoria não tem filhas, então a ação só existe no nível 1.
          extraActions={
            parent
              ? undefined
              : [
                  {
                    label: "Nova subcategoria",
                    icon: <Plus />,
                    disabled: !category.isActive,
                    onClick: () =>
                      setDialog({ category: null, parent: category }),
                  },
                ]
          }
        />
      </TableCell>
    </TableRow>
  );

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <CardTitle>Categorias</CardTitle>
            <CardDescription>
              Dois níveis: categoria e subcategoria.
            </CardDescription>
          </div>
          <Button onClick={() => setDialog({ category: null, parent: null })}>
            <Plus data-icon="inline-start" />
            Nova categoria
          </Button>
        </CardHeader>
        {!loading && tree.length > 0 && (
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Status</TableHead>
                  {/* No celular a tabela rola: as ações ficam fixas para não sumirem à direita. */}
                  <TableHead className="w-16 max-md:sticky max-md:right-0 max-md:bg-card">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tree.map((root) => (
                  <Fragment key={root.id}>
                    {renderRow(root, null)}
                    {root.children.map((child) => renderRow(child, root))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>

      {loading && <Skeleton className="h-48 w-full" />}

      {!loading && tree.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Tag />
            </EmptyMedia>
            <EmptyTitle>Nenhuma categoria cadastrada</EmptyTitle>
            <EmptyDescription>
              Crie a primeira categoria para organizar os produtos.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.category ? "Editar" : "Nova"}{" "}
              {dialog?.parent ? "subcategoria" : "categoria"}
            </DialogTitle>
            <DialogDescription>
              {dialog?.parent
                ? `Subcategoria de ${dialog.parent.name}.`
                : "Sem categoria pai, ela fica no nível 1."}
            </DialogDescription>
          </DialogHeader>
          {dialog && (
            <CategoryForm
              initialData={dialog.category}
              parent={dialog.parent}
              onSubmit={handleSave}
              onCancel={() => setDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CategoriesPageWrapper() {
  return (
    <CategoriesProvider>
      <Categories />
    </CategoriesProvider>
  );
}
