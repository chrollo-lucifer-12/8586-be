import mongoose, { Schema, Document } from 'mongoose';
import { IIncomeEntry } from '../types';

export interface IIncomeEntryDocument extends Omit<IIncomeEntry, '_id'>, Document {}

const incomeEntrySchema = new Schema<IIncomeEntryDocument>(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    projectId: {
      type: String,
      required: [true, 'Project ID is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [2, 'Description must be at least 2 characters long'],
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    category: {
      type: String,
      enum: ['project-payment', 'bonus', 'other'],
      default: 'project-payment',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes
incomeEntrySchema.index({ userId: 1, date: -1 });
incomeEntrySchema.index({ userId: 1, projectId: 1 });
incomeEntrySchema.index({ userId: 1, category: 1 });
incomeEntrySchema.index({ userId: 1, isActive: 1 });

// Virtual for formatted amount
incomeEntrySchema.virtual('formattedAmount').get(function (this: IIncomeEntryDocument) {
  return `$${this.amount.toFixed(2)}`;
});

// Static methods
incomeEntrySchema.statics.findByUser = function (userId: string) {
  return this.find({ userId, isActive: true }).sort({ date: -1 });
};

incomeEntrySchema.statics.findByProject = function (userId: string, projectId: string) {
  return this.find({ userId, projectId, isActive: true }).sort({ date: -1 });
};

incomeEntrySchema.statics.findByCategory = function (userId: string, category: string) {
  return this.find({ userId, category, isActive: true }).sort({ date: -1 });
};

incomeEntrySchema.statics.findByDateRange = function (
  userId: string,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    userId,
    isActive: true,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: -1 });
};

incomeEntrySchema.statics.getTotalByUser = function (userId: string) {
  return this.aggregate([
    { $match: { userId, isActive: true } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
};

export default mongoose.model<IIncomeEntryDocument>('IncomeEntry', incomeEntrySchema);
