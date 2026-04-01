import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getSettings);
router.put('/', requireAuth, updateSettings);

export default router;
