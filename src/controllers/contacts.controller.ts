import { Request, Response, NextFunction } from 'express';
import { sanitizeString, sanitizeEmail, getPagination } from '../utils/sanitize';
import { AppError, success, created, paginated } from '../utils/response';
import * as contactQueries from '../db/queries/contacts.queries';

export async function submitContact(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { full_name, email, subject, message } = req.body;

    if (!full_name || !email || !message) throw new AppError('Name, email, and message are required', 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError('Invalid email address', 400);

    const contact = await contactQueries.createContact({
      full_name: sanitizeString(full_name).substring(0, 100),
      email: sanitizeEmail(email),
      subject: subject ? sanitizeString(subject).substring(0, 200) : undefined,
      message: sanitizeString(message).substring(0, 5000),
      ip_address: req.ip,
    });

    created(res, contact, 'Message sent successfully! We will get back to you soon.');
  } catch (error) {
    next(error);
  }
}

export async function getContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, status } = req.query;
    const { page: p, limit: l, offset } = getPagination(page, limit);
    const { contacts, total } = await contactQueries.getContacts(offset, l, status as string | undefined);
    paginated(res, contacts, total, p, l);
  } catch (error) {
    next(error);
  }
}

export async function getContactById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) throw new AppError('Invalid ID', 400);
    const contact = await contactQueries.getContactById(id);
    if (!contact) throw new AppError('Contact not found', 404);
    // Mark as read when viewed
    if (contact.status === 'unread') await contactQueries.updateContactStatus(id, 'read');
    success(res, { ...contact, status: contact.status === 'unread' ? 'read' : contact.status });
  } catch (error) {
    next(error);
  }
}

export async function updateContactStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    if (!['unread', 'read', 'replied'].includes(status)) throw new AppError('Invalid status', 400);
    await contactQueries.updateContactStatus(id, status);
    success(res, null, 'Status updated');
  } catch (error) {
    next(error);
  }
}

export async function deleteContact(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    await contactQueries.deleteContact(id);
    success(res, null, 'Contact deleted');
  } catch (error) {
    next(error);
  }
}
