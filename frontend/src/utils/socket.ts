import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getWarRoomSocket(): Socket {
    if (!socket) {
        socket = io('/warroom', {
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
