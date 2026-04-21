import { Request, Response, NextFunction } from 'express';
import cloudinary from '../config/cloudinary';
import { success, AppError } from '../utils/response';

export async function uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      throw new AppError('No se recibió ningún archivo.', 400);
    }

    const folder   = (req.query.folder as string) || 'suitextech';
    const b64      = req.file.buffer.toString('base64');
    const dataUri  = `data:${req.file.mimetype};base64,${b64}`;

    const isPDF = req.file.mimetype === 'application/pdf';
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: isPDF ? 'raw' : 'image',
      ...(isPDF ? {} : { transformation: [{ quality: 'auto', fetch_format: 'auto' }] }),
    });

    success(res, { url: result.secure_url, public_id: result.public_id });
  } catch (error) {
    next(error);
  }
}

// Public upload — restricted to suitextech/pqrs folder only (no auth required)
export async function uploadPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) throw new AppError('No se recibió ningún archivo.', 400);

    const folder = (req.query.folder as string) || '';
    if (!folder.startsWith('suitextech/pqrs')) {
      throw new AppError('Carpeta no permitida.', 403);
    }

    const b64     = req.file.buffer.toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${b64}`;
    const isPDF   = req.file.mimetype === 'application/pdf';

    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: isPDF ? 'raw' : 'image',
      ...(isPDF ? {} : { transformation: [{ quality: 'auto', fetch_format: 'auto' }] }),
    });

    success(res, { url: result.secure_url, public_id: result.public_id });
  } catch (error) {
    next(error);
  }
}

export async function deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { public_id } = req.body as { public_id?: string };
    if (!public_id) { throw new AppError('public_id requerido.', 400); }
    await cloudinary.uploader.destroy(public_id);
    success(res, { deleted: true });
  } catch (error) {
    next(error);
  }
}
