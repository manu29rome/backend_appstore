import { Request, Response, NextFunction } from 'express';
import { sanitizeString, sanitizeEmail, getPagination } from '../utils/sanitize';
import { AppError, success, created, paginated } from '../utils/response';
import * as pqrsQueries from '../db/queries/pqrs.queries';

export async function submitPQRS(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { type, full_name, email, phone, subject, description, attachments } = req.body;

    if (!type || !full_name || !email || !subject || !description)
      throw new AppError('Tipo, nombre, correo, asunto y descripción son requeridos', 400);
    if (!['peticion', 'queja', 'reclamo', 'sugerencia'].includes(type))
      throw new AppError('Tipo inválido', 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new AppError('Correo electrónico inválido', 400);

    const attachmentUrls: string[] = Array.isArray(attachments) ? attachments.filter((u: unknown) => typeof u === 'string') : [];

    const pqrs = await pqrsQueries.createPQRS({
      type,
      full_name:   sanitizeString(full_name).substring(0, 100),
      email:       sanitizeEmail(email),
      phone:       phone ? sanitizeString(phone).substring(0, 30) : undefined,
      subject:     sanitizeString(subject).substring(0, 200),
      description: sanitizeString(description).substring(0, 5000),
      attachments: attachmentUrls,
      ip_address:  req.ip,
    });

    created(res, pqrs, `Su PQRS ha sido radicado con el número ${pqrs.radicado}`);
  } catch (error) {
    next(error);
  }
}

export async function getPQRSList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, status } = req.query;
    const { page: p, limit: l, offset } = getPagination(page, limit);
    const { items, total } = await pqrsQueries.getPQRSList(offset, l, status as string | undefined);
    paginated(res, items, total, p, l);
  } catch (error) {
    next(error);
  }
}

export async function getPQRSById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) throw new AppError('ID inválido', 400);
    const pqrs = await pqrsQueries.getPQRSById(id);
    if (!pqrs) throw new AppError('PQRS no encontrado', 404);
    success(res, pqrs);
  } catch (error) {
    next(error);
  }
}

export async function updatePQRS(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) throw new AppError('ID inválido', 400);
    const { status, admin_comments } = req.body;

    if (status && !['pending', 'in_progress', 'resolved', 'closed'].includes(status))
      throw new AppError('Estado inválido', 400);

    const updated = await pqrsQueries.updatePQRS(id, { status, admin_comments });
    if (!updated) throw new AppError('PQRS no encontrado', 404);
    success(res, updated, 'PQRS actualizado');
  } catch (error) {
    next(error);
  }
}

export async function deletePQRS(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) throw new AppError('ID inválido', 400);
    await pqrsQueries.deletePQRS(id);
    success(res, null, 'PQRS eliminado');
  } catch (error) {
    next(error);
  }
}
