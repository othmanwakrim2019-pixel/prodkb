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
import { canAccessIncidentTeam } from '../incidents/services/incident-visibility.service';
import { loadAuthUser } from '../../common/auth/auth-context.service';

/** Map: incidentId → Set of { socketId, userId, userName } */
const rooms = new Map<string, Map<string, { userId: string; userName: string }>>();

function getRoomParticipants(incidentId: string) {
    return Array.from(rooms.get(incidentId)?.values() || []);
}

async function canAccessIncident(socket: Socket, incidentId: string): Promise<boolean> {
    const incident = await prisma.incident.findUnique({
        where: { id: incidentId },
        select: { assignedTeamId: true },
    });

    if (!incident) {
        socket.emit('warroom:error', { message: 'Incident not found' });
        return false;
    }

    const allowed = canAccessIncidentTeam(
        {
            role: socket.data.userRole as string | undefined,
            permissions: (socket.data.userPermissions as string[] | undefined) || [],
            teamIds: (socket.data.userTeamIds as string[] | undefined) || [],
        },
        incident.assignedTeamId,
    );

    if (!allowed) {
        socket.emit('warroom:error', { message: 'Forbidden' });
        logger.warn('WarRoom access denied', {
            socketId: socket.id,
            userId: socket.data.userId,
            incidentId,
        });
    }

    return allowed;
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

            const user = await loadAuthUser(payload.userId);
            if (!user) return next(new Error('User not found'));

            Object.assign(socket.data, {
                userId: user.id,
                userName: user.name,
                userRole: user.role,
                userPermissions: user.permissions,
                userTeamIds: user.teamIds,
            });
            next();
        } catch {
            next(new Error('Invalid token'));
        }
    });

    warRoom.on('connection', (socket: Socket) => {
        const userId: string = socket.data.userId as string;
        const userName: string = socket.data.userName as string;

        logger.info(`WarRoom: user ${userName} connected`, { socketId: socket.id });

        socket.on('warroom:join', async ({ incidentId }: { incidentId: string }) => {
            if (!await canAccessIncident(socket, incidentId)) {
                return;
            }

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
            if (!await canAccessIncident(socket, incidentId)) {
                return;
            }

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
