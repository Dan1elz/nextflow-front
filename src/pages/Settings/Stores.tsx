import { useEffect, useState } from "react";
import { Plus, Store as StoreIcon } from "lucide-react";

import { NavActionColumn } from "@/components/app/nav-action-column";
import { LocationForm } from "@/components/forms/location-form";
import { StoreForm } from "@/components/forms/store-form";
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
import { useStores } from "@/hooks/use-stores";
import type {
  LocationResponseDto,
  StoreResponseDto,
} from "@/interfaces/store.interface";
import { StoresProvider } from "@/providers/stores.provider";
import type { LocationFormData, StoreFormData } from "@/schemas/store.schema";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

type StoreDialog = { store: StoreResponseDto | null } | null;
type LocationDialog = {
  store: StoreResponseDto;
  location: LocationResponseDto | null;
} | null;

function StoresSettings() {
  const {
    stores,
    loading,
    loadStores,
    createStore,
    updateStore,
    deleteStore,
    reactivateStore,
    createLocation,
    updateLocation,
    deleteLocation,
    reactivateLocation,
  } = useStores();
  const [storeDialog, setStoreDialog] = useState<StoreDialog>(null);
  const [locationDialog, setLocationDialog] = useState<LocationDialog>(null);

  useEffect(() => {
    loadStores().catch((error) => handleError(error, "Erro ao buscar lojas"));
  }, [loadStores]);

  const run = async (action: () => Promise<void>, success: string) => {
    try {
      await action();
      handleSuccess(success);
    } catch (error) {
      handleError(error);
    }
  };

  const handleSaveStore = async (data: StoreFormData) => {
    const store = storeDialog?.store;
    if (store) {
      await updateStore(store.id, data);
      handleSuccess("Loja atualizada com sucesso");
    } else {
      await createStore({ name: data.name });
      handleSuccess("Loja criada com sucesso");
    }
    setStoreDialog(null);
  };

  const handleSaveLocation = async (data: LocationFormData) => {
    if (!locationDialog) return;
    if (locationDialog.location) {
      await updateLocation(locationDialog.location.id, data);
      handleSuccess("Local atualizado com sucesso");
    } else {
      await createLocation({ ...data, storeId: locationDialog.store.id });
      handleSuccess("Local criado com sucesso");
    }
    setLocationDialog(null);
  };

  const locationName = (store: StoreResponseDto, id?: string | null) =>
    store.locations.find((location) => location.id === id)?.name ?? "-";

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <CardTitle>Lojas e locais</CardTitle>
            <CardDescription>
              Loja é onde se vende; local é onde a mercadoria fica.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setStoreDialog({ store: null })}>
              <Plus data-icon="inline-start" />
              Nova loja
            </Button>
          </div>
        </CardHeader>
      </Card>

      {loading && <Skeleton className="h-48 w-full" />}

      {!loading && stores.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <StoreIcon />
            </EmptyMedia>
            <EmptyTitle>Nenhuma loja cadastrada</EmptyTitle>
            <EmptyDescription>
              Crie a primeira loja para começar a vender e controlar o estoque.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {stores.map((store) => (
        <Card key={store.id}>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1.5">
              <CardTitle className="flex items-center gap-2">
                {store.name}
                <Badge variant={store.isActive ? "default" : "secondary"}>
                  {store.isActive ? "Ativa" : "Inativa"}
                </Badge>
              </CardTitle>
              <CardDescription>
                Venda: {locationName(store, store.defaultSaleLocationId)} ·
                Recebimento:{" "}
                {locationName(store, store.defaultReceiveLocationId)}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={!store.isActive}
                onClick={() => setLocationDialog({ store, location: null })}
              >
                <Plus data-icon="inline-start" />
                Novo local
              </Button>
              <NavActionColumn
                object={store}
                onEdit={() => setStoreDialog({ store })}
                onDelete={() =>
                  run(() => deleteStore(store.id), "Loja inativada com sucesso")
                }
                onReactivate={() =>
                  run(
                    () => reactivateStore(store.id),
                    "Loja reativada com sucesso"
                  )
                }
                disableView
                disableEdit={!store.isActive}
                disableDelete={!store.isActive}
                disableReactivate={store.isActive}
                deleteLabel="Inativar"
                deleteDialogTitle="Inativar esta loja?"
                deleteDialogDescription="A loja e os locais dela saem do seletor e dos combos. Você pode reativá-la depois."
                deleteButtonLabel="Inativar"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Local</TableHead>
                  <TableHead>Vendável</TableHead>
                  <TableHead>Padrão</TableHead>
                  <TableHead>Status</TableHead>
                  {/* No celular a tabela rola: as ações ficam fixas para não sumirem à direita. */}
                  <TableHead className="w-16 max-md:sticky max-md:right-0 max-md:bg-card">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.locations.map((location) => {
                  const isSale = store.defaultSaleLocationId === location.id;
                  const isReceive =
                    store.defaultReceiveLocationId === location.id;
                  return (
                    <TableRow key={location.id}>
                      <TableCell>{location.name}</TableCell>
                      <TableCell>
                        {location.isSellable ? "Sim" : "Não"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {isSale && <Badge variant="outline">Venda</Badge>}
                          {isReceive && (
                            <Badge variant="outline">Recebimento</Badge>
                          )}
                          {!isSale && !isReceive && "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={location.isActive ? "default" : "secondary"}
                        >
                          {location.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-md:sticky max-md:right-0 max-md:bg-card">
                        <NavActionColumn
                          object={location}
                          onEdit={() => setLocationDialog({ store, location })}
                          onDelete={() =>
                            run(
                              () => deleteLocation(location.id),
                              "Local inativado com sucesso"
                            )
                          }
                          onReactivate={() =>
                            run(
                              () => reactivateLocation(location.id),
                              "Local reativado com sucesso"
                            )
                          }
                          disableView
                          disableEdit={!store.isActive || !location.isActive}
                          // Decisão 7: a API recusa; aqui só não oferece inativar um padrão.
                          disableDelete={
                            !store.isActive ||
                            !location.isActive ||
                            isSale ||
                            isReceive
                          }
                          disableReactivate={
                            !store.isActive || location.isActive
                          }
                          deleteLabel="Inativar"
                          deleteDialogTitle="Inativar este local?"
                          deleteDialogDescription="O local sai dos combos. Você pode reativá-lo depois."
                          deleteButtonLabel="Inativar"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      <Dialog
        open={storeDialog !== null}
        onOpenChange={(open) => !open && setStoreDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {storeDialog?.store ? "Editar loja" : "Nova loja"}
            </DialogTitle>
            <DialogDescription>
              {storeDialog?.store
                ? "Nome e locais padrão da loja."
                : "Informe o nome da loja."}
            </DialogDescription>
          </DialogHeader>
          {storeDialog && (
            <StoreForm
              initialData={storeDialog.store}
              onSubmit={handleSaveStore}
              onCancel={() => setStoreDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={locationDialog !== null}
        onOpenChange={(open) => !open && setLocationDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {locationDialog?.location ? "Editar local" : "Novo local"}
            </DialogTitle>
            <DialogDescription>
              Loja: {locationDialog?.store.name}
            </DialogDescription>
          </DialogHeader>
          {locationDialog && (
            <LocationForm
              initialData={locationDialog.location}
              onSubmit={handleSaveLocation}
              onCancel={() => setLocationDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function StoresSettingsPage() {
  return (
    <StoresProvider>
      <StoresSettings />
    </StoresProvider>
  );
}
