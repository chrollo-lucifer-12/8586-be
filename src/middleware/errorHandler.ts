import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import logger from '../utils/logger';
import config from '../config';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Create specific error classes
export class BadRequestError extends CustomError {
  constructor(message: string = 'Bad Request') {
    super(message, 400);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
  }
}

export class AppValidationError extends CustomError {
  constructor(message: string = 'Validation failed') {
    super(message, 422);
  }
}

export class InternalServerError extends CustomError {
  constructor(message: string = 'Internal Server Error') {
    super(message, 500);
  }
}

// Handle Mongoose validation errors
const handleValidationError = (error: mongoose.Error.ValidationError): CustomError => {
  const errors = Object.values(error.errors).map((err: any) => err.message);
  const message = `Validation failed: ${errors.join(', ')}`;
  return new BadRequestError(message);
};

// Handle Mongoose duplicate key errors
const handleDuplicateKeyError = (error: any): CustomError => {
  const field = Object.keys(error.keyValue)[0];
  const value = error.keyValue[field];
  const message = `${field} '${value}' already exists`;
  return new ConflictError(message);
};

// Handle Mongoose cast errors
const handleCastError = (error: any): CustomError => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new BadRequestError(message);
};

// Handle JWT errors
const handleJWTError = (): CustomError => {
  return new UnauthorizedError('Invalid token. Please log in again.');
};

const handleJWTExpiredError = (): CustomError => {
  return new UnauthorizedError('Your token has expired. Please log in again.');
};

// Send error response for development
const sendErrorDevelopment = (err: AppError, res: Response): void => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Send error response for production
const sendErrorProduction = (err: AppError, res: Response): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error('ERROR:', err);

    res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

// Global error handling middleware
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = handleCastError(error);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    error = handleDuplicateKeyError(error);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    error = handleValidationError(error);
  }

  // JWT error
  if (err instanceof JsonWebTokenError) {
    error = handleJWTError();
  }

  // JWT expired error
  if (err instanceof TokenExpiredError) {
    error = handleJWTExpiredError();
  }

  if (config.server.nodeEnv === 'development') {
    sendErrorDevelopment(error, res);
  } else {
    sendErrorProduction(error, res);
  }
};

// Handle unhandled promise rejections
export const handleUnhandledRejection = (): void => {
  process.on('unhandledRejection', (err: Error) => {
    logger.error('UNHANDLED REJECTION! Shutting down...', err);
    process.exit(1);
  });
};

// Handle uncaught exceptions
export const handleUncaughtException = (): void => {
  process.on('uncaughtException', (err: Error) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
    process.exit(1);
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
