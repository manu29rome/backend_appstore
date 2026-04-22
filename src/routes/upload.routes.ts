import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { uploadImage, deleteImage, uploadPublic, serveFile } from '../controllers/upload.controller';

const router = Router();

router.get('/serve', serveFile);                               // no auth — proxy for PQRS attachments
router.post('/public', upload.single('file'), uploadPublic);  // no auth — PQRS only
router.post('/', requireAuth, upload.single('file'), uploadImage);
router.delete('/', requireAuth, deleteImage);

export default router;
