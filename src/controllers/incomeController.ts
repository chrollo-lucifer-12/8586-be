import { Response } from 'express';
import { IncomeEntry, Project } from '../models';
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
 * @desc    Get all income entries for the authenticated user
 * @route   GET /api/v1/income
 * @access  Private
 */
export const getIncomeEntries = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  
  if (category && ['project-payment', 'bonus', 'other'].includes(category as string)) {
    query.category = category;
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  // Get total count
  const total = await IncomeEntry.countDocuments(query);
  
  // Get income entries with pagination
  const incomeEntries = await IncomeEntry.find(query)
    .sort({ [sortBy!]: sortOrder === 'asc' ? 1 : -1 })
    .skip(getSkipValue(page!, limit!))
    .limit(limit!);

  // Populate project names
  const populatedEntries = await Promise.all(
    incomeEntries.map(async (entry) => {
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
    successResponse('Income entries retrieved successfully', populatedEntries, pagination)
  );
});

/**
 * @desc    Get a single income entry by ID
 * @route   GET /api/v1/income/:id
 * @access  Private
 */
export const getIncomeEntry = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const incomeEntry = await IncomeEntry.findOne({ 
    _id: id, 
    userId, 
    isActive: true 
  });

  if (!incomeEntry) {
    throw new NotFoundError('Income entry not found');
  }

  // Get project details
  const project = await Project.findOne({ 
    _id: incomeEntry.projectId, 
    userId, 
    isActive: true 
  }).select('name clientName');

  const result = {
    ...incomeEntry.toObject(),
    project: project ? { name: project.name, clientName: project.clientName } : null
  };

  res.json(
    successResponse('Income entry retrieved successfully', result)
  );
});

/**
 * @desc    Create a new income entry
 * @route   POST /api/v1/income
 * @access  Private
 */
export const createIncomeEntry = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const { 
    projectId, 
    amount, 
    description, 
    date = new Date(),
    category = 'project-payment'
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

  // Create income entry
  const incomeEntry = await IncomeEntry.create({
    userId,
    projectId,
    amount,
    description: description.trim(),
    date: new Date(date),
    category,
  });

  logger.info(`New income entry created: $${amount} for project ${project.name} by user ${userId}`);

  res.status(201).json(
    successResponse('Income entry created successfully', incomeEntry)
  );
});

/**
 * @desc    Update an income entry
 * @route   PUT /api/v1/income/:id
 * @access  Private
 */
export const updateIncomeEntry = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const incomeEntry = await IncomeEntry.findOne({ 
    _id: id, 
    userId, 
    isActive: true 
  });

  if (!incomeEntry) {
    throw new NotFoundError('Income entry not found');
  }

  const { projectId, amount, description, date, category } = req.body;

  // Validate fields if provided
  if (amount !== undefined && amount <= 0) {
    throw new BadRequestError('Amount must be greater than 0');
  }

  if (category && !['project-payment', 'bonus', 'other'].includes(category)) {
    throw new BadRequestError('Invalid category value');
  }

  // If project is being changed, verify it exists and belongs to user
  if (projectId && projectId !== incomeEntry.projectId) {
    const project = await Project.findOne({ 
      _id: projectId, 
      userId, 
      isActive: true 
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }
  }

  // Update income entry fields
  if (projectId) incomeEntry.projectId = projectId;
  if (amount !== undefined) incomeEntry.amount = amount;
  if (description) incomeEntry.description = description.trim();
  if (date) incomeEntry.date = new Date(date);
  if (category) incomeEntry.category = category;

  await incomeEntry.save();

  logger.info(`Income entry updated: ${incomeEntry._id} by user ${userId}`);

  res.json(
    successResponse('Income entry updated successfully', incomeEntry)
  );
});

/**
 * @desc    Delete an income entry (soft delete)
 * @route   DELETE /api/v1/income/:id
 * @access  Private
 */
export const deleteIncomeEntry = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const incomeEntry = await IncomeEntry.findOne({ 
    _id: id, 
    userId, 
    isActive: true 
  });

  if (!incomeEntry) {
    throw new NotFoundError('Income entry not found');
  }

  // Soft delete
  incomeEntry.isActive = false;
  await incomeEntry.save();

  logger.info(`Income entry deleted: ${incomeEntry._id} by user ${userId}`);

  res.json(
    successResponse('Income entry deleted successfully')
  );
});

/**
 * @desc    Get income statistics
 * @route   GET /api/v1/income/stats
 * @access  Private
 */
export const getIncomeStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

  const stats = await IncomeEntry.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: '$amount' },
        totalEntries: { $sum: 1 },
        averageIncome: { $avg: '$amount' },
        incomeByCategory: {
          $push: {
            category: '$category',
            amount: '$amount'
          }
        }
      }
    }
  ]);

  // Get income by category
  const categoryStats = await IncomeEntry.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  // Get monthly income trend
  const monthlyStats = await IncomeEntry.aggregate([
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
      totalIncome: 0,
      totalEntries: 0,
      averageIncome: 0
    },
    incomeByCategory: categoryStats.reduce((acc, stat) => {
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
    successResponse('Income statistics retrieved successfully', result)
  );
});

/**
 * @desc    Get income by project
 * @route   GET /api/v1/income/by-project
 * @access  Private
 */
export const getIncomeByProject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

  const projectStats = await IncomeEntry.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$projectId',
        totalIncome: { $sum: '$amount' },
        entryCount: { $sum: 1 }
      }
    },
    {
      $sort: { totalIncome: -1 }
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
        totalIncome: stat.totalIncome,
        entryCount: stat.entryCount
      };
    })
  );

  res.json(
    successResponse('Income by project retrieved successfully', result)
  );
});
