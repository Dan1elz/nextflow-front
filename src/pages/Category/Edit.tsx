import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryForm } from "@/components/forms/category-form";
import { useCategories } from "@/hooks/use-categories";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { CategoriesProvider } from "@/providers/categories.provider";
import type { CategorySchema } from "@/schemas/category.schema";
import type { ICategory } from "@/interfaces/category.interface";
import type { IOption } from "@/interfaces/api.interface";

function EditCategory() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedCategory, selectCategory, updateCategory } = useCategories();
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    navigate("/categories");
  };

  useEffect(() => {
    if (!id) {
      navigate("/categories");
      return;
    }

    selectCategory(id).catch((error) => {
      handleError(error, "Erro ao buscar categoria");
      navigate("/categories");
    });
  }, [id, navigate, selectCategory]);

  const handleSubmit = async (data: CategorySchema) => {
    if (!id) return;

    try {
      setIsLoading(true);

      const categoryData: ICategory = {
        id: id,
        description: data.description,
      };

      await updateCategory(id, categoryData);
      handleSuccess("Categoria atualizada com sucesso");
      navigate("/categories");
    } catch (error) {
      handleError(error, "Erro ao atualizar categoria");
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedCategory) {
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground italic">
              Carregando dados da categoria...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Editar Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm
            onSubmit={handleSubmit}
            onBack={handleBack}
            isLoading={isLoading}
            initialData={selectedCategory}
            isEdit={true}
            data={[]}
            onSearch={function ():
              | Promise<IOption[] | void>
              | IOption[]
              | void {
              throw new Error("Function not implemented.");
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditCategoryPageWrapper() {
  return (
    <CategoriesProvider>
      <EditCategory />
    </CategoriesProvider>
  );
}
