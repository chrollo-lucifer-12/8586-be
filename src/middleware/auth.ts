import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { User } from '../models';
import { AuthenticatedRequest, IJWTPayload } from '../types';
import logger from '../utils/logger';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as IJWTPayload;
      
      // Check if user still exists and is active
      const user = await User.findById(decoded.userId).select('+refreshTokens');
      
      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: 'User account not found or inactive',
        });
        return;
      }

      // Attach user info to request
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
      };

      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          message: 'Access token has expired',
        });
        return;
      }
      
      if (jwtError instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          message: 'Invalid access token',
        });
        return;
      }

      throw jwtError;
    }
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
    });
  }
};

export const optionalAuthenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as IJWTPayload;
      
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
        };
      }
    } catch (jwtError) {
      // Silently fail for optional authentication
    }

    next();
  } catch (error) {
    logger.error('Optional authentication middleware error:', error);
    next();
  }
};

export const authorize = (...roles: string[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // For now, we don't have roles, but this can be extended
      // All authenticated users have access
      next();
    } catch (error) {
      logger.error('Authorization middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during authorization',
      });
    }
  };
};
