import { Request, Response, NextFunction } from 'express';
import { AppError, success, created } from '../utils/response';
import * as projectQueries from '../db/queries/projects.queries';

function toSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function getPublished(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { category } = req.query;
    const projects = await projectQueries.getPublishedProjects(category as string | undefined);
    success(res, projects);
  } catch (error) { next(error); }
}

export async function getFeatured(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projects = await projectQueries.getFeaturedProjects();
    success(res, projects);
  } catch (error) { next(error); }
}

export async function getProjectBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await projectQueries.getProjectBySlug(req.params.slug);
    if (!project) throw new AppError('Project not found', 404);
    success(res, project);
  } catch (error) { next(error); }
}

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projects = await projectQueries.getAllProjects();
    success(res, projects);
  } catch (error) { next(error); }
}

export async function createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { title, short_description, category, tech_stack } = req.body;
    if (!title || !short_description || !category || !tech_stack) {
      throw new AppError('title, short_description, category, and tech_stack are required', 400);
    }
    const slug = req.body.slug || toSlug(title);
    const techStackJson = Array.isArray(tech_stack) ? JSON.stringify(tech_stack) : tech_stack;
    const project = await projectQueries.createProject({ ...req.body, slug, tech_stack: techStackJson });
    created(res, project);
  } catch (error) { next(error); }
}

export async function updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const data = { ...req.body };
    if (Array.isArray(data.tech_stack)) data.tech_stack = JSON.stringify(data.tech_stack);
    const updated = await projectQueries.updateProject(id, data);
    if (!updated) throw new AppError('Project not found', 404);
    success(res, updated);
  } catch (error) { next(error); }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    await projectQueries.deleteProject(id);
    success(res, null, 'Project deleted');
  } catch (error) { next(error); }
}
