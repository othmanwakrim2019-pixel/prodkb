import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

function getSocketBaseUrl(): string {
    const apiUrl = import.meta.env.VITE_API_URL?.trim();
    if (!apiUrl) {
        return window.location.origin;
    }

    try {
        return new URL(apiUrl, window.location.origin).origin;
    } catch {
        return window.location.origin;
    }
}

export function getWarRoomSocket(): Socket {
    if (!socket) {
        socket = io(`${getSocketBaseUrl()}/warroom`, {
            path: '/socket.io',
            withCredentials: true,   // browser forwards the httpOnly access_token cookie
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
            transports: ['websocket', 'polling'],
        });
    }
    return socket;
}

export function disconnectSocket() {
    socket?.disconnect();
    socket = null;
}
