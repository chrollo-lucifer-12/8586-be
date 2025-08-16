import { Router } from 'express';
import {
  getExpenseEntries,
  getExpenseEntry,
  createExpenseEntry,
  updateExpenseEntry,
  deleteExpenseEntry,
  getExpenseStats,
  getExpensesByProject,
} from '../controllers/expenseController';
import { authenticate } from '../middleware/auth';
import {
  validateCreateExpense,
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
  .get(validatePaginationQuery, validateDateRangeQuery, getExpenseEntries)
  .post(validateCreateExpense, createExpenseEntry);

router.get('/stats', validateDateRangeQuery, getExpenseStats);
router.get('/by-project', validateDateRangeQuery, getExpensesByProject);

router.route('/:id')
  .get(validateObjectId, getExpenseEntry)
  .put(validateObjectId, updateExpenseEntry)
  .delete(validateObjectId, deleteExpenseEntry);

export default router;
