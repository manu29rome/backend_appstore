import { Server, Socket } from 'socket.io';
import * as chatQueries from '../db/queries/chat.queries';

export function registerChatHandlers(io: Server, socket: Socket): void {
  // Visitor joins their chat session
  socket.on('chat:join', async (data: { sessionId: string; visitorName?: string; visitorEmail?: string }) => {
    try {
      const { sessionId, visitorName, visitorEmail } = data;
      if (!sessionId) return;

      socket.join(`session:${sessionId}`);
      socket.data.sessionId = sessionId;
      socket.data.role = 'visitor';

      const session = await chatQueries.createOrGetSession({
        session_id: sessionId,
        visitor_name: visitorName,
        visitor_email: visitorEmail,
      });

      socket.emit('chat:session-info', { sessionId, status: session.status });

      // Load history
      const messages = await chatQueries.getSessionMessages(sessionId);
      socket.emit('chat:history', messages);

      // Notify admins
      io.to('admin-room').emit('admin:new-session', { session });

    } catch (error) {
      console.error('chat:join error:', error);
    }
  });

  // Visitor sends a message
  socket.on('chat:message', async (data: { sessionId: string; content: string; messageType?: string }) => {
    try {
      const { sessionId, content, messageType } = data;
      if (!sessionId || !content?.trim()) return;

      const message = await chatQueries.saveMessage({
        session_id: sessionId,
        sender_type: 'visitor',
        sender_name: socket.data.visitorName,
        content: content.trim().substring(0, 2000),
        message_type: messageType || 'text',
      });

      // Echo back to all in session (visitor + any admin in session)
      io.to(`session:${sessionId}`).emit('chat:message', message);

      // Notify admin room of new message
      io.to('admin-room').emit('admin:new-message', { sessionId, message });

    } catch (error) {
      console.error('chat:message error:', error);
    }
  });

  // Typing indicator
  socket.on('chat:typing', (data: { sessionId: string; isTyping: boolean }) => {
    socket.to(`session:${data.sessionId}`).emit('chat:typing', { isTyping: data.isTyping });
    io.to('admin-room').emit('admin:visitor-typing', { sessionId: data.sessionId, isTyping: data.isTyping });
  });

  // Visitor leaves
  socket.on('chat:leave', async (data: { sessionId: string }) => {
    socket.leave(`session:${data.sessionId}`);
    io.to('admin-room').emit('admin:visitor-left', { sessionId: data.sessionId });
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    if (socket.data.sessionId && socket.data.role === 'visitor') {
      io.to('admin-room').emit('admin:visitor-left', { sessionId: socket.data.sessionId });
    }
  });
}
