import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryForm } from "@/components/forms/category-form";
import { useCategories } from "@/hooks/use-categories";
import { CategoriesProvider } from "@/providers/categories.provider";
import { handleError } from "@/utils/toast.helpers";
import type { IOption } from "@/interfaces/api.interface";

function ViewCategory() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedCategory, selectCategory } = useCategories();

  const handleBack = () => {
    navigate("/categories");
  };

  useEffect(() => {
    if (!id) {
      navigate("/categories");
      return;
    }

    selectCategory(id).catch((error) => {
      handleError(error, "Erro ao carregar dados da categoria");
      navigate("/categories");
    });
  }, [id, navigate, selectCategory]);

  if (!selectedCategory) {
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Carregando categoria...
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
          <CardTitle>Visualizar Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm
            onSubmit={() => {}}
            onBack={handleBack}
            isLoading={false}
            initialData={selectedCategory}
            disabled={true}
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

export default function ViewCategoryPageWrapper() {
  return (
    <CategoriesProvider>
      <ViewCategory />
    </CategoriesProvider>
  );
}
