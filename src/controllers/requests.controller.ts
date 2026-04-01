import { Request, Response, NextFunction } from 'express';
import { sanitizeString, sanitizeEmail, getPagination } from '../utils/sanitize';
import { AppError, success, created, paginated } from '../utils/response';
import * as requestQueries from '../db/queries/requests.queries';

export async function submitRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { full_name, email, company_name, phone, project_type, project_title, description, budget_range, timeline, tech_preferences } = req.body;

    if (!full_name || !email || !project_type || !project_title || !description) {
      throw new AppError('Name, email, project type, title, and description are required', 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError('Invalid email address', 400);
    if (!['web', 'mobile', 'desktop', 'custom'].includes(project_type)) throw new AppError('Invalid project type', 400);

    const request = await requestQueries.createRequest({
      full_name: sanitizeString(full_name).substring(0, 100),
      email: sanitizeEmail(email),
      company_name: company_name ? sanitizeString(company_name).substring(0, 150) : undefined,
      phone: phone ? sanitizeString(phone).substring(0, 30) : undefined,
      project_type,
      project_title: sanitizeString(project_title).substring(0, 200),
      description: sanitizeString(description).substring(0, 10000),
      budget_range: budget_range ? sanitizeString(budget_range).substring(0, 50) : undefined,
      timeline: timeline ? sanitizeString(timeline).substring(0, 50) : undefined,
      tech_preferences: tech_preferences ? JSON.stringify(tech_preferences) : undefined,
    });

    created(res, request, 'Project request submitted successfully! We will review it and contact you soon.');
  } catch (error) {
    next(error);
  }
}

export async function getRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, status, project_type, priority } = req.query;
    const { page: p, limit: l, offset } = getPagination(page, limit);
    const { requests, total } = await requestQueries.getRequests(offset, l, {
      status: status as string,
      project_type: project_type as string,
      priority: priority as string,
    });
    paginated(res, requests, total, p, l);
  } catch (error) {
    next(error);
  }
}

export async function getRequestById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const request = await requestQueries.getRequestById(id);
    if (!request) throw new AppError('Request not found', 404);
    success(res, request);
  } catch (error) {
    next(error);
  }
}

export async function updateRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, priority, admin_notes, assigned_to } = req.body;

    const validStatuses = ['pending', 'reviewing', 'accepted', 'rejected'];
    const validPriorities = ['low', 'normal', 'high'];
    if (status && !validStatuses.includes(status)) throw new AppError('Invalid status', 400);
    if (priority && !validPriorities.includes(priority)) throw new AppError('Invalid priority', 400);

    const updated = await requestQueries.updateRequest(id, { status, priority, admin_notes, assigned_to });
    if (!updated) throw new AppError('Request not found', 404);
    success(res, updated, 'Request updated');
  } catch (error) {
    next(error);
  }
}

export async function deleteRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    await requestQueries.deleteRequest(id);
    success(res, null, 'Request deleted');
  } catch (error) {
    next(error);
  }
}

export async function getRequestStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await requestQueries.getRequestStats();
    success(res, stats);
  } catch (error) {
    next(error);
  }
}
