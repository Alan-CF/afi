import { useEffect } from 'react';
import { BellAlertIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  useMarkAllAsRead,
  useMarkAsRead,
  useNotifications,
} from '../../hooks/useNotifications';
import NotificationCard from '../ui/NotificationCard';

interface NotificationsProps {
  isOpen: boolean;
  onClose: () => void;
}

function NotificationsSkeleton() {
  return (
    <div className="flex animate-pulse gap-4 rounded-2xl border border-black/10 bg-black/[0.02] p-4">
      <div className="h-11 w-11 shrink-0 rounded-full bg-gray-300" />
      <div className="min-w-0 flex-1 space-y-3">
        <div className="h-4 w-2/5 rounded bg-gray-300" />
        <div className="h-4 w-full rounded bg-gray-300" />
        <div className="h-4 w-4/5 rounded bg-gray-300" />
      </div>
    </div>
  );
}

export default function Notifications({ isOpen, onClose }: NotificationsProps) {
  const { notifications, loading, error, refresh, unreadCount } =
    useNotifications();
  const { markAsRead, loading: markingSingle } = useMarkAsRead();
  const { markAllAsRead, loading: markingAll } = useMarkAllAsRead();

  useEffect(() => {
    const { body, documentElement } = document;
    const originalBodyOverflow = body.style.overflow;
    const originalHtmlOverflow = documentElement.style.overflow;

    if (isOpen) {
      body.style.overflow = 'hidden';
      documentElement.style.overflow = 'hidden';
    }

    return () => {
      body.style.overflow = originalBodyOverflow;
      documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isOpen]);

  async function handleMarkAsRead(id: number) {
    const success = await markAsRead(id);
    if (success) {
      await refresh();
    }
  }

  async function handleMarkAllAsRead() {
    const success = await markAllAsRead();
    if (success) {
      await refresh();
    }
  }

  if (!isOpen) return null;

  const actionDisabled = markingSingle || markingAll;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close notifications"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
      />

      <aside className="absolute inset-0 flex h-full flex-col overflow-hidden bg-white md:inset-y-0 md:right-0 md:left-auto md:w-full md:max-w-md md:border-l md:border-black/10 md:shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-black/10 px-6 py-5">
          <div>
            <h2 className="text-2xl font-anton font-semibold md:text-3xl">
              Notifications
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void handleMarkAllAsRead()}
                disabled={actionDisabled}
                className="mb-1 self-end rounded-full border border-black px-3 py-2 font-lato text-sm font-semibold text-black transition-colors hover:bg-secondary hover:text-primary hover:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
              >
                Mark all read
              </button>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-black transition-colors hover:bg-black/5"
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col gap-4 p-6">
              <NotificationsSkeleton />
              <NotificationsSkeleton />
              <NotificationsSkeleton />
            </div>
          ) : error ? (
            <div className="flex min-h-full items-center justify-center px-6 text-center font-lato text-lg text-red-600">
              Error loading notifications. Please try again.
            </div>
          ) : notifications.length > 0 ? (
            <div className="flex flex-col gap-3 p-6">
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  disabled={actionDisabled}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-full items-center justify-center px-6 py-10 text-center">
              <div className="max-w-xs">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-black/[0.04] text-black/45">
                  <BellAlertIcon className="h-8 w-8" aria-hidden="true" />
                </div>
                <h3 className="font-anton text-2xl text-black">
                  No notifications
                </h3>
                <p className="mt-2 font-lato text-base leading-6 text-black/65">
                  You’re all caught up. New updates will appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
