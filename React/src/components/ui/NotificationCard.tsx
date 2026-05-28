import { useState } from 'react';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
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
      className="flex items-center gap-4 rounded-xl border border-black/10 bg-white p-4"
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
        <div className="flex items-center justify-between gap-3">
          <h4 className="truncate text-lg font-semibold text-black">
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
                className="rounded-full p-2 transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckIcon
                  className="h-5 w-5 text-secondary"
                  aria-hidden="true"
                />
              </button>
            ) : null}

            <span
              className="flex items-center text-black/45"
              aria-hidden="true"
            >
              {expanded ? (
                <ChevronUpIcon className="h-5 w-5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5" />
              )}
            </span>
          </div>
        </div>

        <p
          className={`mt-1 text-sm text-black/75 ${expanded ? '' : 'truncate'}`}
        >
          {notification.body}
        </p>

        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-black/45">
          {formatNotificationTime(notification.created_at)}
        </p>
      </div>

      {/* check button moved into header; chevron shows expanded state */}
    </article>
  );
}
