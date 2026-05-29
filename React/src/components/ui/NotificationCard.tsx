import { useState } from 'react';
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
  const [expanded, setExpanded] = useState(false);
  const isUnread = !notification.read;

  return (
    <article
      className="overflow-hidden rounded-xl border border-secondary border-2 bg-white"
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onClick={() => setExpanded((s) => !s)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setExpanded((s) => !s);
        }
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3 bg-secondary px-4 py-3 text-white">
          <h4 className="truncate text-lg font-semibold">
            {notification.title}
          </h4>
          <div className="flex items-center gap-2">
            {isUnread ? (
              <button
                type="button"
                aria-label={`Mark notification ${notification.title} as read`}
                onClick={(e) => {
                  e.stopPropagation();
                  void onMarkAsRead(notification.id);
                }}
                disabled={disabled}
                className="rounded-full p-2 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="px-4 py-4">
          <p className={`text-sm text-black/75 ${expanded ? '' : 'truncate'}`}>
            {notification.body}
          </p>

          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-black/45">
            {formatNotificationTime(notification.created_at)}
          </p>
        </div>
      </div>
    </article>
  );
}
