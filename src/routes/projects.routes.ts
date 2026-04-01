import { Router } from 'express';
import * as projectsController from '../controllers/projects.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', projectsController.getPublished);
router.get('/featured', projectsController.getFeatured);
router.get('/all', requireAuth, projectsController.getAll);
router.post('/', requireAuth, projectsController.createProject);
router.get('/:slug', projectsController.getProjectBySlug);
router.put('/:id', requireAuth, projectsController.updateProject);
router.delete('/:id', requireAuth, projectsController.deleteProject);

export default router;
