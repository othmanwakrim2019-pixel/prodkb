import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getWarRoomSocket(): Socket {
    if (!socket) {
        const token = document.cookie
            .split('; ')
            .find(c => c.startsWith('access_token='))
            ?.split('=')[1];

        socket = io('/warroom', {
            path: '/socket.io',
            auth: { token },
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });
    }
    return socket;
}

export function disconnectSocket() {
    socket?.disconnect();
    socket = null;
}
