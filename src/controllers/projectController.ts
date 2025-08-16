import { Response } from 'express';
import { Project } from '../models';
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
 * @desc    Get all projects for the authenticated user
 * @route   GET /api/v1/projects
 * @access  Private
 */
export const getProjects = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const { page, limit, sortBy, sortOrder } = getPaginationOptions(req.query);
  const { status } = req.query;

  // Build query
  const query: any = { userId, isActive: true };
  if (status && ['active', 'completed', 'on-hold'].includes(status as string)) {
    query.status = status;
  }

  // Get total count
  const total = await Project.countDocuments(query);
  
  // Get projects with pagination
  const projects = await Project.find(query)
    .sort({ [sortBy!]: sortOrder === 'asc' ? 1 : -1 })
    .skip(getSkipValue(page!, limit!))
    .limit(limit!);

  const pagination = calculatePagination(total, page!, limit!);

  res.json(
    successResponse('Projects retrieved successfully', projects, pagination)
  );
});

/**
 * @desc    Get a single project by ID
 * @route   GET /api/v1/projects/:id
 * @access  Private
 */
export const getProject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const project = await Project.findOne({ 
    _id: id, 
    userId, 
    isActive: true 
  });

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  res.json(
    successResponse('Project retrieved successfully', project)
  );
});

/**
 * @desc    Create a new project
 * @route   POST /api/v1/projects
 * @access  Private
 */
export const createProject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const { 
    name, 
    clientName, 
    expectedPayment, 
    status = 'active', 
    budgetAllocation = 10,
    description 
  } = req.body;

  // Validate required fields
  if (!name || !clientName || !expectedPayment) {
    throw new BadRequestError('Name, client name, and expected payment are required');
  }

  if (expectedPayment <= 0) {
    throw new BadRequestError('Expected payment must be greater than 0');
  }

  if (budgetAllocation < 0 || budgetAllocation > 100) {
    throw new BadRequestError('Budget allocation must be between 0 and 100');
  }

  // Create project
  const project = await Project.create({
    userId,
    name: name.trim(),
    clientName: clientName.trim(),
    expectedPayment,
    status,
    budgetAllocation,
    description: description?.trim(),
    createdDate: new Date(),
  });

  logger.info(`New project created: ${project.name} by user ${userId}`);

  res.status(201).json(
    successResponse('Project created successfully', project)
  );
});

/**
 * @desc    Update a project
 * @route   PUT /api/v1/projects/:id
 * @access  Private
 */
export const updateProject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const project = await Project.findOne({ 
    _id: id, 
    userId, 
    isActive: true 
  });

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  const { 
    name, 
    clientName, 
    expectedPayment, 
    status, 
    budgetAllocation,
    description 
  } = req.body;

  // Validate fields if provided
  if (expectedPayment !== undefined && expectedPayment <= 0) {
    throw new BadRequestError('Expected payment must be greater than 0');
  }

  if (budgetAllocation !== undefined && (budgetAllocation < 0 || budgetAllocation > 100)) {
    throw new BadRequestError('Budget allocation must be between 0 and 100');
  }

  if (status && !['active', 'completed', 'on-hold'].includes(status)) {
    throw new BadRequestError('Invalid status value');
  }

  // Update project fields
  if (name) project.name = name.trim();
  if (clientName) project.clientName = clientName.trim();
  if (expectedPayment !== undefined) project.expectedPayment = expectedPayment;
  if (status) project.status = status;
  if (budgetAllocation !== undefined) project.budgetAllocation = budgetAllocation;
  if (description !== undefined) project.description = description?.trim();

  await project.save();

  logger.info(`Project updated: ${project.name} by user ${userId}`);

  res.json(
    successResponse('Project updated successfully', project)
  );
});

/**
 * @desc    Delete a project (soft delete)
 * @route   DELETE /api/v1/projects/:id
 * @access  Private
 */
export const deleteProject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const project = await Project.findOne({ 
    _id: id, 
    userId, 
    isActive: true 
  });

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  // Soft delete
  project.isActive = false;
  await project.save();

  logger.info(`Project deleted: ${project.name} by user ${userId}`);

  res.json(
    successResponse('Project deleted successfully')
  );
});

/**
 * @desc    Get project statistics
 * @route   GET /api/v1/projects/stats
 * @access  Private
 */
export const getProjectStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const stats = await Project.aggregate([
    { $match: { userId, isActive: true } },
    {
      $group: {
        _id: null,
        totalProjects: { $sum: 1 },
        activeProjects: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        completedProjects: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        onHoldProjects: {
          $sum: { $cond: [{ $eq: ['$status', 'on-hold'] }, 1, 0] }
        },
        totalExpectedPayment: { $sum: '$expectedPayment' },
        averageExpectedPayment: { $avg: '$expectedPayment' }
      }
    }
  ]);

  const result = stats[0] || {
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    onHoldProjects: 0,
    totalExpectedPayment: 0,
    averageExpectedPayment: 0
  };

  res.json(
    successResponse('Project statistics retrieved successfully', result)
  );
});

/**
 * @desc    Get projects by status
 * @route   GET /api/v1/projects/status/:status
 * @access  Private
 */
export const getProjectsByStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { status } = req.params;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  if (!['active', 'completed', 'on-hold'].includes(status)) {
    throw new BadRequestError('Invalid status value');
  }

  const { page, limit, sortBy, sortOrder } = getPaginationOptions(req.query);

  // Get total count
  const total = await Project.countDocuments({ 
    userId, 
    status, 
    isActive: true 
  });
  
  // Get projects with pagination
  const projects = await Project.find({ 
    userId, 
    status, 
    isActive: true 
  })
    .sort({ [sortBy!]: sortOrder === 'asc' ? 1 : -1 })
    .skip(getSkipValue(page!, limit!))
    .limit(limit!);

  const pagination = calculatePagination(total, page!, limit!);

  res.json(
    successResponse(`${status} projects retrieved successfully`, projects, pagination)
  );
});
