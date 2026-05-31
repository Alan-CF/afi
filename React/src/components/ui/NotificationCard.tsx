import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
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

  return (
    <article
      className="relative flex items-center gap-4 rounded-2xl bg-[var(--color-text-light-soft)] px-3 py-2 transition-colors"
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
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-extrabold text-secondary">
              {notification.title}
            </p>
            <p
              className={`text-sm font-semibold text-secondary/50 ${
                expanded ? '' : 'truncate'
              }`}
            >
              {notification.body}
            </p>
            <p className="text-xs text-secondary/50">
              {formatNotificationTime(notification.created_at)}
            </p>
          </div>

          <div className="shrink-0 text-right" />
        </div>
      </div>

      <button
        type="button"
        aria-label={`Mark notification ${notification.title} as read`}
        onClick={(e) => {
          e.stopPropagation();
          void onMarkAsRead(notification.id);
        }}
        disabled={disabled}
        className="absolute -top-2 -right-2 z-10 inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-white transition-opacity hover:opacity-90"
      >
        <XMarkIcon className="h-3 w-3" aria-hidden="true" />
      </button>
    </article>
  );
}
