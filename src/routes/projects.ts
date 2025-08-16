import { Router } from 'express';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  getProjectsByStatus,
} from '../controllers/projectController';
import { authenticate } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(generalLimiter);

// Routes
router.route('/')
  .get(getProjects)
  .post(createProject);

router.get('/stats', getProjectStats);
router.get('/status/:status', getProjectsByStatus);

router.route('/:id')
  .get(getProject)
  .put(updateProject)
  .delete(deleteProject);

export default router;
