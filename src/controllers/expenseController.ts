import { Response } from 'express';
import { ExpenseEntry, Project } from '../models';
import { successResponse, getPaginationOptions, calculatePagination, getSkipValue, getDateRange } from '../utils/helpers';
import { asyncHandler } from '../middleware/errorHandler';
import { 
  BadRequestError, 
  NotFoundError,
  UnauthorizedError 
} from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';

/**
 * @desc    Get all expense entries for the authenticated user
 * @route   GET /api/v1/expenses
 * @access  Private
 */
export const getExpenseEntries = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const { page, limit, sortBy, sortOrder } = getPaginationOptions(req.query);
  const { projectId, category } = req.query;
  const { startDate, endDate } = getDateRange(req.query);

  // Build query
  const query: any = { userId, isActive: true };
  
  if (projectId) {
    query.projectId = projectId;
  }
  
  if (category && ['software', 'subscriptions', 'equipment', 'marketing', 'other'].includes(category as string)) {
    query.category = category;
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  // Get total count
  const total = await ExpenseEntry.countDocuments(query);
  
  // Get expense entries with pagination
  const expenseEntries = await ExpenseEntry.find(query)
    .sort({ [sortBy!]: sortOrder === 'asc' ? 1 : -1 })
    .skip(getSkipValue(page!, limit!))
    .limit(limit!);

  // Populate project names
  const populatedEntries = await Promise.all(
    expenseEntries.map(async (entry) => {
      const project = await Project.findOne({ 
        _id: entry.projectId, 
        userId, 
        isActive: true 
      }).select('name clientName');
      
      return {
        ...entry.toObject(),
        project: project ? { name: project.name, clientName: project.clientName } : null
      };
    })
  );

  const pagination = calculatePagination(total, page!, limit!);

  res.json(
    successResponse('Expense entries retrieved successfully', populatedEntries, pagination)
  );
});

/**
 * @desc    Get a single expense entry by ID
 * @route   GET /api/v1/expenses/:id
 * @access  Private
 */
export const getExpenseEntry = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const expenseEntry = await ExpenseEntry.findOne({ 
    _id: id, 
    userId, 
    isActive: true 
  });

  if (!expenseEntry) {
    throw new NotFoundError('Expense entry not found');
  }

  // Get project details
  const project = await Project.findOne({ 
    _id: expenseEntry.projectId, 
    userId, 
    isActive: true 
  }).select('name clientName');

  const result = {
    ...expenseEntry.toObject(),
    project: project ? { name: project.name, clientName: project.clientName } : null
  };

  res.json(
    successResponse('Expense entry retrieved successfully', result)
  );
});

/**
 * @desc    Create a new expense entry
 * @route   POST /api/v1/expenses
 * @access  Private
 */
export const createExpenseEntry = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const { 
    projectId, 
    amount, 
    description, 
    date = new Date(),
    category = 'other',
    receiptUrl
  } = req.body;

  // Validate required fields
  if (!projectId || !amount || !description) {
    throw new BadRequestError('Project ID, amount, and description are required');
  }

  if (amount <= 0) {
    throw new BadRequestError('Amount must be greater than 0');
  }

  // Verify project exists and belongs to user
  const project = await Project.findOne({ 
    _id: projectId, 
    userId, 
    isActive: true 
  });

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  // Create expense entry
  const expenseEntry = await ExpenseEntry.create({
    userId,
    projectId,
    amount,
    description: description.trim(),
    date: new Date(date),
    category,
    receiptUrl: receiptUrl?.trim(),
  });

  logger.info(`New expense entry created: $${amount} for project ${project.name} by user ${userId}`);

  res.status(201).json(
    successResponse('Expense entry created successfully', expenseEntry)
  );
});

/**
 * @desc    Update an expense entry
 * @route   PUT /api/v1/expenses/:id
 * @access  Private
 */
export const updateExpenseEntry = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const expenseEntry = await ExpenseEntry.findOne({ 
    _id: id, 
    userId, 
    isActive: true 
  });

  if (!expenseEntry) {
    throw new NotFoundError('Expense entry not found');
  }

  const { projectId, amount, description, date, category, receiptUrl } = req.body;

  // Validate fields if provided
  if (amount !== undefined && amount <= 0) {
    throw new BadRequestError('Amount must be greater than 0');
  }

  if (category && !['software', 'subscriptions', 'equipment', 'marketing', 'other'].includes(category)) {
    throw new BadRequestError('Invalid category value');
  }

  // If project is being changed, verify it exists and belongs to user
  if (projectId && projectId !== expenseEntry.projectId) {
    const project = await Project.findOne({ 
      _id: projectId, 
      userId, 
      isActive: true 
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }
  }

  // Update expense entry fields
  if (projectId) expenseEntry.projectId = projectId;
  if (amount !== undefined) expenseEntry.amount = amount;
  if (description) expenseEntry.description = description.trim();
  if (date) expenseEntry.date = new Date(date);
  if (category) expenseEntry.category = category;
  if (receiptUrl !== undefined) expenseEntry.receiptUrl = receiptUrl?.trim();

  await expenseEntry.save();

  logger.info(`Expense entry updated: ${expenseEntry._id} by user ${userId}`);

  res.json(
    successResponse('Expense entry updated successfully', expenseEntry)
  );
});

/**
 * @desc    Delete an expense entry (soft delete)
 * @route   DELETE /api/v1/expenses/:id
 * @access  Private
 */
export const deleteExpenseEntry = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const expenseEntry = await ExpenseEntry.findOne({ 
    _id: id, 
    userId, 
    isActive: true 
  });

  if (!expenseEntry) {
    throw new NotFoundError('Expense entry not found');
  }

  // Soft delete
  expenseEntry.isActive = false;
  await expenseEntry.save();

  logger.info(`Expense entry deleted: ${expenseEntry._id} by user ${userId}`);

  res.json(
    successResponse('Expense entry deleted successfully')
  );
});

/**
 * @desc    Get expense statistics
 * @route   GET /api/v1/expenses/stats
 * @access  Private
 */
export const getExpenseStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const { startDate, endDate } = getDateRange(req.query);
  const matchQuery: any = { userId, isActive: true };

  if (startDate || endDate) {
    matchQuery.date = {};
    if (startDate) matchQuery.date.$gte = startDate;
    if (endDate) matchQuery.date.$lte = endDate;
  }

  const stats = await ExpenseEntry.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: '$amount' },
        totalEntries: { $sum: 1 },
        averageExpense: { $avg: '$amount' }
      }
    }
  ]);

  // Get expenses by category
  const categoryStats = await ExpenseEntry.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  // Get monthly expense trend
  const monthlyStats = await ExpenseEntry.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  const result = {
    ...stats[0] || {
      totalExpenses: 0,
      totalEntries: 0,
      averageExpense: 0
    },
    expensesByCategory: categoryStats.reduce((acc, stat) => {
      acc[stat._id] = stat.total;
      return acc;
    }, {} as Record<string, number>),
    monthlyTrend: monthlyStats.map(stat => ({
      month: `${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}`,
      amount: stat.total,
      count: stat.count
    }))
  };

  res.json(
    successResponse('Expense statistics retrieved successfully', result)
  );
});

/**
 * @desc    Get expenses by project
 * @route   GET /api/v1/expenses/by-project
 * @access  Private
 */
export const getExpensesByProject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const { startDate, endDate } = getDateRange(req.query);
  const matchQuery: any = { userId, isActive: true };

  if (startDate || endDate) {
    matchQuery.date = {};
    if (startDate) matchQuery.date.$gte = startDate;
    if (endDate) matchQuery.date.$lte = endDate;
  }

  const projectStats = await ExpenseEntry.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$projectId',
        totalExpenses: { $sum: '$amount' },
        entryCount: { $sum: 1 }
      }
    },
    {
      $sort: { totalExpenses: -1 }
    }
  ]);

  // Get project details
  const result = await Promise.all(
    projectStats.map(async (stat) => {
      const project = await Project.findOne({ 
        _id: stat._id, 
        userId, 
        isActive: true 
      }).select('name clientName');
      
      return {
        projectId: stat._id,
        projectName: project?.name || 'Unknown Project',
        clientName: project?.clientName || 'Unknown Client',
        totalExpenses: stat.totalExpenses,
        entryCount: stat.entryCount
      };
    })
  );

  res.json(
    successResponse('Expenses by project retrieved successfully', result)
  );
});
