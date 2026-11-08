import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore } from "@/hooks/use-current-store";
import type {
  IApplyPurchaseResult,
  IForecastRecommendationDetail,
  IForecastRecommendationListItem,
} from "@/interfaces/forecast.interface";
import type { LocationOptionDto } from "@/interfaces/store.interface";
import { ApiError } from "@/services/api.service";
import { forecastRunService } from "@/services/forecast-run.service";
import { purchaseOrderService } from "@/services/purchase-order.service";
import { storeService } from "@/services/store.service";
import {
  buildPurchaseRequest,
  lineKey,
  parseDecimal,
  parsePurchaseErrorField,
  type PurchaseGroupDraft,
  type PurchaseLine,
} from "@/utils/apply-purchase.helpers";

export interface PurchaseRecommendationView {
  recommendation: IForecastRecommendationListItem;
  detail: IForecastRecommendationDetail;
  lines: PurchaseLine[];
}

export interface PurchaseGroupView {
  supplierId: string;
  supplierName: string;
  receiveLocationId: string;
  note: string;
  items: PurchaseRecommendationView[];
}

type ChosenSupplier = { id: string; name: string };

/** Erros do formulário: `line:<rec>:<variante>:<campo>`, `group:<fornecedor>:<campo>`, `supplier:<rec>`. */
export type PurchaseErrors = Record<string, string>;

const lineErrorKey = (line: PurchaseLine, field: string) =>
  `line:${lineKey(line)}:${field}`;

function toLines(detail: IForecastRecommendationDetail): PurchaseLine[] {
  return detail.variantSplit.map((split) => ({
    recommendationId: detail.id,
    variantId: split.variantId,
    name: split.variantLabel
      ? `${detail.productName} (${split.variantLabel})`
      : detail.productName,
    quantity: String(split.suggestedQuantity),
    unitCost: "",
  }));
}

/** Estado e regras do dialog "Comprar" (T-DF4): carrega rateio, custos e locais; valida e envia. */
export function useApplyPurchase(
  recommendations: IForecastRecommendationListItem[]
) {
  const { token } = useAuth();
  const auth = token ?? undefined;
  const { storeId } = useCurrentStore();

  const [details, setDetails] = useState<
    Record<string, IForecastRecommendationDetail>
  >({});
  const [lines, setLines] = useState<Record<string, PurchaseLine[]>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [locations, setLocations] = useState<LocationOptionDto[]>([]);
  const [defaultLocationId, setDefaultLocationId] = useState("");
  const [groupLocation, setGroupLocation] = useState<Record<string, string>>(
    {}
  );
  const [groupNote, setGroupNote] = useState<Record<string, string>>({});
  const [chosen, setChosen] = useState<Record<string, ChosenSupplier>>({});
  const [clientErrors, setClientErrors] = useState<PurchaseErrors>({});
  const [serverErrors, setServerErrors] = useState<PurchaseErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fetchedCosts = useRef(new Set<string>());
  const [missingCost, setMissingCost] = useState<Set<string>>(new Set());

  // Rateio e memória do cálculo de cada recomendação (T-DF3).
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      recommendations.map((rec) =>
        forecastRunService.getRecommendation(rec.id, auth)
      )
    )
      .then((loaded) => {
        if (cancelled) return;
        setDetails(Object.fromEntries(loaded.map((d) => [d.id, d])));
        setLines(Object.fromEntries(loaded.map((d) => [d.id, toLines(d)])));
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setLoadError(
            error instanceof Error && error.message
              ? error.message
              : "Erro ao carregar as recomendações"
          );
      });
    return () => {
      cancelled = true;
    };
  }, [recommendations, auth]);

  // Locais de entrega e o padrão da loja selecionada.
  useEffect(() => {
    let cancelled = false;
    purchaseOrderService
      .locationOptions(auth)
      .then((options) => {
        if (!cancelled) setLocations(options);
      })
      .catch(() => undefined);
    if (storeId)
      storeService
        .getById(storeId, auth)
        .then((store) => {
          if (!cancelled)
            setDefaultLocationId(store.defaultReceiveLocationId ?? "");
        })
        .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [auth, storeId]);

  const supplierOf = useCallback(
    (rec: IForecastRecommendationListItem): ChosenSupplier | null =>
      rec.preferredSupplierId
        ? {
            id: rec.preferredSupplierId,
            name: rec.preferredSupplierName ?? "Fornecedor",
          }
        : (chosen[rec.id] ?? null),
    [chosen]
  );

  const loaded = recommendations.every((rec) => details[rec.id]);

  const { groups, unassigned } = useMemo(() => {
    const byId = new Map<string, PurchaseGroupView>();
    const pending: PurchaseRecommendationView[] = [];
    if (!loaded) return { groups: [], unassigned: pending };
    for (const rec of recommendations) {
      const view = {
        recommendation: rec,
        detail: details[rec.id],
        lines: lines[rec.id] ?? [],
      };
      const supplier = supplierOf(rec);
      if (!supplier) {
        pending.push(view);
        continue;
      }
      const group = byId.get(supplier.id) ?? {
        supplierId: supplier.id,
        supplierName: supplier.name,
        receiveLocationId: groupLocation[supplier.id] ?? defaultLocationId,
        note: groupNote[supplier.id] ?? "",
        items: [],
      };
      group.items.push(view);
      byId.set(supplier.id, group);
    }
    return { groups: [...byId.values()], unassigned: pending };
  }, [
    loaded,
    recommendations,
    details,
    lines,
    supplierOf,
    groupLocation,
    defaultLocationId,
    groupNote,
  ]);

  // Custo padrão: último custo do produto × fornecedor, senão o último custo do produto (T-DF4).
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    for (const group of groups) {
      const store =
        locations.find((l) => l.id === group.receiveLocationId)?.storeId ??
        storeId;
      if (!store) continue;
      for (const item of group.items)
        for (const line of item.lines) {
          const key = `${group.supplierId}:${lineKey(line)}`;
          if (line.unitCost !== "" || fetchedCosts.current.has(key)) continue;
          fetchedCosts.current.add(key);
          purchaseOrderService
            .itemSuggestion(group.supplierId, line.variantId, store, auth)
            .then((suggestion) => {
              if (!mounted.current) return;
              const cost =
                suggestion.lastCostFromSupplier ??
                suggestion.lastCost ??
                suggestion.averageCost ??
                null;
              if (cost === null) {
                setMissingCost((prev) => new Set(prev).add(lineKey(line)));
                return;
              }
              setLines((prev) => ({
                ...prev,
                [line.recommendationId]: prev[line.recommendationId].map((l) =>
                  l.variantId === line.variantId && l.unitCost === ""
                    ? { ...l, unitCost: String(cost) }
                    : l
                ),
              }));
            })
            .catch(() => fetchedCosts.current.delete(key));
        }
    }
  }, [groups, locations, storeId, auth]);

  const validate = useCallback((): PurchaseErrors => {
    const errors: PurchaseErrors = {};
    for (const item of unassigned)
      errors[`supplier:${item.recommendation.id}`] = "Escolha o fornecedor.";
    for (const group of groups) {
      if (!group.receiveLocationId)
        errors[`group:${group.supplierId}:receiveLocationId`] =
          "Escolha o local de entrega.";
      for (const item of group.items)
        for (const line of item.lines) {
          if (!(parseDecimal(line.quantity) > 0))
            errors[lineErrorKey(line, "quantity")] =
              "A quantidade deve ser maior que zero.";
          const cost = parseDecimal(line.unitCost);
          if (Number.isNaN(cost) || cost < 0)
            errors[lineErrorKey(line, "unitCost")] = "Informe o custo.";
        }
    }
    return errors;
  }, [groups, unassigned]);

  useEffect(() => {
    if (submitted) setClientErrors(validate());
  }, [submitted, validate]);

  const clearServerError = (key: string) =>
    setServerErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const setLine = (
    line: PurchaseLine,
    patch: Partial<Pick<PurchaseLine, "quantity" | "unitCost">>
  ) => {
    for (const field of Object.keys(patch))
      clearServerError(lineErrorKey(line, field));
    setLines((prev) => ({
      ...prev,
      [line.recommendationId]: prev[line.recommendationId].map((l) =>
        l.variantId === line.variantId ? { ...l, ...patch } : l
      ),
    }));
  };

  const setLocation = (supplierId: string, locationId: string) => {
    clearServerError(`group:${supplierId}:receiveLocationId`);
    setGroupLocation((prev) => ({ ...prev, [supplierId]: locationId }));
  };

  const setNote = (supplierId: string, note: string) =>
    setGroupNote((prev) => ({ ...prev, [supplierId]: note }));

  const chooseSupplier = (recId: string, supplier: ChosenSupplier | null) =>
    setChosen((prev) => {
      const next = { ...prev };
      if (supplier) next[recId] = supplier;
      else delete next[recId];
      return next;
    });

  const submit = async (): Promise<IApplyPurchaseResult | null> => {
    setSubmitted(true);
    setFormError(null);
    const errors = validate();
    setClientErrors(errors);
    if (Object.keys(errors).length > 0) return null;

    const drafts: PurchaseGroupDraft[] = groups.map((group) => ({
      supplierId: group.supplierId,
      receiveLocationId: group.receiveLocationId,
      note: group.note,
      lines: group.items.flatMap((item) => item.lines),
    }));
    const { request, groupKeys, itemKeys } = buildPurchaseRequest(drafts);

    setSubmitting(true);
    try {
      const result = await forecastRunService.applyPurchase(request, auth);
      setServerErrors({});
      return result;
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 422) throw error;
      const mapped: PurchaseErrors = {};
      const unmatched: string[] = [];
      for (const field of error.getErrorFields()) {
        const message = error.getFieldErrors(field).join(" ");
        const parsed = parsePurchaseErrorField(field);
        const supplierId = parsed ? groupKeys[parsed.group] : undefined;
        const line =
          parsed && parsed.item !== null
            ? itemKeys[parsed.group]?.[parsed.item]
            : undefined;
        if (line) mapped[`line:${line}:${parsed!.name}`] = message;
        else if (supplierId && parsed!.item === null)
          mapped[`group:${supplierId}:${parsed!.name}`] = message;
        else unmatched.push(message);
      }
      setServerErrors(mapped);
      setFormError(
        unmatched.length > 0 || Object.keys(mapped).length === 0
          ? [...unmatched].join(" ") || error.message
          : null
      );
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const errors = { ...clientErrors, ...serverErrors };

  return {
    loaded,
    loadError,
    groups,
    unassigned,
    locations,
    errors,
    formError,
    submitting,
    missingCost,
    setLine,
    setLocation,
    setNote,
    chooseSupplier,
    submit,
    lineError: (line: PurchaseLine, field: "quantity" | "unitCost") =>
      errors[lineErrorKey(line, field)],
  };
}
