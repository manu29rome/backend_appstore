import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { submitPQRS, getPQRSList, getPQRSById, updatePQRS, deletePQRS } from '../controllers/pqrs.controller';

const router = Router();

// Public
router.post('/', submitPQRS);

// Admin
router.get('/',     requireAuth, getPQRSList);
router.get('/:id',  requireAuth, getPQRSById);
router.patch('/:id', requireAuth, updatePQRS);
router.delete('/:id', requireAuth, deletePQRS);

export default router;
