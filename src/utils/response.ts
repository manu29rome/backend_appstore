import { Response } from 'express';
import { ApiResponse } from '../types';

export function success<T>(res: Response, data: T, message?: string, status = 200): void {
  const response: ApiResponse<T> = { success: true, data, message };
  res.status(status).json(response);
}

export function created<T>(res: Response, data: T, message = 'Created successfully'): void {
  success(res, data, message, 201);
}

export function paginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number
): void {
  const response: ApiResponse<T[]> = {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
  res.status(200).json(response);
}

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}
