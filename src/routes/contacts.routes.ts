import { Router } from 'express';
import * as contactsController from '../controllers/contacts.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { contactLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.post('/', contactLimiter, contactsController.submitContact);
router.get('/', requireAuth, contactsController.getContacts);
router.get('/:id', requireAuth, contactsController.getContactById);
router.patch('/:id/status', requireAuth, contactsController.updateContactStatus);
router.delete('/:id', requireAuth, contactsController.deleteContact);

export default router;
