/**
 * War Room Socket.io Gateway
 *
 * Handles real-time chat within an incident War Room.
 * Events:
 *   warroom:join      {incidentId}                    — join race room
 *   warroom:leave     {incidentId}                    — leave war room
 *   warroom:message   {incidentId, content}           — send message
 *
 * Server emits:
 *   warroom:message       — new message (to all in room)
 *   warroom:participants  — updated participant list
 *   warroom:history       — message history on join
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { warRoomService } from './warroom.service';
import { prisma } from '../../common/utils/prisma';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { logger } from '../../common/utils/logger';

/** Map: incidentId → Set of { socketId, userId, userName } */
const rooms = new Map<string, Map<string, { userId: string; userName: string }>>();

function getRoomParticipants(incidentId: string) {
    return Array.from(rooms.get(incidentId)?.values() || []);
}

export function registerWarRoomGateway(io: SocketIOServer) {
    const warRoom = io.of('/warroom');

    // Authenticate socket via access_token cookie
    warRoom.use(async (socket: Socket, next) => {
        try {
            const token =
                socket.handshake.auth?.token ||
                socket.handshake.headers?.cookie
                    ?.split(';')
                    .find((c: string) => c.trim().startsWith('access_token='))
                    ?.split('=')[1];

            if (!token) return next(new Error('No token'));

            // JWT payload uses userId, email, role — NOT id or name
            const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string; email: string; role: string };
            if (!payload.userId) return next(new Error('Invalid token payload'));

            // Fetch user name from DB for display in messages
            const user = await prisma.user.findUnique({
                where: { id: payload.userId },
                select: { id: true, name: true },
            });
            if (!user) return next(new Error('User not found'));

            (socket as any).userId = user.id;
            (socket as any).userName = user.name || 'Unknown';
            next();
        } catch {
            next(new Error('Invalid token'));
        }
    });

    warRoom.on('connection', (socket: Socket) => {
        const userId: string = (socket as any).userId;
        const userName: string = (socket as any).userName;

        logger.info(`WarRoom: user ${userName} connected`, { socketId: socket.id });

        socket.on('warroom:join', async ({ incidentId }: { incidentId: string }) => {
            socket.join(incidentId);

            // Track participant
            if (!rooms.has(incidentId)) rooms.set(incidentId, new Map());
            rooms.get(incidentId)!.set(socket.id, { userId, userName });

            // Send history to joining user
            const history = await warRoomService.getHistory(incidentId);
            socket.emit('warroom:history', history);

            // Broadcast updated participant list
            warRoom.to(incidentId).emit('warroom:participants', getRoomParticipants(incidentId));

            logger.info(`WarRoom: ${userName} joined incident ${incidentId}`);
        });

        socket.on('warroom:leave', ({ incidentId }: { incidentId: string }) => {
            socket.leave(incidentId);
            rooms.get(incidentId)?.delete(socket.id);
            warRoom.to(incidentId).emit('warroom:participants', getRoomParticipants(incidentId));
        });

        socket.on('warroom:message', async ({ incidentId, content }: { incidentId: string; content: string }) => {
            if (!content?.trim()) return;

            const message = await warRoomService.saveMessage(incidentId, userId, content.trim());
            warRoom.to(incidentId).emit('warroom:message', message);
        });

        socket.on('disconnect', () => {
            // Remove from all rooms
            rooms.forEach((participants, incidentId) => {
                if (participants.has(socket.id)) {
                    participants.delete(socket.id);
                    warRoom.to(incidentId).emit('warroom:participants', getRoomParticipants(incidentId));
                }
            });
            logger.info(`WarRoom: user ${userName} disconnected`);
        });
    });
}
