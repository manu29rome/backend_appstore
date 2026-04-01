import { Request, Response, NextFunction } from 'express';
import { getPagination } from '../utils/sanitize';
import { AppError, success, paginated } from '../utils/response';
import * as chatQueries from '../db/queries/chat.queries';

export async function createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { session_id, visitor_name, visitor_email } = req.body;
    if (!session_id) throw new AppError('session_id is required', 400);

    const session = await chatQueries.createOrGetSession({
      session_id,
      visitor_name,
      visitor_email,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });
    success(res, session);
  } catch (error) {
    next(error);
  }
}

export async function getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = req.query;
    const { page: p, limit: l, offset } = getPagination(page, limit);
    const { sessions, total } = await chatQueries.getSessions(offset, l);
    paginated(res, sessions, total, p, l);
  } catch (error) {
    next(error);
  }
}

export async function getSessionById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await chatQueries.getSessionById(req.params.sessionId);
    if (!session) throw new AppError('Session not found', 404);
    success(res, session);
  } catch (error) {
    next(error);
  }
}

export async function getSessionMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const messages = await chatQueries.getSessionMessages(req.params.sessionId);
    await chatQueries.markSessionMessagesRead(req.params.sessionId);
    success(res, messages);
  } catch (error) {
    next(error);
  }
}

export async function updateSessionStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = req.body;
    if (!['active', 'closed', 'archived'].includes(status)) throw new AppError('Invalid status', 400);
    await chatQueries.updateSessionStatus(req.params.sessionId, status);
    success(res, null, 'Session updated');
  } catch (error) {
    next(error);
  }
}

export async function deleteSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await chatQueries.deleteSession(req.params.sessionId);
    success(res, null, 'Session deleted');
  } catch (error) {
    next(error);
  }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const count = await chatQueries.getUnreadCount();
    success(res, { count });
  } catch (error) {
    next(error);
  }
}
