import { Router } from 'express';
import * as chatController from '../controllers/chat.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/sessions', chatController.createSession);
router.get('/sessions', requireAuth, chatController.getSessions);
router.get('/unread-count', requireAuth, chatController.getUnreadCount);
router.get('/sessions/:sessionId', chatController.getSessionById);
router.get('/sessions/:sessionId/messages', chatController.getSessionMessages);
router.patch('/sessions/:sessionId/status', requireAuth, chatController.updateSessionStatus);
router.delete('/sessions/:sessionId', requireAuth, chatController.deleteSession);

export default router;
