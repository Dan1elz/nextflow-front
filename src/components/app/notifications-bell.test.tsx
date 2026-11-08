import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationsBell } from "@/components/app/notifications-bell";
import type { INotificationList } from "@/interfaces/forecast.interface";
import { NotificationsProvider } from "@/providers/notifications.provider";
import { apiUrl, server } from "@/test/server";
import { notificationList } from "@/test/fixtures/notifications.fixtures";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ token: "token", user: { name: "Daniel", role: "Admin" } }),
}));

const [first, second] = notificationList.items;
let markedRead: string[] = [];
let markedAll = 0;

function handlers(list: INotificationList = notificationList) {
  return [
    http.get(apiUrl("notifications"), () => HttpResponse.json(list)),
    http.patch(apiUrl("notifications/:id/read"), ({ params }) => {
      markedRead.push(String(params.id));
      return new HttpResponse(null, { status: 204 });
    }),
    http.patch(apiUrl("notifications/read-all"), () => {
      markedAll += 1;
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}

function renderBell() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <NotificationsProvider>
        <NotificationsBell />
        <Routes>
          <Route path="/" element={<p>Página inicial</p>} />
          <Route path="/forecast" element={<p>Tela da previsão</p>} />
        </Routes>
      </NotificationsProvider>
    </MemoryRouter>
  );
}

async function openBell() {
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole("button", { name: "Notificações, 2 não lidas" })
  );
  const list = await screen.findByRole("list", { name: "Notificações" });
  return { user, list };
}

beforeEach(() => {
  markedRead = [];
  markedAll = 0;
});

describe("Sino de notificações (F3.8c, T-DF12)", () => {
  it("mostra o contador de não lidas no sino", async () => {
    server.use(...handlers());
    renderBell();

    const bell = await screen.findByRole("button", {
      name: "Notificações, 2 não lidas",
    });
    expect(within(bell).getByText("2")).toBeInTheDocument();
  });

  it("abre a lista com título, texto, tipo e link de cada notificação", async () => {
    server.use(...handlers());
    renderBell();
    const { list } = await openBell();

    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(within(items[0]).getByText(first.title)).toBeInTheDocument();
    expect(within(items[0]).getByText(first.message)).toBeInTheDocument();
    expect(
      within(items[0]).getByText(/Novas recomendações/)
    ).toBeInTheDocument();
    expect(within(items[0]).getByRole("link")).toHaveAttribute(
      "href",
      "/forecast"
    );
    expect(within(items[1]).queryByRole("link")).not.toBeInTheDocument();
    // A já lida não oferece "Marcar como lida".
    expect(
      within(items[2]).queryByRole("button", { name: "Marcar como lida" })
    ).not.toBeInTheDocument();
  });

  it("marcar uma como lida faz o contador cair", async () => {
    server.use(...handlers());
    renderBell();
    const { user, list } = await openBell();

    const item = within(list).getAllByRole("listitem")[1];
    await user.click(
      within(item).getByRole("button", { name: "Marcar como lida" })
    );

    expect(
      await screen.findByRole("button", { name: "Notificações, 1 não lida" })
    ).toBeInTheDocument();
    expect(markedRead).toEqual([second.id]);
    expect(
      within(item).queryByRole("button", { name: "Marcar como lida" })
    ).not.toBeInTheDocument();
  });

  it("marcar todas zera o contador", async () => {
    server.use(...handlers());
    renderBell();
    const { user } = await openBell();

    await user.click(
      screen.getByRole("button", { name: "Marcar todas como lidas" })
    );

    expect(
      await screen.findByRole("button", { name: "Notificações" })
    ).toBeInTheDocument();
    expect(markedAll).toBe(1);
    expect(
      screen.queryByRole("button", { name: "Marcar como lida" })
    ).not.toBeInTheDocument();
  });

  it("abrir o link de uma não lida marca como lida e navega", async () => {
    server.use(...handlers());
    renderBell();
    const { user, list } = await openBell();

    await user.click(within(list).getAllByRole("link")[0]);

    expect(await screen.findByText("Tela da previsão")).toBeInTheDocument();
    await waitFor(() => expect(markedRead).toEqual([first.id]));
  });

  it("sem notificações mostra o estado vazio e nenhum contador", async () => {
    server.use(...handlers({ unreadCount: 0, items: [] }));
    renderBell();
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", { name: "Notificações" })
    );
    expect(
      await screen.findByText("Nenhuma notificação por aqui.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Marcar todas como lidas" })
    ).toBeDisabled();
  });
});
