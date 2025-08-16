import express from 'express';
import {
  getSavingsGoals,
  getActiveSavingsGoals,
  getCompletedSavingsGoals,
  getExpiringSoonSavingsGoals,
  getSavingsGoalById,
  createSavingsGoal,
  updateSavingsGoal,
  updateSavingsGoalProgress,
  deleteSavingsGoal,
  getSavingsGoalsStats
} from '../controllers/savingsController';
//import { protect } from '../middleware/auth'; // Assuming you have auth middleware

const router = express.Router();

// Apply authentication middleware to all routes
//router.use(protect);

// Stats route (should be before :id route)
router.get('/stats', getSavingsGoalsStats);

// Specific goal type routes
router.get('/active', getActiveSavingsGoals);
router.get('/completed', getCompletedSavingsGoals);
router.get('/expiring-soon', getExpiringSoonSavingsGoals);

// Main CRUD routes
router.route('/')
  .get(getSavingsGoals)
  .post(createSavingsGoal);

router.route('/:id')
  .get(getSavingsGoalById)
  .put(updateSavingsGoal)
  .delete(deleteSavingsGoal);

// Progress update route
router.patch('/:id/progress', updateSavingsGoalProgress);

export default router;

