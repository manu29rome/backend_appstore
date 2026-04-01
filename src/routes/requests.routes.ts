import { Router } from 'express';
import * as requestsController from '../controllers/requests.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { contactLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.post('/', contactLimiter, requestsController.submitRequest);
router.get('/stats', requireAuth, requestsController.getRequestStats);
router.get('/', requireAuth, requestsController.getRequests);
router.get('/:id', requireAuth, requestsController.getRequestById);
router.patch('/:id', requireAuth, requestsController.updateRequest);
router.delete('/:id', requireAuth, requestsController.deleteRequest);

export default router;
