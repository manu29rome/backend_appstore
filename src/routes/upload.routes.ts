import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { uploadImage, deleteImage } from '../controllers/upload.controller';

const router = Router();

router.post('/', requireAuth, upload.single('file'), uploadImage);
router.delete('/', requireAuth, deleteImage);

export default router;
