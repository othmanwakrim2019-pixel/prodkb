import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, X } from 'lucide-react';
import { api } from '../lib/api';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    incidentId: string | null;
    isRead: boolean;
    createdAt: string;
}

const POLL_INTERVAL = 30_000; // 30 seconds

export const NotificationBell = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Fetch unread count (lightweight poll)
    const fetchUnreadCount = async () => {
        try {
            const res = await api.get('/api/v1/notifications/unread-count');
            setUnreadCount(res.data.count);
        } catch {
            // silent
        }
    };

    // Fetch full notification list
    const fetchNotifications = async () => {
        try {
            const res = await api.get('/api/v1/notifications');
            setNotifications(res.data);
        } catch {
            // silent
        }
    };

    // Poll unread count every 30s
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, []);

    // Fetch all notifications when dropdown opens
    useEffect(() => {
        if (isOpen) fetchNotifications();
    }, [isOpen]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/api/v1/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch {
            // silent
        }
    };

    const markAllRead = async () => {
        try {
            await api.patch('/api/v1/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch {
            // silent
        }
    };

    const handleNotificationClick = (n: Notification) => {
        if (!n.isRead) markAsRead(n.id);
        if (n.incidentId) {
            navigate(`/incidents/${n.incidentId}`);
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

    const typeIcon = (type: string) => {
        switch (type) {
            case 'incident_created': return '🚨';
            case 'status_changed': return '🔄';
            case 'incident_resolved': return '✅';
            case 'note_added': return '📝';
            case 'file_uploaded': return '📎';
            default: return '🔔';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Notifications"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-sm">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200/80 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                        <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                                    title="Mark all as read"
                                >
                                    <CheckCheck className="h-3.5 w-3.5" />
                                    Mark all read
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                            <div className="py-12 text-center">
                                <Bell className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                                <p className="text-sm text-slate-400">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <button
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 ${!n.isRead ? 'bg-blue-50/40' : ''
                                        }`}
                                >
                                    <span className="text-lg mt-0.5 flex-shrink-0">{typeIcon(n.type)}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`text-sm truncate ${!n.isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-600'}`}>
                                                {n.title}
                                            </p>
                                            {!n.isRead && (
                                                <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500" />
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 truncate mt-0.5">{n.message}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
