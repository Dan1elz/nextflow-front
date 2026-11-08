import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import {
  NOTIFICATIONS_LIMIT,
  notificationService,
} from "@/services/notification.service";
import { apiUrl, server } from "@/test/server";
import { notificationList } from "@/test/fixtures/notifications.fixtures";

describe("notificationService (T-DF12)", () => {
  it("busca as 20 últimas notificações, lidas e não lidas", async () => {
    let limit: string | null = null;
    let unreadOnly: string | null = "não chamou";
    server.use(
      http.get(apiUrl("notifications"), ({ request }) => {
        const query = new URL(request.url).searchParams;
        limit = query.get("limit");
        unreadOnly = query.get("unreadOnly");
        return HttpResponse.json(notificationList);
      })
    );

    await expect(notificationService.getLatest()).resolves.toEqual(
      notificationList
    );
    expect(NOTIFICATIONS_LIMIT).toBe(20);
    expect(limit).toBe("20");
    expect(unreadOnly).toBeNull();
  });

  it("marca uma notificação como lida", async () => {
    let path: string | null = null;
    server.use(
      http.patch(apiUrl("notifications/:id/read"), ({ request }) => {
        path = new URL(request.url).pathname;
        return new HttpResponse(null, { status: 204 });
      })
    );

    await notificationService.markRead("abc");
    expect(path).toBe("/api/notifications/abc/read");
  });

  it("marca todas como lidas", async () => {
    let called = false;
    server.use(
      http.patch(apiUrl("notifications/read-all"), () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    await notificationService.markAllRead();
    expect(called).toBe(true);
  });
});
