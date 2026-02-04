import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryForm } from "@/components/forms/category-form";
import { useCategories } from "@/hooks/use-categories";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { CategoriesProvider } from "@/providers/categories.provider";
import type { CategorySchema } from "@/schemas/category.schema";
import type { ICategory } from "@/interfaces/category.interface";
import type { IOption } from "@/interfaces/api.interface";

function CreateCategory() {
  const navigate = useNavigate();
  const { createCategory } = useCategories();
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    navigate("/categories");
  };

  const handleSubmit = async (data: CategorySchema) => {
    try {
      setIsLoading(true);

      const categoryData: Partial<ICategory> = {
        description: data.description,
      };

      await createCategory(categoryData as ICategory);
      handleSuccess("Categoria criada com sucesso");
      navigate("/categories");
    } catch (error) {
      handleError(error, "Erro ao criar categoria");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Criar Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm
            onSubmit={handleSubmit}
            onBack={handleBack}
            isLoading={isLoading}
            isEdit={false}
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

export default function CreateCategoryPageWrapper() {
  return (
    <CategoriesProvider>
      <CreateCategory />
    </CategoriesProvider>
  );
}
