import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { BadRequestError } from './errorHandler';

// Middleware to handle validation errors
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    throw new BadRequestError(`Validation failed: ${errorMessages.join(', ')}`);
  }
  
  next();
};

// Auth validation rules
export const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'])
    .withMessage('Invalid currency code'),
  handleValidationErrors,
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

export const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
  handleValidationErrors,
];

export const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  handleValidationErrors,
];

export const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'])
    .withMessage('Invalid currency code'),
  handleValidationErrors,
];

// Project validation rules
export const validateCreateProject = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Project name must be between 2 and 100 characters'),
  body('clientName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Client name must be between 2 and 100 characters'),
  body('expectedPayment')
    .isFloat({ min: 0.01 })
    .withMessage('Expected payment must be greater than 0'),
  body('status')
    .optional()
    .isIn(['active', 'completed', 'on-hold'])
    .withMessage('Status must be active, completed, or on-hold'),
  body('budgetAllocation')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Budget allocation must be between 0 and 100'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  handleValidationErrors,
];

export const validateUpdateProject = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Project name must be between 2 and 100 characters'),
  body('clientName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Client name must be between 2 and 100 characters'),
  body('expectedPayment')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Expected payment must be greater than 0'),
  body('status')
    .optional()
    .isIn(['active', 'completed', 'on-hold'])
    .withMessage('Status must be active, completed, or on-hold'),
  body('budgetAllocation')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Budget allocation must be between 0 and 100'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  handleValidationErrors,
];

// Income validation rules
export const validateCreateIncome = [
  body('projectId')
    .isMongoId()
    .withMessage('Valid project ID is required'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('description')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Description must be between 2 and 200 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('category')
    .optional()
    .isIn(['project-payment', 'bonus', 'other'])
    .withMessage('Category must be project-payment, bonus, or other'),
  handleValidationErrors,
];

// Expense validation rules
export const validateCreateExpense = [
  body('projectId')
    .isMongoId()
    .withMessage('Valid project ID is required'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('description')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Description must be between 2 and 200 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('category')
    .optional()
    .isIn(['software', 'subscriptions', 'equipment', 'marketing', 'other'])
    .withMessage('Category must be software, subscriptions, equipment, marketing, or other'),
  handleValidationErrors,
];

// Savings goal validation rules
export const validateCreateSavingsGoal = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters'),
  body('targetAmount')
    .isFloat({ min: 1 })
    .withMessage('Target amount must be at least $1'),
  body('deadline')
    .isISO8601()
    .withMessage('Invalid deadline format')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    }),
  body('type')
    .optional()
    .isIn(['monthly', 'yearly'])
    .withMessage('Type must be monthly or yearly'),
  handleValidationErrors,
];

export const validateUpdateSavingsGoal = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters'),
  body('targetAmount')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Target amount must be at least $1'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Invalid deadline format')
    .custom((value, { req }) => {
      if (value && new Date(value) <= new Date()) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    }),
  body('type')
    .optional()
    .isIn(['monthly', 'yearly'])
    .withMessage('Type must be monthly or yearly'),
  body('currentAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Current amount cannot be negative'),
  handleValidationErrors,
];

// Parameter validation rules
export const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors,
];

export const validateProjectStatus = [
  param('status')
    .isIn(['active', 'completed', 'on-hold'])
    .withMessage('Status must be active, completed, or on-hold'),
  handleValidationErrors,
];

// Query validation rules
export const validatePaginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Sort by field cannot be empty'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  handleValidationErrors,
];

export const validateDateRangeQuery = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  handleValidationErrors,
];
