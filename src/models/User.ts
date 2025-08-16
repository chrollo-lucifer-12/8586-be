import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  toJSON(): any;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't include password in queries by default
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'],
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    totalIncome: {
      type: Number,
      default: 0,
      min: [0, 'Total income cannot be negative'],
    },
    totalSavings: {
      type: Number,
      default: 0,
      min: [0, 'Total savings cannot be negative'],
    },
    achievements: [
      {
        type: String,
        enum: [
          'welcome',
          'first-project',
          'first-income',
          'first-expense',
          'first-saving',
          'project-master',
          'savings-guru',
          'expense-tracker',
        ],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    refreshTokens: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
userSchema.index({ isActive: 1 });

// Pre-save middleware to hash password
userSchema.pre<IUserDocument>('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to transform output
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.refreshTokens;
  delete userObject.__v;
  
  return userObject;
};

// Virtual for net worth
userSchema.virtual('netWorth').get(function () {
  return this.totalIncome + this.totalSavings;
});

// Virtual for profile completion
userSchema.virtual('profileCompletion').get(function () {
  let score = 0;
  if (this.name) score += 25;
  if (this.email) score += 25;
  if (this.currency) score += 25;
  if (this.achievements && this.achievements.length > 1) score += 25;
  return score;
});

// Static method to find active users
userSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

// Static method to find by email
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

export default mongoose.model<IUserDocument>('User', userSchema);
