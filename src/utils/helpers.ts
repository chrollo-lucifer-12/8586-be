/**
 * Pagination utility functions
 */

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const getPaginationOptions = (query: any): PaginationOptions => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  return { page, limit, sortBy, sortOrder };
};

export const calculatePagination = (
  total: number,
  page: number,
  limit: number
): PaginationResult => {
  const pages = Math.ceil(total / limit);
  const hasNext = page < pages;
  const hasPrev = page > 1;

  return {
    page,
    limit,
    total,
    pages,
    hasNext,
    hasPrev,
  };
};

export const getSkipValue = (page: number, limit: number): number => {
  return (page - 1) * limit;
};

/**
 * Date utility functions
 */

export const getDateRange = (query: any): { startDate?: Date; endDate?: Date } => {
  const result: { startDate?: Date; endDate?: Date } = {};

  if (query.startDate) {
    result.startDate = new Date(query.startDate);
  }

  if (query.endDate) {
    result.endDate = new Date(query.endDate);
    // Set to end of day
    result.endDate.setHours(23, 59, 59, 999);
  }

  return result;
};

export const getMonthRange = (year: number, month: number): { start: Date; end: Date } => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
};

export const getYearRange = (year: number): { start: Date; end: Date } => {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);
  return { start, end };
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Response utility functions
 */

export const successResponse = <T>(
  message: string,
  data?: T,
  pagination?: PaginationResult
) => {
  const response: any = {
    success: true,
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (pagination) {
    response.pagination = pagination;
  }

  return response;
};

export const errorResponse = (message: string, error?: string) => {
  return {
    success: false,
    message,
    ...(error && { error }),
  };
};

/**
 * Validation utility functions
 */

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

export const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Currency utility functions
 */

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const roundToTwoDecimals = (amount: number): number => {
  return Math.round(amount * 100) / 100;
};

/**
 * Array utility functions
 */

export const removeDuplicates = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const group = item[key] as unknown as string;
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

/**
 * String utility functions
 */

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

export const truncate = (str: string, length: number): string => {
  return str.length > length ? str.substring(0, length) + '...' : str;
};
