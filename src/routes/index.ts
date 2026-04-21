import { Router } from 'express';
import authRoutes from './auth.routes';
import contactsRoutes from './contacts.routes';
import requestsRoutes from './requests.routes';
import chatRoutes from './chat.routes';
import testimonialsRoutes from './testimonials.routes';
import projectsRoutes from './projects.routes';
import settingsRoutes from './settings.routes';
import uploadRoutes from './upload.routes';
import pqrsRoutes from './pqrs.routes';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use('/auth', authRoutes);
router.use('/upload', uploadRoutes);
router.use('/contacts', contactsRoutes);
router.use('/requests', requestsRoutes);
router.use('/chat', chatRoutes);
router.use('/testimonials', testimonialsRoutes);
router.use('/projects', projectsRoutes);
router.use('/settings', settingsRoutes);
router.use('/pqrs', pqrsRoutes);
router.get('/dashboard/stats', requireAuth, getDashboardStats);
router.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

export { router };
