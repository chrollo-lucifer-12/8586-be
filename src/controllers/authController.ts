import { Request, Response } from 'express';
import { User } from '../models';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import { successResponse, errorResponse, isValidEmail, isValidPassword } from '../utils/helpers';
import { asyncHandler } from '../middleware/errorHandler';
import { 
  BadRequestError, 
  UnauthorizedError, 
  ConflictError,
  NotFoundError 
} from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, currency = 'USD' } = req.body;

  // Validate input
  if (!name || !email || !password) {
    throw new BadRequestError('Name, email, and password are required');
  }

  if (!isValidEmail(email)) {
    throw new BadRequestError('Please provide a valid email address');
  }

  if (!isValidPassword(password)) {
    throw new BadRequestError('Password must be at least 6 characters long');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  // Create user
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    currency,
    achievements: ['welcome'],
  });

  // Generate tokens
  const tokens = generateTokenPair({
    userId: (user._id as any).toString(),
    email: user.email,
  });

  // Save refresh token
  user.refreshTokens.push(tokens.refreshToken);
  await user.save();

  logger.info(`New user registered: ${user.email}`);

  res.status(201).json(
    successResponse('User registered successfully', {
      user: user.toJSON(),
      tokens,
    })
  );
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    throw new BadRequestError('Email and password are required');
  }

  // Find user and include password
  const user = await User.findOne({ 
    email: email.toLowerCase(),
    isActive: true 
  }).select('+password +refreshTokens');

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Generate tokens
  const tokens = generateTokenPair({
    userId: (user._id as any).toString(),
    email: user.email,
  });

  // Save refresh token and update last login
  user.refreshTokens.push(tokens.refreshToken);
  user.lastLogin = new Date();
  await user.save();

  logger.info(`User logged in: ${user.email}`);

  res.json(
    successResponse('Login successful', {
      user: user.toJSON(),
      tokens,
    })
  );
});

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh
 * @access  Public
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new BadRequestError('Refresh token is required');
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.userId).select('+refreshTokens');
    
    if (!user || !user.isActive || !user.refreshTokens.includes(refreshToken)) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = generateTokenPair({
      userId: (user._id as any).toString(),
      email: user.email,
    });

    // Replace old refresh token with new one
    user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
    user.refreshTokens.push(tokens.refreshToken);
    await user.save();

    res.json(
      successResponse('Token refreshed successfully', { tokens })
    );
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
});

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { refreshToken } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  // Find user and remove refresh token
  const user = await User.findById(userId).select('+refreshTokens');
  
  if (user && refreshToken) {
    user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
    await user.save();
  }

  logger.info(`User logged out: ${req.user?.email}`);

  res.json(successResponse('Logout successful'));
});

/**
 * @desc    Logout from all devices
 * @route   POST /api/v1/auth/logout-all
 * @access  Private
 */
export const logoutAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  // Find user and clear all refresh tokens
  const user = await User.findById(userId).select('+refreshTokens');
  
  if (user) {
    user.refreshTokens = [];
    await user.save();
  }

  logger.info(`User logged out from all devices: ${req.user?.email}`);

  res.json(successResponse('Logged out from all devices successfully'));
});

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const user = await User.findById(userId);
  
  if (!user || !user.isActive) {
    throw new NotFoundError('User not found');
  }

  res.json(
    successResponse('User profile retrieved successfully', user.toJSON())
  );
});

/**
 * @desc    Update user profile
 * @route   PUT /api/v1/auth/me
 * @access  Private
 */
export const updateMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { name, email, currency } = req.body;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const user = await User.findById(userId);
  
  if (!user || !user.isActive) {
    throw new NotFoundError('User not found');
  }

  // Check if email is being changed and is unique
  if (email && email !== user.email) {
    if (!isValidEmail(email)) {
      throw new BadRequestError('Please provide a valid email address');
    }

    const existingUser = await User.findOne({ 
      email: email.toLowerCase(),
      _id: { $ne: userId }
    });
    
    if (existingUser) {
      throw new ConflictError('Email already in use');
    }
  }

  // Update user fields
  if (name) user.name = name.trim();
  if (email) user.email = email.toLowerCase().trim();
  if (currency) user.currency = currency;

  await user.save();

  logger.info(`User profile updated: ${user.email}`);

  res.json(
    successResponse('Profile updated successfully', user.toJSON())
  );
});

/**
 * @desc    Change password
 * @route   PUT /api/v1/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { currentPassword, newPassword } = req.body;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  if (!currentPassword || !newPassword) {
    throw new BadRequestError('Current password and new password are required');
  }

  if (!isValidPassword(newPassword)) {
    throw new BadRequestError('New password must be at least 6 characters long');
  }

  // Find user with password
  const user = await User.findById(userId).select('+password +refreshTokens');
  
  if (!user || !user.isActive) {
    throw new NotFoundError('User not found');
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  
  // Clear all refresh tokens to force re-login on all devices
  user.refreshTokens = [];
  
  await user.save();

  logger.info(`Password changed for user: ${user.email}`);

  res.json(successResponse('Password changed successfully'));
});
