import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { AuthRequest } from '../types';
import { AppError, success } from '../utils/response';
import * as authQueries from '../db/queries/auth.queries';

function generateAccessToken(payload: { adminId: number; username: string; role: string }): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}

function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getRefreshExpiry(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, password } = req.body;
    if (!username || !password) throw new AppError('Username and password are required', 400);

    const admin = await authQueries.findAdminByUsername(username);
    if (!admin) throw new AppError('Invalid credentials', 401);

    const passwordMatch = await bcrypt.compare(password, admin.password_hash);
    if (!passwordMatch) throw new AppError('Invalid credentials', 401);

    const accessToken = generateAccessToken({ adminId: admin.id, username: admin.username, role: admin.role });
    const refreshToken = generateRefreshToken();
    const tokenHash = hashToken(refreshToken);

    await authQueries.saveRefreshToken(admin.id, tokenHash, getRefreshExpiry());
    await authQueries.updateLastLogin(admin.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    success(res, {
      accessToken,
      admin: { id: admin.id, username: admin.username, email: admin.email, full_name: admin.full_name, role: admin.role },
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) throw new AppError('No refresh token provided', 401);

    const tokenHash = hashToken(refreshToken);
    const stored = await authQueries.findRefreshToken(tokenHash);

    if (!stored || stored.is_revoked || new Date() > stored.expires_at) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const admin = await authQueries.findAdminById(stored.admin_id);
    if (!admin) throw new AppError('Admin not found', 401);

    // Rotate the refresh token
    await authQueries.revokeRefreshToken(tokenHash);
    const newRefreshToken = generateRefreshToken();
    const newTokenHash = hashToken(newRefreshToken);
    await authQueries.saveRefreshToken(admin.id, newTokenHash, getRefreshExpiry());

    const accessToken = generateAccessToken({ adminId: admin.id, username: admin.username, role: admin.role });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    success(res, { accessToken });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await authQueries.revokeRefreshToken(tokenHash);
    }
    res.clearCookie('refreshToken');
    success(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.admin) throw new AppError('Unauthorized', 401);
    const admin = await authQueries.findAdminById(req.admin.adminId);
    if (!admin) throw new AppError('Admin not found', 404);
    success(res, admin);
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.admin) throw new AppError('Unauthorized', 401);
    const { username, email, full_name } = req.body;
    if (!username && !email && !full_name) throw new AppError('No fields to update', 400);

    const pool = (await import('../config/db')).getPool();
    const sets: string[] = [];
    const values: unknown[] = [req.admin.adminId];

    if (username)  { values.push(username);  sets.push(`username = $${values.length}`); }
    if (email)     { values.push(email);     sets.push(`email = $${values.length}`); }
    if (full_name) { values.push(full_name); sets.push(`full_name = $${values.length}`); }
    sets.push('updated_at = NOW()');

    await pool.query(`UPDATE admins SET ${sets.join(', ')} WHERE id = $1`, values);
    const updated = await authQueries.findAdminById(req.admin.adminId);
    success(res, updated, 'Perfil actualizado correctamente');
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.admin) throw new AppError('Unauthorized', 401);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) throw new AppError('Both passwords are required', 400);
    if (newPassword.length < 8) throw new AppError('New password must be at least 8 characters', 400);

    const admin = await authQueries.findAdminByUsername(req.admin.username);
    if (!admin) throw new AppError('Admin not found', 404);

    const match = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!match) throw new AppError('Current password is incorrect', 400);

    const newHash = await bcrypt.hash(newPassword, 12);
    await authQueries.updatePassword(req.admin.adminId, newHash);
    await authQueries.revokeAllAdminTokens(req.admin.adminId);
    res.clearCookie('refreshToken');

    success(res, null, 'Password changed successfully. Please log in again.');
  } catch (error) {
    next(error);
  }
}
