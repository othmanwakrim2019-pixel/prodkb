import { useState, useEffect, useRef, useCallback } from 'react';
import { getWarRoomSocket } from '../../utils/socket';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axios';
import { Send, Users, Zap, MessageSquare, AlertCircle } from 'lucide-react';

interface Message {
    id: string;
    content: string;
    type: 'message' | 'system_event';
    createdAt: string;
    user: { id: string; name: string };
}

interface Participant {
    userId: string;
    userName: string;
}

interface WarRoomProps {
    incidentId: string;
}

export function WarRoom({ incidentId }: WarRoomProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [input, setInput] = useState('');
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    // Add a message deduplicating by id
    const addMessage = useCallback((msg: Message) => {
        setMessages(prev => {
            // Replace optimistic placeholder if server confirmed the same content sent by me
            const withoutSamePending = prev.filter(m =>
                !(m.id.startsWith('optimistic-') && m.content === msg.content && m.user.id === msg.user.id)
            );
            if (withoutSamePending.find(m => m.id === msg.id)) return withoutSamePending;
            return [...withoutSamePending, msg];
        });
    }, []);

    useEffect(() => {
        // Load history via REST
        axiosInstance.get(`/api/v1/warroom/${incidentId}/messages`).then(res => {
            setMessages(res.data?.data || []);
        }).catch(() => { });

        const socket = getWarRoomSocket();

        // Named handlers — prevents stacking when component remounts (tab switch)
        const onConnect = () => {
            setConnected(true);
            setError(null);
            socket.emit('warroom:join', { incidentId });
        };
        const onDisconnect = () => setConnected(false);
        // ADDITIVE merge: keeps any pending optimistic messages when history arrives late
        const onHistory = (hist: Message[]) => {
            setMessages(prev => {
                const histIds = new Set(hist.map(m => m.id));
                const pending = prev.filter(
                    m => m.id.startsWith('optimistic-') &&
                        !hist.some(h => h.content === m.content && h.user.id === m.user.id)
                );
                return [...hist, ...pending];
            });
        };
        const onMessage = (msg: Message) => addMessage(msg);
        const onParticipants = (p: Participant[]) => setParticipants(p);
        const onConnectError = (err: Error) => {
            setError(err.message || 'Connexion refusée');
            setConnected(false);
        };

        // CRITICAL: use removeAllListeners for warroom events.
        // socket.off(event, fn) only removes a handler matching that exact fn reference.
        // Stale handlers from previous component mounts accumulate and fire concurrently,
        // causing onHistory to overwrite messages and messages to appear then disappear.
        socket.removeAllListeners('warroom:history');
        socket.removeAllListeners('warroom:message');
        socket.removeAllListeners('warroom:participants');
        socket.removeAllListeners('connect_error');
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('warroom:history', onHistory);
        socket.on('warroom:message', onMessage);
        socket.on('warroom:participants', onParticipants);
        socket.on('connect_error', onConnectError);

        if (socket.connected) {
            setConnected(true);
            socket.emit('warroom:join', { incidentId });
        } else {
            socket.connect();
        }

        return () => {
            socket.emit('warroom:leave', { incidentId });
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('warroom:history', onHistory);
            socket.off('warroom:message', onMessage);
            socket.off('warroom:participants', onParticipants);
            socket.off('connect_error', onConnectError);
        };
    }, [incidentId, addMessage]);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = () => {
        if (!input.trim() || !connected || !user) return;
        const content = input.trim();
        setInput('');

        // Optimistic update — sender sees message immediately
        const optimisticMsg: Message = {
            id: `optimistic-${Date.now()}`,
            content,
            type: 'message',
            createdAt: new Date().toISOString(),
            user: { id: user.id, name: user.name },
        };
        addMessage(optimisticMsg);

        const socket = getWarRoomSocket();
        socket.emit('warroom:message', { incidentId, content });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">Discussion</span>
                    <span className={`inline-block w-2 h-2 rounded-full ml-1 ${connected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Users className="h-3 w-3" />
                    {participants.length > 0 ? (
                        <span>{participants.map(p => p.userName).join(', ')}</span>
                    ) : (
                        <span>Aucun participant</span>
                    )}
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-b border-red-200 text-xs text-red-700">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    <span>Erreur : {error}. Rechargez la page.</span>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                    <p className="text-center text-xs text-slate-400 mt-8">
                        Aucun message pour l'instant.<br />Soyez le premier à rejoindre la discussion.
                    </p>
                )}
                {messages.map(msg => {
                    if (msg.type === 'system_event') {
                        return (
                            <div key={msg.id} className="flex items-center gap-2 text-xs text-slate-400 justify-center">
                                <Zap className="h-3 w-3 text-amber-400" />
                                <span className="italic">{msg.content}</span>
                                <span>{formatTime(msg.createdAt)}</span>
                            </div>
                        );
                    }
                    const isMe = msg.user.id === user?.id;
                    return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <span className="text-[10px] text-slate-400 mb-0.5 px-1">
                                {isMe ? 'Vous' : msg.user.name} · {formatTime(msg.createdAt)}
                            </span>
                            <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-2xl text-sm ${isMe
                                ? 'bg-blue-600 text-white rounded-br-sm'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-sm'
                                }`}>
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-slate-200 dark:border-slate-700 p-3 flex gap-2">
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={connected ? 'Écrire un message...' : 'Connexion en cours...'}
                    disabled={!connected}
                    className="flex-1 text-sm bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-slate-400 disabled:opacity-50"
                />
                <button
                    onClick={sendMessage}
                    disabled={!connected || !input.trim()}
                    className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                    <Send className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
