import { Request, Response, NextFunction } from 'express';
import { AppError, success, created } from '../utils/response';
import * as testimonialQueries from '../db/queries/testimonials.queries';

export async function getPublished(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const testimonials = await testimonialQueries.getPublishedTestimonials();
    success(res, testimonials);
  } catch (error) { next(error); }
}

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const testimonials = await testimonialQueries.getAllTestimonials();
    success(res, testimonials);
  } catch (error) { next(error); }
}

export async function createTestimonial(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { client_name, content } = req.body;
    if (!client_name || !content) throw new AppError('client_name and content are required', 400);
    const testimonial = await testimonialQueries.createTestimonial(req.body);
    created(res, testimonial);
  } catch (error) { next(error); }
}

export async function updateTestimonial(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await testimonialQueries.updateTestimonial(id, req.body);
    if (!updated) throw new AppError('Testimonial not found', 404);
    success(res, updated);
  } catch (error) { next(error); }
}

export async function deleteTestimonial(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    await testimonialQueries.deleteTestimonial(id);
    success(res, null, 'Testimonial deleted');
  } catch (error) { next(error); }
}
