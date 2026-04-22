import { Request, Response, NextFunction } from 'express';
import { Readable } from 'stream';
import https from 'https';
import cloudinary from '../config/cloudinary';
import { success, AppError } from '../utils/response';

const CLOUDINARY_PREFIX = 'https://res.cloudinary.com/dv95y9iii/';

function fetchRemoteFile(url: string, hops = 0): Promise<{ buffer: Buffer; contentType: string }> {
  if (hops > 5) return Promise.reject(new Error('Too many redirects'));
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume(); // discard body before following redirect
        fetchRemoteFile(res.headers.location, hops + 1).then(resolve, reject);
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve({
        buffer: Buffer.concat(chunks),
        contentType: res.headers['content-type'] || 'application/octet-stream',
      }));
      res.on('error', reject);
    }).on('error', reject);
  });
}

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

// Proxy endpoint — fetches a Cloudinary file and serves it with correct headers.
// No auth required (files are already public on Cloudinary), URL restricted to our cloud only.
export async function serveFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawUrl = req.query.url as string;
    if (!rawUrl) throw new AppError('URL requerida.', 400);

    const url = decodeURIComponent(rawUrl);
    if (!url.startsWith(CLOUDINARY_PREFIX)) throw new AppError('URL no permitida.', 403);

    const { buffer, contentType } = await fetchRemoteFile(url);
    const filename = url.split('/').pop()?.split('?')[0] ?? 'documento.pdf';
    const isDownload = req.query.download === 'true';

    res.setHeader('Content-Type', contentType.includes('pdf') ? 'application/pdf' : contentType);
    res.setHeader('Content-Disposition', `${isDownload ? 'attachment' : 'inline'}; filename="${filename}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.end(buffer);
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
