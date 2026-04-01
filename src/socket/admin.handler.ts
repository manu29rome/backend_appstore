import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import * as chatQueries from '../db/queries/chat.queries';
import { AuthPayload } from '../types';

export function registerAdminHandlers(io: Server, socket: Socket): void {
  // Admin auth via socket handshake token
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return;

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    socket.data.adminId = payload.adminId;
    socket.data.adminName = payload.username;
    socket.data.role = 'admin';
    socket.join('admin-room');

    // Send current session list on connect
    chatQueries.getSessions(0, 50).then(({ sessions }) => {
      socket.emit('admin:session-list', { sessions });
    });

    // Admin joins a specific session to chat
    socket.on('admin:join-session', async (data: { sessionId: string }) => {
      socket.join(`session:${data.sessionId}`);
      await chatQueries.updateSessionAdminJoined(data.sessionId, true);
      io.to(`session:${data.sessionId}`).emit('chat:admin-joined', { adminName: payload.username });

      // Send message history to admin
      const messages = await chatQueries.getSessionMessages(data.sessionId);
      socket.emit('admin:session-history', { sessionId: data.sessionId, messages });
      await chatQueries.markSessionMessagesRead(data.sessionId);
    });

    // Admin sends a message to a visitor
    socket.on('admin:message', async (data: { sessionId: string; content: string }) => {
      const { sessionId, content } = data;
      if (!sessionId || !content?.trim()) return;

      const message = await chatQueries.saveMessage({
        session_id: sessionId,
        sender_type: 'admin',
        sender_name: payload.username,
        content: content.trim().substring(0, 2000),
      });

      io.to(`session:${sessionId}`).emit('chat:message', message);
    });

    // Typing indicator from admin
    socket.on('admin:typing', (data: { sessionId: string; isTyping: boolean }) => {
      socket.to(`session:${data.sessionId}`).emit('chat:typing', { isTyping: data.isTyping, fromAdmin: true });
    });

    // Admin leaves a session
    socket.on('admin:leave-session', async (data: { sessionId: string }) => {
      socket.leave(`session:${data.sessionId}`);
      await chatQueries.updateSessionAdminJoined(data.sessionId, false);
      io.to(`session:${data.sessionId}`).emit('chat:admin-left', {});
    });

    // Admin closes a session
    socket.on('admin:close-session', async (data: { sessionId: string }) => {
      await chatQueries.updateSessionStatus(data.sessionId, 'closed');
      io.to(`session:${data.sessionId}`).emit('chat:session-closed', {});
    });

  } catch {
    // Token invalid — just don't register admin handlers
  }
}
