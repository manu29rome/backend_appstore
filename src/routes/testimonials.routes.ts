import { Router } from 'express';
import * as testimonialsController from '../controllers/testimonials.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', testimonialsController.getPublished);
router.get('/all', requireAuth, testimonialsController.getAll);
router.post('/', requireAuth, testimonialsController.createTestimonial);
router.put('/:id', requireAuth, testimonialsController.updateTestimonial);
router.delete('/:id', requireAuth, testimonialsController.deleteTestimonial);

export default router;
