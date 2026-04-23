import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { uploadImage, deleteImage, uploadPublic, deletePublic } from '../controllers/upload.controller';

const router = Router();

router.post('/public',   upload.single('file'), uploadPublic);  // no auth — PQRS only
router.delete('/public', deletePublic);                        // no auth — PQRS only, folder-restricted
router.post('/', requireAuth, upload.single('file'), uploadImage);
router.delete('/', requireAuth, deleteImage);

export default router;
