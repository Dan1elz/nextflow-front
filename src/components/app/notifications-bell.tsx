import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Bell,
  CalendarClock,
  Check,
  CheckCheck,
  PackageMinus,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { useNotifications } from "@/hooks/use-notifications";
import type { INotification } from "@/interfaces/forecast.interface";
import { cn } from "@/lib/utils";
import {
  NOTIFICATION_TYPE_LABELS,
  type TNotificationType,
} from "@/types/enums";

const TYPE_ICONS: Record<TNotificationType, LucideIcon> = {
  NewRecommendations: Sparkles,
  LotExpiring: CalendarClock,
  LowStock: PackageMinus,
};

function bellLabel(unread: number): string {
  if (unread === 0) return "Notificações";
  return `Notificações, ${unread} ${unread === 1 ? "não lida" : "não lidas"}`;
}

function timeAgo(createdAt: string): string {
  return formatDistanceToNow(parseISO(createdAt), {
    addSuffix: true,
    locale: ptBR,
  });
}

type ItemProps = {
  notification: INotification;
  onMarkRead: (id: string) => void;
  onNavigate: () => void;
};

function NotificationItem({ notification, onMarkRead, onNavigate }: ItemProps) {
  const unread = !notification.readAt;
  const Icon = TYPE_ICONS[notification.type] ?? Bell;

  const handleLinkClick = () => {
    if (unread) onMarkRead(notification.id);
    onNavigate();
  };

  return (
    <li
      className={cn(
        "flex gap-3 px-4 py-3",
        unread && "bg-primary/[0.04] dark:bg-primary/[0.08]"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl",
          unread
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm leading-snug",
            unread ? "font-semibold" : "font-medium text-foreground/80"
          )}
        >
          {notification.link ? (
            <Link
              to={notification.link}
              onClick={handleLinkClick}
              className="hover:underline focus-visible:underline focus-visible:outline-none"
            >
              {notification.title}
            </Link>
          ) : (
            notification.title
          )}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {notification.message}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/80">
          {NOTIFICATION_TYPE_LABELS[notification.type]} ·{" "}
          {timeAgo(notification.createdAt)}
        </p>
      </div>
      {unread && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Marcar como lida"
          title="Marcar como lida"
          className="size-7 shrink-0 rounded-lg text-muted-foreground"
          onClick={() => onMarkRead(notification.id)}
        >
          <Check className="size-4" />
        </Button>
      )}
    </li>
  );
}

/** Sino no topo de todas as telas (T-DF12): contador, últimas 20 e marcar uma ou todas como lidas. */
export function NotificationsBell() {
  const { items, unreadCount, loading, error, reload, markRead, markAllRead } =
    useNotifications();
  const [open, setOpen] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) void reload();
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={bellLabel(unreadCount)}
          className="relative"
        >
          <Bell className="size-[18px]" />
          {unreadCount > 0 && (
            <span
              aria-hidden
              className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold tabular-nums text-primary-foreground ring-2 ring-background"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden p-0"
      >
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <p className="text-sm font-semibold">Notificações</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 rounded-lg px-2 text-xs"
            disabled={unreadCount === 0}
            onClick={() => void markAllRead()}
          >
            <CheckCheck className="size-3.5" />
            Marcar todas como lidas
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
            {loading ? (
              <Spinner />
            ) : error ? (
              <p>{error}</p>
            ) : (
              <>
                <Bell className="size-5 opacity-60" aria-hidden />
                <p>Nenhuma notificação por aqui.</p>
              </>
            )}
          </div>
        ) : (
          <ul
            aria-label="Notificações"
            className="max-h-[min(28rem,70vh)] divide-y overflow-y-auto"
          >
            {items.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={(id) => void markRead(id)}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
