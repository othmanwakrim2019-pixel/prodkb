import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { APP_PATHS } from '../../../app/route-meta';
import { notificationService, type NotificationItem } from '../api/notification.service';

const POLL_INTERVAL = 30_000;

export const NotificationBell = () => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { t } = useTranslation();

    const fetchUnreadCount = async () => {
        try {
            const count = await notificationService.getUnreadCount();
            setUnreadCount(count);
        } catch {
            // silent
        }
    };

    const fetchNotifications = async () => {
        try {
            const nextNotifications = await notificationService.getAll();
            setNotifications(Array.isArray(nextNotifications) ? nextNotifications : []);
        } catch {
            // silent
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications((prev) => prev.map((notification) => notification.id === id ? { ...notification, isRead: true } : notification));
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch {
            // silent
        }
    };

    const markAllRead = async () => {
        try {
            await notificationService.markAllRead();
            setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
            setUnreadCount(0);
        } catch {
            // silent
        }
    };

    const handleNotificationClick = (notification: NotificationItem) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }

        if (notification.incidentId) {
            navigate(`${APP_PATHS.incidents}/${notification.incidentId}`);
            setIsOpen(false);
        }
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative rounded-lg p-2 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
                title="Notifications"
                type="button"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('common.notifications')}</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                    title="Mark all as read"
                                    type="button"
                                >
                                    <CheckCheck className="h-3.5 w-3.5" />
                                    {t('common.markAllRead')}
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" type="button">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Notification list */}
                    <div className="max-h-96 divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-12 text-center">
                                <Bell className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                                <p className="text-sm text-slate-400 dark:text-slate-500">{t('common.noNotifications')}</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                                        !notification.isRead ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''
                                    }`}
                                    type="button"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`truncate text-sm ${
                                                !notification.isRead
                                                    ? 'font-semibold text-slate-900 dark:text-slate-100'
                                                    : 'font-medium text-slate-600 dark:text-slate-400'
                                            }`}>
                                                {notification.title}
                                            </p>
                                            {!notification.isRead && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />}
                                        </div>
                                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{notification.message}</p>
                                        <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">{timeAgo(notification.createdAt)}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40">
                        <button
                            onClick={() => { navigate(APP_PATHS.incidents); setIsOpen(false); }}
                            className="text-xs font-medium text-primary dark:text-blue-400 hover:text-primary-hover"
                        >
                            View all incidents →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
