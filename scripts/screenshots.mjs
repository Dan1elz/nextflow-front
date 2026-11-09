#!/usr/bin/env node
/**
 * Prints de todas as telas para a documentação do TCC.
 *
 * Uso (com o front e a API de dev no ar):
 *   node scripts/screenshots.mjs [--out ../nextflow-docs/docs/screenshots] [--only nome1,nome2] [--themes light,dark]
 *
 * Variáveis: FRONT_URL (padrão http://127.0.0.1:5174), API_URL (http://localhost:8081/api),
 * SCREENSHOT_EMAIL / SCREENSHOT_PASSWORD (padrão: admin de dev).
 *
 * Grava um PNG por tela e tema (desktop 1440×900, página inteira) e algumas telas no celular (390×844), e um
 * `report.json` com os erros de console e as respostas 4xx/5xx de cada tela, para achar bug.
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .join(" ")
    .split("--")
    .filter(Boolean)
    .map((part) => {
      const [key, ...rest] = part.trim().split(" ");
      return [key, rest.join(" ")];
    })
);
const FRONT = process.env.FRONT_URL ?? "http://127.0.0.1:5174";
const API = process.env.API_URL ?? "http://localhost:8081/api";
const EMAIL = process.env.SCREENSHOT_EMAIL ?? "admin@nextflow.com";
const PASSWORD = process.env.SCREENSHOT_PASSWORD ?? "!Admin123";
const OUT = path.resolve(args.out || "../nextflow-docs/docs/screenshots");
const ONLY = args.only ? new Set(args.only.split(",")) : null;
const THEMES = (args.themes || "light,dark").split(",");
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

async function api(token, uri) {
  const response = await fetch(`${API}/${uri}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error(`${uri}: ${response.status}`);
  return response.json();
}

async function login() {
  const response = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!response.ok) throw new Error(`login: ${response.status}`);
  return (await response.json()).token;
}

/** Ids reais do banco de dev para as telas de detalhe. */
async function loadIds(token) {
  const first = async (uri) => (await api(token, uri)).items?.[0]?.id;
  const stores = (await api(token, "stores")).items;
  const lots = await api(token, "dashboard/expiring-lots?days=365&limit=5");
  const pending = await api(
    token,
    `purchase-orders?limit=1&filters=${encodeURIComponent(JSON.stringify({ status: "Pending" }))}`
  ).catch(() => ({ items: [] }));
  return {
    store: stores[0]?.id,
    product: lots.items?.[0]?.productId ?? (await first("products?limit=1")),
    purchaseOrder:
      pending.items?.[0]?.id ?? (await first("purchase-orders?limit=1")),
    budgetOrder: await first(
      `purchase-orders?limit=1&filters=${encodeURIComponent(JSON.stringify({ status: "Budget" }))}`
    ).catch(() => undefined),
    client: await first("clients?limit=1"),
    supplier: await first("suppliers?limit=1"),
    user: await first("users?limit=1"),
  };
}

/** Espera a tela assentar: sem esqueleto, sem request pendente e com as animações de entrada terminadas. */
async function settle(page) {
  // O mouse começa em (0,0), em cima do menu lateral, que abre no hover: tira ele de lá.
  await page.mouse.move(DESKTOP.width - 40, DESKTOP.height - 40);
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page
    .waitForFunction(
      () => document.querySelectorAll('[data-slot="skeleton"]').length === 0,
      undefined,
      { timeout: 8000 }
    )
    .catch(() => undefined);
  // Linhas com animação "ao aparecer na tela" só entram depois de vistas: rola até o fim e volta.
  await page.evaluate(async () => {
    const step = window.innerHeight / 2;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(900);
}

const click = async (page, locator) => {
  await locator.first().click({ timeout: 5000 });
  await settle(page);
};

/** Telas: `path` abre direto; `act` faz a interação (abrir dialog, drawer) antes da print. `store` escolhe a loja do topo. */
function screens(ids) {
  const s = [
    { name: "01-painel", path: "/" },
    { name: "02-painel-estoque-baixo", path: "/dashboard/low-stock" },
    { name: "03-painel-lotes-vencendo", path: "/dashboard/expiring-lots" },
    { name: "10-previsao", path: "/forecast" },
    {
      name: "11-previsao-detalhe",
      path: "/forecast",
      act: async (page) =>
        click(page, page.locator("table tbody tr td button, table tbody tr td a").filter({ hasText: /\w/ })),
    },
    { name: "12-previsao-historico", path: "/forecast/history" },
    { name: "13-previsao-precisao", path: "/forecast/accuracy" },
    { name: "20-venda-rapida", path: "/sales/quick", store: true },
    { name: "21-historico-vendas", path: "/sales/history" },
    {
      name: "22-historico-vendas-detalhe",
      path: "/sales/history",
      act: async (page) => click(page, page.locator("table tbody tr button").filter({ hasText: /^\d+$|nº/ })),
    },
    { name: "30-pedidos-compra", path: "/purchase-orders" },
    { name: "31-pedido-compra-novo", path: "/purchase-orders/create", store: true },
    { name: "32-pedido-compra-visualizar", path: `/purchase-orders/${ids.purchaseOrder}/view` },
    ids.budgetOrder && { name: "33-pedido-compra-editar", path: `/purchase-orders/${ids.budgetOrder}/edit`, store: true },
    { name: "40-promocoes", path: "/promotions" },
    { name: "50-produtos", path: "/products" },
    { name: "51-produto-novo", path: "/products/create" },
    { name: "52-produto-visualizar", path: `/products/${ids.product}/view` },
    { name: "52b-produto-estoque", path: `/products/${ids.product}/view?step=2` },
    { name: "52c-produto-lotes", path: `/products/${ids.product}/view?step=3` },
    { name: "52d-produto-previsao", path: `/products/${ids.product}/view?step=7` },
    { name: "53-produto-editar", path: `/products/${ids.product}/edit` },
    { name: "54-categorias", path: "/categories" },
    { name: "55-colecoes", path: "/collections" },
    { name: "56-calendario", path: "/calendar-events" },
    { name: "57-movimentacoes", path: "/stock-movements" },
    { name: "60-clientes", path: "/clients" },
    { name: "61-cliente-visualizar", path: `/clients/${ids.client}/view` },
    { name: "62-cliente-novo", path: "/clients/create" },
    { name: "63-fornecedores", path: "/suppliers" },
    { name: "64-fornecedor-visualizar", path: `/suppliers/${ids.supplier}/view` },
    { name: "65-fornecedor-novo", path: "/suppliers/create" },
    { name: "66-usuarios", path: "/users" },
    { name: "67-usuario-visualizar", path: `/users/${ids.user}/view` },
    { name: "68-usuario-novo", path: "/users/create" },
    { name: "70-lojas-e-locais", path: "/settings/stores" },
    { name: "71-politica-estoque", path: "/settings/stock-policy" },
    { name: "72-agendamento-previsao", path: "/settings/forecast" },
    { name: "73-perfil", path: "/profile" },
  ];
  return s.filter(Boolean);
}

const MOBILE_SCREENS = new Set([
  "01-painel",
  "10-previsao",
  "20-venda-rapida",
  "30-pedidos-compra",
  "50-produtos",
  "52-produto-visualizar",
]);

async function shoot(browser, { theme, viewport, token, store, dir, screen, report }) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: viewport === MOBILE ? 2 : 1,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    colorScheme: theme,
    // Sem animação de entrada: na página inteira, o que está fora da tela nunca "aparece" e sai apagado.
    reducedMotion: "reduce",
  });
  await context.addInitScript(
    ([t, th, st]) => {
      if (t) localStorage.setItem("user-auth-token", t);
      localStorage.setItem("app-theme", th);
      if (st) localStorage.setItem("current-store-id", st);
      else localStorage.removeItem("current-store-id");
    },
    [token, theme, store]
  );
  const page = await context.newPage();
  const problems = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") problems.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  page.on("response", (response) => {
    const url = response.url();
    if (response.status() >= 400 && url.startsWith(API.replace(/\/api$/, "")))
      problems.push(`${response.status()} ${response.request().method()} ${url}`);
  });
  try {
    await page.goto(`${FRONT}${screen.path}`, { waitUntil: "domcontentloaded" });
    await settle(page);
    if (screen.act) await screen.act(page);
    const file = path.join(dir, `${screen.name}.png`);
    // Página inteira: aumenta a janela até a altura do conteúdo (o `fullPage` do Chromium deixa em branco o que estava fora
    // da janela). Dialog e gaveta cobrem só a área visível: ficam com a janela normal.
    if (!screen.act) {
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      await page.setViewportSize({ width: viewport.width, height: Math.max(viewport.height, height) });
      await page.waitForTimeout(700);
    }
    await page.screenshot({ path: file });
    report.push({ file: path.relative(OUT, file), url: screen.path, problems });
    console.log(`${problems.length ? "!" : "✓"} ${path.relative(OUT, file)}${problems.length ? ` (${problems.length} problema(s))` : ""}`);
  } catch (error) {
    report.push({ file: screen.name, url: screen.path, problems: [...problems, `falhou: ${error.message}`] });
    console.log(`✗ ${screen.name}: ${error.message}`);
  } finally {
    await context.close();
  }
}

async function main() {
  const token = await login();
  const ids = await loadIds(token);
  const browser = await chromium.launch();
  const report = [];
  const all = screens(ids).filter((s) => !ONLY || ONLY.has(s.name));

  for (const theme of THEMES) {
    const dir = path.join(OUT, theme);
    await mkdir(dir, { recursive: true });
    if (!ONLY || ONLY.has("00-login"))
      await shoot(browser, { theme, viewport: DESKTOP, token: null, store: null, dir, report, screen: { name: "00-login", path: "/login" } });
    for (const screen of all)
      await shoot(browser, { theme, viewport: DESKTOP, token, store: screen.store ? ids.store : null, dir, screen, report });
  }

  const mobileDir = path.join(OUT, "mobile");
  await mkdir(mobileDir, { recursive: true });
  for (const screen of all.filter((s) => MOBILE_SCREENS.has(s.name)))
    await shoot(browser, { theme: "light", viewport: MOBILE, token, store: screen.store ? ids.store : null, dir: mobileDir, screen, report });

  await browser.close();
  await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
  const withProblems = report.filter((r) => r.problems.length);
  console.log(`\n${report.length} prints, ${withProblems.length} com problema. Relatório: ${path.join(OUT, "report.json")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
