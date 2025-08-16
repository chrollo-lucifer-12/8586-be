import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

// User types
export interface IUser {
  name: string;
  email: string;
  password: string;
  currency: string;
  joinDate: Date;
  totalIncome: number;
  totalSavings: number;
  achievements: string[];
  isActive: boolean;
  lastLogin?: Date;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Project types
export interface IProject {
  userId: string;
  name: string;
  clientName: string;
  expectedPayment: number;
  status: 'active' | 'completed' | 'on-hold';
  createdDate: Date;
  budgetAllocation: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Income Entry types
export interface IIncomeEntry {
  userId: string;
  projectId: string;
  amount: number;
  description: string;
  date: Date;
  category: 'project-payment' | 'bonus' | 'other';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Expense Entry types
export interface IExpenseEntry {
  userId: string;
  projectId: string;
  amount: number;
  description: string;
  date: Date;
  category: 'software' | 'subscriptions' | 'equipment' | 'marketing' | 'other';
  receiptUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Savings Goal types
export interface ISavingsGoal {
  _id?: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  description?: string;
  category?: 'emergency-fund' | 'vacation' | 'house' | 'car' | 'education' | 'retirement' | 'other';
  priority?: 'low' | 'medium' | 'high';
  isActive?: boolean;
  isCompleted?: boolean;
  type?: 'monthly' | 'yearly';
  createdAt?: Date;
  updatedAt?: Date;
}


// JWT Payload types
export interface IJWTPayload extends JwtPayload {
  userId: string;
  email: string;
}

// Request types with user attached
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

// Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Query types
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRangeQuery {
  startDate?: string;
  endDate?: string;
}

// Dashboard types
export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  activeProjects: number;
  completedProjects: number;
  totalSavings: number;
  savingsGoals: number;
  recentTransactions: Array<{
    id: string;
    type: 'income' | 'expense';
    amount: number;
    description: string;
    date: Date;
    projectName?: string;
  }>;
  monthlyData: Array<{
    month: string;
    income: number;
    expenses: number;
    profit: number;
  }>;
}

// Analytics types
export interface IncomeAnalytics {
  totalIncome: number;
  averageMonthlyIncome: number;
  incomeByCategory: Record<string, number>;
  incomeByProject: Array<{
    projectId: string;
    projectName: string;
    totalIncome: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    amount: number;
  }>;
}

export interface ExpenseAnalytics {
  totalExpenses: number;
  averageMonthlyExpenses: number;
  expensesByCategory: Record<string, number>;
  expensesByProject: Array<{
    projectId: string;
    projectName: string;
    totalExpenses: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    amount: number;
  }>;
}

// File upload types
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

// Validation schemas
export interface CreateUserSchema {
  name: string;
  email: string;
  password: string;
  currency?: string;
}

export interface LoginSchema {
  email: string;
  password: string;
}

export interface UpdateUserSchema {
  name?: string;
  email?: string;
  currency?: string;
}

export interface CreateProjectSchema {
  name: string;
  clientName: string;
  expectedPayment: number;
  status?: 'active' | 'completed' | 'on-hold';
  budgetAllocation?: number;
  description?: string;
}

export interface CreateIncomeSchema {
  projectId: string;
  amount: number;
  description: string;
  date?: Date;
  category?: 'project-payment' | 'bonus' | 'other';
}

export interface CreateExpenseSchema {
  projectId: string;
  amount: number;
  description: string;
  date?: Date;
  category?: 'software' | 'subscriptions' | 'equipment' | 'marketing' | 'other';
}

export interface CreateSavingsGoalSchema {
  title: string;
  targetAmount: number;
  deadline: Date;
  type?: 'monthly' | 'yearly';
}
