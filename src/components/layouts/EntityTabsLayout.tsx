import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type EntityTab = {
  value: string;
  label: string;
  content: ReactNode;
};

type EntityTabsLayoutProps = {
  title: string;
  tabs: EntityTab[];
  defaultTab?: string;
  disabledTabs?: string[];
  onBack?: () => void;
};

const STEP_PARAM = "step";

export function EntityTabsLayout({
  title,
  tabs,
  defaultTab,
  disabledTabs = [],
  onBack,
}: EntityTabsLayoutProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const firstTab = tabs[0];
  const firstTabValue = firstTab?.value ?? "main";

  const stepFromUrl = useMemo(() => {
    const step = searchParams.get(STEP_PARAM);
    if (step == null || step === "") return null;
    const n = parseInt(step, 10);
    return Number.isNaN(n) ? null : n;
  }, [searchParams]);

  const stepToTabValue = useCallback(
    (step: number): string => {
      const index = Math.max(0, Math.min(step - 1, tabs.length - 1));
      const tab = tabs[index];
      if (!tab) return firstTabValue;
      if (disabledTabs.includes(tab.value)) {
        const firstEnabled = tabs.find((t) => !disabledTabs.includes(t.value));
        return firstEnabled?.value ?? firstTabValue;
      }
      return tab.value;
    },
    [tabs, disabledTabs, firstTabValue]
  );

  const tabValueToStep = useCallback(
    (value: string): number => {
      const index = tabs.findIndex((t) => t.value === value);
      return index < 0 ? 1 : index + 1;
    },
    [tabs]
  );

  const activeValue = useMemo(() => {
    const step = stepFromUrl ?? 1;
    if (step < 1) return defaultTab ?? firstTabValue;
    return stepToTabValue(step);
  }, [stepFromUrl, defaultTab, firstTabValue, stepToTabValue]);

  useEffect(() => {
    if (stepFromUrl == null || stepFromUrl < 1) return;
    const index = stepFromUrl - 1;
    const tab = tabs[index];
    if (!tab || !disabledTabs.includes(tab.value)) return;
    const firstEnabled = tabs.find((t) => !disabledTabs.includes(t.value));
    const fallbackIndex = firstEnabled ? tabs.indexOf(firstEnabled) : 0;
    const fallbackStep = fallbackIndex + 1;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(STEP_PARAM, String(fallbackStep));
        return next;
      },
      { replace: true }
    );
  }, [stepFromUrl, tabs, disabledTabs, setSearchParams]);

  const handleTabChange = useCallback(
    (value: string) => {
      if (disabledTabs.includes(value)) return;
      const step = tabValueToStep(value);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(STEP_PARAM, String(step));
          return next;
        },
        { replace: true }
      );
    },
    [disabledTabs, tabValueToStep, setSearchParams]
  );

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            {onBack && (
              <Button variant="outline" onClick={onBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeValue}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList
              className={cn(
                "grid w-full",
                tabs.length === 2 && "grid-cols-2",
                tabs.length === 3 && "grid-cols-3",
                tabs.length >= 4 && "grid-cols-4"
              )}
            >
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  disabled={disabledTabs.includes(tab.value)}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((tab) => (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className="mt-4 focus-visible:outline-none focus-visible:ring-0"
              >
                {tab.content}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
