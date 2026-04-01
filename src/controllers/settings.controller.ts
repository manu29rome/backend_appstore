import { Request, Response, NextFunction } from 'express';
import { success } from '../utils/response';
import * as settingsQueries from '../db/queries/settings.queries';

export async function getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await settingsQueries.getSettings();
    success(res, settings);
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const allowed = [
      'company_name', 'slogan', 'logo_url', 'email', 'phone', 'whatsapp',
      'address', 'country', 'facebook_url', 'instagram_url', 'twitter_url',
      'linkedin_url', 'github_url',
    ];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in req.body) data[key] = req.body[key] || null;
    }
    const settings = await settingsQueries.updateSettings(data);
    success(res, settings);
  } catch (error) {
    next(error);
  }
}
