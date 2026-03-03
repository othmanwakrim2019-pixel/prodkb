import { useState, useEffect, useRef } from 'react';
import { getWarRoomSocket } from '../../utils/socket';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axios';
import { Send, Users, Zap, MessageSquare } from 'lucide-react';

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
    const bottomRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    useEffect(() => {
        // Load history via REST
        axiosInstance.get(`/api/v1/warroom/${incidentId}/messages`).then(res => {
            setMessages(res.data?.data || []);
        });

        const socket = getWarRoomSocket();

        socket.on('connect', () => {
            setConnected(true);
            socket.emit('warroom:join', { incidentId });
        });
        socket.on('disconnect', () => setConnected(false));
        socket.on('warroom:history', (hist: Message[]) => setMessages(hist));
        socket.on('warroom:message', (msg: Message) => {
            setMessages(prev => {
                if (prev.find(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        });
        socket.on('warroom:participants', (p: Participant[]) => setParticipants(p));

        if (!socket.connected) socket.connect();
        else {
            setConnected(true);
            socket.emit('warroom:join', { incidentId });
        }

        return () => {
            socket.emit('warroom:leave', { incidentId });
            socket.off('connect');
            socket.off('disconnect');
            socket.off('warroom:history');
            socket.off('warroom:message');
            socket.off('warroom:participants');
        };
    }, [incidentId]);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = () => {
        if (!input.trim() || !connected) return;
        const socket = getWarRoomSocket();
        socket.emit('warroom:message', { incidentId, content: input.trim() });
        setInput('');
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
