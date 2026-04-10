import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { env } from '../config/env';
import { registerChatHandlers } from './chat.handler';
import { registerAdminHandlers } from './admin.handler';

export function initializeSocket(httpServer: HttpServer): Server {
  const allowedOrigins = env.FRONTEND_URL.split(',').map(o => o.trim()).filter(Boolean);

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    registerChatHandlers(io, socket);
    registerAdminHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}
