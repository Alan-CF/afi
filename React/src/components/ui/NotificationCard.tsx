import { BellAlertIcon, CheckIcon } from '@heroicons/react/24/outline';
import type { Notification } from '../../hooks/useNotifications';

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void | Promise<void>;
  disabled?: boolean;
}

function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default function NotificationCard({
  notification,
  onMarkAsRead,
  disabled = false,
}: NotificationCardProps) {
  const isUnread = !notification.read;

  return (
    <article
      className={`rounded-2xl border p-4 shadow-sm transition-colors ${
        isUnread
          ? 'border-primary/30 bg-primary/5'
          : 'border-black/10 bg-black/[0.02]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            isUnread ? 'bg-primary text-secondary' : 'bg-black/10 text-black/70'
          }`}
        >
          <BellAlertIcon className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-anton text-lg leading-none text-black">
                {notification.title}
              </p>
              <p className="mt-1 font-lato text-xs uppercase tracking-[0.2em] text-black/45">
                {formatNotificationTime(notification.created_at)}
              </p>
            </div>

            {isUnread ? (
              <span className="mt-1 inline-flex shrink-0 rounded-full bg-primary/15 px-2.5 py-1 font-lato text-[11px] font-bold uppercase tracking-wide text-primary">
                New
              </span>
            ) : null}
          </div>

          <p className="mt-3 font-lato text-sm leading-6 text-black/75">
            {notification.body}
          </p>

          {isUnread ? (
            <button
              type="button"
              onClick={() => void onMarkAsRead(notification.id)}
              disabled={disabled}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 font-lato text-sm font-bold text-white transition-colors hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckIcon className="h-4 w-4" aria-hidden="true" />
              Mark as read
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
