import { useCallback, useState, type ReactNode } from "react";

import { StockPoliciesContext } from "@/contexts/stock-policies.context";
import { useAuth } from "@/hooks/use-auth";
import type {
  StockPolicyDto,
  StockPolicyRequestDto,
} from "@/interfaces/stock-policy.interface";
import { stockPolicyService } from "@/services/stock-policy.service";

export function StockPoliciesProvider({ children }: { children: ReactNode }) {
  const [policies, setPolicies] = useState<StockPolicyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const auth = token ?? undefined;

  const loadPolicies = useCallback(async () => {
    setLoading(true);
    try {
      setPolicies(await stockPolicyService.getAll(auth));
    } finally {
      setLoading(false);
    }
  }, [auth]);

  const updatePolicy = useCallback(
    async (id: string, dto: StockPolicyRequestDto) => {
      const updated = await stockPolicyService.update(id, dto, auth);
      setPolicies((current) =>
        current.map((policy) => (policy.id === id ? updated : policy))
      );
    },
    [auth]
  );

  return (
    <StockPoliciesContext.Provider
      value={{ policies, loading, loadPolicies, updatePolicy }}
    >
      {children}
    </StockPoliciesContext.Provider>
  );
}
