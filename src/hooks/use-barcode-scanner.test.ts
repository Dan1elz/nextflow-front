import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";

let clock = 0;

/** Tecla no alvo (padrão: a página), avançando o relógio antes. */
function press(
  key: string,
  gapMs: number,
  target: EventTarget = document.body
) {
  clock += gapMs;
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
}

const scan = (code: string, gapMs = 10, target?: EventTarget) =>
  [...code].forEach((char) => press(char, gapMs, target));

beforeEach(() => {
  clock = 1000;
  vi.useFakeTimers();
  vi.spyOn(performance, "now").mockImplementation(() => clock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("useBarcodeScanner", () => {
  it("entrega o código lido rápido com Enter e segura o Enter", () => {
    const onScan = vi.fn();
    renderHook(() => useBarcodeScanner(onScan));

    scan("7891000100110");
    const enter = press("Enter", 10);

    expect(onScan).toHaveBeenCalledWith("7891000100110");
    expect(enter.defaultPrevented).toBe(true);
  });

  it("entrega o código quando o leitor não manda Enter", () => {
    const onScan = vi.fn();
    renderHook(() => useBarcodeScanner(onScan));

    scan("DP-025");
    vi.advanceTimersByTime(100);

    expect(onScan).toHaveBeenCalledWith("DP-025");
  });

  it("ignora digitação de pessoa (teclas espaçadas)", () => {
    const onScan = vi.fn();
    renderHook(() => useBarcodeScanner(onScan));

    scan("DP-025", 150);
    const enter = press("Enter", 150);
    vi.advanceTimersByTime(100);

    expect(onScan).not.toHaveBeenCalled();
    expect(enter.defaultPrevented).toBe(false);
  });

  it("não intercepta o que é digitado num campo de texto", () => {
    const onScan = vi.fn();
    renderHook(() => useBarcodeScanner(onScan));
    const input = document.createElement("input");
    document.body.appendChild(input);

    scan("7891000100110", 10, input);
    press("Enter", 10, input);

    expect(onScan).not.toHaveBeenCalled();
  });

  it("não escuta quando desligado", () => {
    const onScan = vi.fn();
    renderHook(() => useBarcodeScanner(onScan, { enabled: false }));

    scan("7891000100110");
    press("Enter", 10);

    expect(onScan).not.toHaveBeenCalled();
  });
});
