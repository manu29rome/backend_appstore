import { Request, Response, NextFunction } from 'express';
import { Readable } from 'stream';
import cloudinary from '../config/cloudinary';
import { success, AppError } from '../utils/response';

type CloudinaryResult = { secure_url: string; public_id: string };

// Stream upload preserves exact binary content — more reliable than data URI for PDFs.
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

export async function uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) throw new AppError('No se recibió ningún archivo.', 400);

    const folder  = (req.query.folder as string) || 'suitextech';
    const isPDF   = req.file.mimetype === 'application/pdf';

    let result: CloudinaryResult;
    if (isPDF) {
      const pdfPublicId = `${Date.now()}_${(req.file.originalname ?? 'documento').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      result = await streamUpload(req.file.buffer, { folder, resource_type: 'raw', public_id: pdfPublicId });
    } else {
      const b64 = req.file.buffer.toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${b64}`;
      result = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: 'image',
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
      // Stream upload with explicit .pdf public_id so Cloudinary serves
      // Content-Type: application/pdf and browsers open the file inline.
      const pdfPublicId = `${Date.now()}_${(req.file.originalname ?? 'documento').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      result = await streamUpload(req.file.buffer, { folder, resource_type: 'raw', public_id: pdfPublicId });
    } else {
      const b64 = req.file.buffer.toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${b64}`;
      result = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: 'image',
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
