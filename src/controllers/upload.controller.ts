import { Request, Response, NextFunction } from 'express';
import { Readable } from 'stream';
import cloudinary from '../config/cloudinary';
import { success, AppError } from '../utils/response';

type CloudinaryResult = { secure_url: string; public_id: string };

function streamUpload(buffer: Buffer, options: object): Promise<CloudinaryResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options as Parameters<typeof cloudinary.uploader.upload_stream>[0],
      (error, result) => {
        if (error || !result) reject(error ?? new Error('Upload failed'));
        else resolve(result as CloudinaryResult);
      },
    );
    Readable.from(buffer).pipe(stream);
  });
}

// Builds a safe public_id from the original filename (no extension — Cloudinary adds it).
function safePdfPublicId(originalname: string): string {
  const base = (originalname ?? 'documento')
    .replace(/\.[^.]+$/, '')           // strip extension
    .replace(/[^a-zA-Z0-9._-]/g, '_'); // sanitize
  return `${Date.now()}_${base}`;
}

export async function uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) throw new AppError('No se recibió ningún archivo.', 400);

    const folder = (req.query.folder as string) || 'suitextech';
    const isPDF  = req.file.mimetype === 'application/pdf';

    let result: CloudinaryResult;
    if (isPDF) {
      result = await streamUpload(req.file.buffer, {
        folder,
        resource_type: 'image',
        type: 'upload',
        access_control: [{ access_type: 'anonymous' }],
        public_id: safePdfPublicId(req.file.originalname),
      });
    } else {
      const b64 = req.file.buffer.toString('base64');
      result = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${b64}`, {
        folder,
        resource_type: 'image',
        type: 'upload',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      }) as CloudinaryResult;
    }

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
    if (!folder.startsWith('suitextech/pqrs')) throw new AppError('Carpeta no permitida.', 403);

    const isPDF = req.file.mimetype === 'application/pdf';

    let result: CloudinaryResult;
    if (isPDF) {
      result = await streamUpload(req.file.buffer, {
        folder,
        resource_type: 'image',
        type: 'upload',
        access_control: [{ access_type: 'anonymous' }],
        public_id: safePdfPublicId(req.file.originalname),
      });
    } else {
      const b64 = req.file.buffer.toString('base64');
      result = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${b64}`, {
        folder,
        resource_type: 'image',
        type: 'upload',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      }) as CloudinaryResult;
    }

    success(res, { url: result.secure_url, public_id: result.public_id });
  } catch (error) {
    next(error);
  }
}

export async function deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { public_id } = req.body as { public_id?: string };
    if (!public_id) throw new AppError('public_id requerido.', 400);
    await cloudinary.uploader.destroy(public_id);
    success(res, { deleted: true });
  } catch (error) {
    next(error);
  }
}
