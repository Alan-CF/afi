import { CheckIcon } from '@heroicons/react/24/outline';
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
    <article className="flex items-center gap-4 rounded-xl border border-black/10 bg-white p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <h4 className="truncate text-lg font-semibold text-black">
            {notification.title}
          </h4>
        </div>

        <p className="mt-1 truncate text-sm text-black/75">
          {notification.body}
        </p>

        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-black/45">
          {formatNotificationTime(notification.created_at)}
        </p>
      </div>

      {isUnread ? (
        <button
          type="button"
          aria-label={`Mark notification ${notification.title} as read`}
          onClick={() => void onMarkAsRead(notification.id)}
          disabled={disabled}
          className="rounded-full p-2 transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckIcon className="h-5 w-5 text-secondary" aria-hidden="true" />
        </button>
      ) : null}
    </article>
  );
}
