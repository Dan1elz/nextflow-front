import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useIndexSearch } from "@/hooks/use-index-search";
import type { IIndexParams } from "@/interfaces/api.interface";

const initialFilters = { search: "" };

describe("useIndexSearch", () => {
  it("refaz a busca com o search novo quando a loja do topo muda", async () => {
    const calls: string[] = [];
    const searchFor = (store: string) =>
      vi.fn(async (query?: IIndexParams) => {
        void query;
        calls.push(store);
      });

    const { rerender } = renderHook(
      ({ storeId }: { storeId: string }) =>
        useIndexSearch({
          search: searchFor(storeId),
          initialFilters,
          quickSearchKey: "search",
          refreshKey: storeId,
        }),
      { initialProps: { storeId: "store-1" } }
    );

    await waitFor(() => expect(calls).toContain("store-1"));
    const before = calls.length;

    rerender({ storeId: "store-2" });
    await waitFor(() => expect(calls.slice(before)).toEqual(["store-2"]));
  });

  it("sem troca de loja não busca de novo ao renderizar", async () => {
    const search = vi.fn(async () => undefined);
    const { rerender } = renderHook(() =>
      useIndexSearch({
        search,
        initialFilters,
        quickSearchKey: "search",
        refreshKey: "store-1",
      })
    );

    await waitFor(() => expect(search).toHaveBeenCalled());
    const before = search.mock.calls.length;
    rerender();
    expect(search.mock.calls.length).toBe(before);
  });
});
