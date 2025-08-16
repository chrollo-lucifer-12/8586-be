import { Response } from 'express';
import SavingsGoal from '../models/SavingsGoal';
import { successResponse, getPaginationOptions, calculatePagination, getSkipValue } from '../utils/helpers';
import { asyncHandler } from '../middleware/errorHandler';
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError
} from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';

/**
 * @desc    Get all savings goals for the authenticated user
 * @route   GET /api/v1/savings
 * @access  Private
 */
export const getSavingsGoals = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const { page, limit, sortBy, sortOrder } = getPaginationOptions(req.query);
  const { status, category, priority } = req.query;

  // Build query
  const query: any = { userId, isActive: true };
  
  if (status) {
    if (status === 'active') {
      query.isCompleted = false;
    } else if (status === 'completed') {
      query.isCompleted = true;
    }
  }
  
  if (category) {
    query.category = category;
  }
  
  if (priority && ['low', 'medium', 'high'].includes(priority as string)) {
    query.priority = priority;
  }

  // Get total count
  const total = await SavingsGoal.countDocuments(query);

  // Get savings goals with pagination
  const savingsGoals = await SavingsGoal.find(query)
    .sort({ [sortBy!]: sortOrder === 'desc' ? -1 : 1 })
    .skip(getSkipValue(page!, limit!))
    .limit(limit!);

  const pagination = calculatePagination(total, page!, limit!);

  logger.info(`Retrieved ${savingsGoals.length} savings goals for user ${userId}`);

  res.json(
    successResponse('Savings goals retrieved successfully', savingsGoals, pagination)
  );
});

/**
 * @desc    Get active savings goals for the authenticated user
 * @route   GET /api/v1/savings/active
 * @access  Private
 */
export const getActiveSavingsGoals = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const savingsGoals = await SavingsGoal.findActiveByUser(userId);

  logger.info(`Retrieved ${savingsGoals.length} active savings goals for user ${userId}`);

  res.json(
    successResponse('Active savings goals retrieved successfully', savingsGoals)
  );
});

/**
 * @desc    Get completed savings goals for the authenticated user
 * @route   GET /api/v1/savings/completed
 * @access  Private
 */
export const getCompletedSavingsGoals = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const savingsGoals = await SavingsGoal.findCompletedByUser(userId);

  logger.info(`Retrieved ${savingsGoals.length} completed savings goals for user ${userId}`);

  res.json(
    successResponse('Completed savings goals retrieved successfully', savingsGoals)
  );
});

/**
 * @desc    Get savings goals expiring soon for the authenticated user
 * @route   GET /api/v1/savings/expiring-soon
 * @access  Private
 */
export const getExpiringSoonSavingsGoals = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const days = parseInt(req.query.days as string) || 7;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  if (days < 1 || days > 365) {
    throw new BadRequestError('Days must be between 1 and 365');
  }

  const savingsGoals = await SavingsGoal.findExpiringSoon(userId, days);

  logger.info(`Retrieved ${savingsGoals.length} expiring savings goals for user ${userId}`);

  res.json(
    successResponse(`Savings goals expiring in next ${days} days retrieved successfully`, savingsGoals)
  );
});

/**
 * @desc    Get a single savings goal by ID
 * @route   GET /api/v1/savings/:id
 * @access  Private
 */
export const getSavingsGoalById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const savingsGoal = await SavingsGoal.findOne({ _id: id, userId, isActive: true });

  if (!savingsGoal) {
    throw new NotFoundError('Savings goal not found');
  }

  logger.info(`Retrieved savings goal ${id} for user ${userId}`);

  res.json(
    successResponse('Savings goal retrieved successfully', savingsGoal)
  );
});

/**
 * @desc    Create a new savings goal
 * @route   POST /api/v1/savings
 * @access  Private
 */
export const createSavingsGoal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const { title, targetAmount, currentAmount, deadline, description, category, priority } = req.body;

  // Validation
  if (!title || !targetAmount || !deadline) {
    throw new BadRequestError('Title, target amount, and deadline are required');
  }

  if (targetAmount <= 0) {
    throw new BadRequestError('Target amount must be greater than 0');
  }

  if (currentAmount && currentAmount < 0) {
    throw new BadRequestError('Current amount cannot be negative');
  }

  if (new Date(deadline) <= new Date()) {
    throw new BadRequestError('Deadline must be in the future');
  }

  const goalData = {
    userId,
    title: title.trim(),
    targetAmount,
    currentAmount: currentAmount || 0,
    deadline: new Date(deadline),
    description: description?.trim(),
    category,
    priority: priority || 'medium',
    isActive: true,
    isCompleted: false
  };

  const newSavingsGoal = new SavingsGoal(goalData);
  const savedSavingsGoal = await newSavingsGoal.save();

  logger.info(`Created new savings goal ${savedSavingsGoal._id} for user ${userId}`);

  res.status(201).json(
    successResponse('Savings goal created successfully', savedSavingsGoal)
  );
});

/**
 * @desc    Update a savings goal
 * @route   PUT /api/v1/savings/:id
 * @access  Private
 */
export const updateSavingsGoal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const savingsGoal = await SavingsGoal.findOne({ _id: id, userId, isActive: true });

  if (!savingsGoal) {
    throw new NotFoundError('Savings goal not found');
  }

  const { title, targetAmount, currentAmount, deadline, description, category, priority } = req.body;

  // Update only provided fields
  if (title !== undefined) {
    if (!title.trim()) {
      throw new BadRequestError('Title cannot be empty');
    }
    savingsGoal.title = title.trim();
  }

  if (targetAmount !== undefined) {
    if (targetAmount <= 0) {
      throw new BadRequestError('Target amount must be greater than 0');
    }
    savingsGoal.targetAmount = targetAmount;
  }

  if (currentAmount !== undefined) {
    if (currentAmount < 0) {
      throw new BadRequestError('Current amount cannot be negative');
    }
    savingsGoal.currentAmount = currentAmount;
  }

  if (deadline !== undefined) {
    const newDeadline = new Date(deadline);
    if (newDeadline <= new Date()) {
      throw new BadRequestError('Deadline must be in the future');
    }
    savingsGoal.deadline = newDeadline;
  }

  if (description !== undefined) {
    savingsGoal.description = description?.trim();
  }

  if (category !== undefined) {
    savingsGoal.category = category;
  }

  if (priority !== undefined) {
    if (!['low', 'medium', 'high'].includes(priority)) {
      throw new BadRequestError('Priority must be low, medium, or high');
    }
    savingsGoal.priority = priority;
  }

  const updatedSavingsGoal = await savingsGoal.save();

  logger.info(`Updated savings goal ${id} for user ${userId}`);

  res.json(
    successResponse('Savings goal updated successfully', updatedSavingsGoal)
  );
});

/**
 * @desc    Update savings goal progress (add/subtract amount)
 * @route   PATCH /api/v1/savings/:id/progress
 * @access  Private
 */
export const updateSavingsGoalProgress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;
  const { amount, action } = req.body; // action: 'add' or 'subtract'

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  if (!amount || amount <= 0) {
    throw new BadRequestError('Amount must be greater than 0');
  }

  if (!action || !['add', 'subtract'].includes(action)) {
    throw new BadRequestError('Action must be either "add" or "subtract"');
  }

  const savingsGoal = await SavingsGoal.findOne({ _id: id, userId, isActive: true });

  if (!savingsGoal) {
    throw new NotFoundError('Savings goal not found');
  }

  if (action === 'add') {
    savingsGoal.currentAmount += amount;
  } else {
    const newAmount = savingsGoal.currentAmount - amount;
    if (newAmount < 0) {
      throw new BadRequestError('Cannot subtract more than current amount');
    }
    savingsGoal.currentAmount = newAmount;
  }

  const updatedSavingsGoal = await savingsGoal.save();

  logger.info(`Updated progress for savings goal ${id} for user ${userId}. Action: ${action}, Amount: ${amount}`);

  res.json(
    successResponse(
      `Savings goal progress updated successfully. ${action === 'add' ? 'Added' : 'Subtracted'} $${amount}`,
      { savingsGoal: updatedSavingsGoal, action, amount }
    )
  );
});

/**
 * @desc    Delete/Deactivate a savings goal
 * @route   DELETE /api/v1/savings/:id
 * @access  Private
 */
export const deleteSavingsGoal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const savingsGoal = await SavingsGoal.findOne({ _id: id, userId, isActive: true });

  if (!savingsGoal) {
    throw new NotFoundError('Savings goal not found');
  }

  // Soft delete by setting isActive to false
  savingsGoal.isActive = false;
  await savingsGoal.save();

  logger.info(`Deleted savings goal ${id} for user ${userId}`);

  res.json(
    successResponse('Savings goal deleted successfully')
  );
});

/**
 * @desc    Get savings goals statistics for the authenticated user
 * @route   GET /api/v1/savings/stats
 * @access  Private
 */
export const getSavingsGoalsStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const [totalGoals, activeGoals, completedGoals, expiringSoon] = await Promise.all([
    SavingsGoal.countDocuments({ userId, isActive: true }),
    SavingsGoal.countDocuments({ userId, isActive: true, isCompleted: false }),
    SavingsGoal.countDocuments({ userId, isActive: true, isCompleted: true }),
    SavingsGoal.findExpiringSoon(userId, 7)
  ]);

  // Calculate total amounts
  const goalsData = await SavingsGoal.find({ userId, isActive: true });
  const totalTargetAmount = goalsData.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrentAmount = goalsData.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

  const stats = {
    totalGoals,
    activeGoals,
    completedGoals,
    expiringSoonCount: expiringSoon.length,
    totalTargetAmount,
    totalCurrentAmount,
    totalProgress: Math.round(totalProgress * 100) / 100
  };

  logger.info(`Retrieved savings goals statistics for user ${userId}`);

  res.json(
    successResponse('Savings goals statistics retrieved successfully', stats)
  );
});

