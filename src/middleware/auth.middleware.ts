import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthRequest, AuthPayload } from '../types';
import { AppError } from '../utils/response';

export function requireAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Authorization token required', 401);
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.admin = payload;
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(new AppError('Invalid or expired token', 401));
  }
}

export function requireRole(role: string) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.admin) return next(new AppError('Unauthorized', 401));
    if (req.admin.role !== role && req.admin.role !== 'superadmin') {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
}
