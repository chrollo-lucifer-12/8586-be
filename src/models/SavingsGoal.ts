import mongoose, { Schema, Document, Model } from 'mongoose';
import { ISavingsGoal } from '../types';

export interface ISavingsGoalDocument extends Omit<ISavingsGoal, '_id'>, Document {}

// Define interface for static methods
interface ISavingsGoalModel extends Model<ISavingsGoalDocument> {
  findByUser(userId: string): Promise<ISavingsGoalDocument[]>;
  findActiveByUser(userId: string): Promise<ISavingsGoalDocument[]>;
  findCompletedByUser(userId: string): Promise<ISavingsGoalDocument[]>;
  findExpiringSoon(userId: string, days?: number): Promise<ISavingsGoalDocument[]>;
}

const savingsGoalSchema = new Schema<ISavingsGoalDocument>(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters long'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [1, 'Target amount must be at least $1'],
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: [0, 'Current amount cannot be negative'],
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
      validate: {
        validator: function (this: ISavingsGoalDocument, value: Date) {
          return value > new Date();
        },
        message: 'Deadline must be in the future',
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    category: {
      type: String,
      enum: ['emergency-fund', 'vacation', 'house', 'car', 'education', 'retirement', 'other'],
      default: 'other',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
  },
  {
    timestamps: true,
    versionKey: false, // This fixes your __v issue
    toJSON: {
      virtuals: true,
    },
    toObject: { virtuals: true },
  }
);

// Virtual properties
savingsGoalSchema.virtual('formattedTargetAmount').get(function (this: ISavingsGoalDocument) {
  return `$${this.targetAmount.toFixed(2)}`;
});

savingsGoalSchema.virtual('formattedCurrentAmount').get(function (this: ISavingsGoalDocument) {
  return `$${this.currentAmount.toFixed(2)}`;
});

savingsGoalSchema.virtual('progressPercentage').get(function (this: ISavingsGoalDocument) {
  return Math.min(100, (this.currentAmount / this.targetAmount) * 100);
});

savingsGoalSchema.virtual('remainingAmount').get(function (this: ISavingsGoalDocument) {
  return Math.max(0, this.targetAmount - this.currentAmount);
});

savingsGoalSchema.virtual('daysRemaining').get(function (this: ISavingsGoalDocument) {
  const now = new Date();
  const timeDiff = this.deadline.getTime() - now.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Pre-save middleware to check if goal is completed
savingsGoalSchema.pre<ISavingsGoalDocument>('save', function (next) {
  if (this.currentAmount >= this.targetAmount && !this.isCompleted) {
    this.isCompleted = true;
  }
  next();
});

// Static methods - NOW WITH PROPER TYPING
savingsGoalSchema.statics.findByUser = function (userId: string) {
  return this.find({ userId, isActive: true }).sort({ deadline: 1 });
};

savingsGoalSchema.statics.findActiveByUser = function (userId: string) {
  return this.find({ userId, isActive: true, isCompleted: false }).sort({ deadline: 1 });
};

savingsGoalSchema.statics.findCompletedByUser = function (userId: string) {
  return this.find({ userId, isActive: true, isCompleted: true }).sort({ updatedAt: -1 });
};

savingsGoalSchema.statics.findExpiringSoon = function (userId: string, days: number = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.find({
    userId,
    isActive: true,
    isCompleted: false,
    deadline: { $lte: futureDate },
  }).sort({ deadline: 1 });
};

// Instance methods
savingsGoalSchema.methods.addProgress = function (amount: number) {
  this.currentAmount += amount;
  return this.save();
};

savingsGoalSchema.methods.subtractProgress = function (amount: number) {
  this.currentAmount = Math.max(0, this.currentAmount - amount);
  return this.save();
};

savingsGoalSchema.methods.markCompleted = function () {
  this.isCompleted = true;
  return this.save();
};

savingsGoalSchema.methods.markActive = function () {
  this.isCompleted = false;
  return this.save();
};

// Indexes for better performance
savingsGoalSchema.index({ userId: 1, isActive: 1 });
savingsGoalSchema.index({ userId: 1, isCompleted: 1 });
savingsGoalSchema.index({ userId: 1, deadline: 1 });
savingsGoalSchema.index({ userId: 1, category: 1 });
savingsGoalSchema.index({ userId: 1, priority: 1 });

// Export with proper typing
export default mongoose.model<ISavingsGoalDocument, ISavingsGoalModel>('SavingsGoal', savingsGoalSchema);

