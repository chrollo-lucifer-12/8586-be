import mongoose, { Schema, Document } from 'mongoose';
import { IProject } from '../types';

export interface IProjectDocument extends Omit<IProject, '_id'>, Document {}

const projectSchema = new Schema<IProjectDocument>(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [2, 'Project name must be at least 2 characters long'],
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    clientName: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
      minlength: [2, 'Client name must be at least 2 characters long'],
      maxlength: [100, 'Client name cannot exceed 100 characters'],
    },
    expectedPayment: {
      type: Number,
      required: [true, 'Expected payment is required'],
      min: [0, 'Expected payment cannot be negative'],
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'on-hold'],
      default: 'active',
    },
    createdDate: {
      type: Date,
      default: Date.now,
    },
    budgetAllocation: {
      type: Number,
      default: 10,
      min: [0, 'Budget allocation cannot be negative'],
      max: [100, 'Budget allocation cannot exceed 100%'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
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
projectSchema.index({ userId: 1, status: 1 });
projectSchema.index({ userId: 1, isActive: 1 });
projectSchema.index({ userId: 1, createdDate: -1 });

// Virtual for project age
projectSchema.virtual('projectAge').get(function (this: IProjectDocument) {
  const now = new Date();
  const created = new Date(this.createdDate);
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Static methods
projectSchema.statics.findByUser = function (userId: string) {
  return this.find({ userId, isActive: true });
};

projectSchema.statics.findActiveByUser = function (userId: string) {
  return this.find({ userId, status: 'active', isActive: true });
};

projectSchema.statics.findCompletedByUser = function (userId: string) {
  return this.find({ userId, status: 'completed', isActive: true });
};

export default mongoose.model<IProjectDocument>('Project', projectSchema);
