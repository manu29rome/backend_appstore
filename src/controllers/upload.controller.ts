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

    // For PDFs: set public_id explicitly with .pdf extension so Cloudinary
    // serves the correct Content-Type and browsers open it inline.
    // use_filename doesn't work with data URIs — public_id must be explicit.
    const pdfPublicId = isPDF
      ? `${Date.now()}_${(req.file.originalname ?? 'documento').replace(/[^a-zA-Z0-9._-]/g, '_')}`
      : undefined;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: isPDF ? 'raw' : 'image',
      ...(isPDF
        ? { public_id: pdfPublicId }
        : { transformation: [{ quality: 'auto', fetch_format: 'auto' }] }),
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
