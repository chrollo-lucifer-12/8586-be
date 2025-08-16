import { Router } from 'express';
import {
  getIncomeEntries,
  getIncomeEntry,
  createIncomeEntry,
  updateIncomeEntry,
  deleteIncomeEntry,
  getIncomeStats,
  getIncomeByProject,
} from '../controllers/incomeController';
import { authenticate } from '../middleware/auth';
import {
  validateCreateIncome,
  validateObjectId,
  validatePaginationQuery,
  validateDateRangeQuery,
} from '../middleware/validation';
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
  .get(validatePaginationQuery, validateDateRangeQuery, getIncomeEntries)
  .post(validateCreateIncome, createIncomeEntry);

router.get('/stats', validateDateRangeQuery, getIncomeStats);
router.get('/by-project', validateDateRangeQuery, getIncomeByProject);

router.route('/:id')
  .get(validateObjectId, getIncomeEntry)
  .put(validateObjectId, updateIncomeEntry)
  .delete(validateObjectId, deleteIncomeEntry);

export default router;
