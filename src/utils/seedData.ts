import mongoose from 'mongoose';
import { User, Project, IncomeEntry, ExpenseEntry, SavingsGoal } from '../models';

import logger from './logger';

interface SeedUser {
  name: string;
  email: string;
  password: string;
  currency: string;
  profile: 'beginner' | 'intermediate' | 'advanced' | 'struggling' | 'excellent';
  monthlyTarget: number;
}

interface SeedProject {
  name: string;
  clientName: string;
  expectedPayment: number;
  status: 'active' | 'completed' | 'on-hold';
  budgetAllocation: number;
}

// User profiles with different financial situations
const seedUserProfiles: SeedUser[] = [
  {
    name: "Sarah Johnson",
    email: "sarah.johnson@test.com",
    password: "password123",
    currency: "USD",
    profile: "beginner",
    monthlyTarget: 3000
  },
  {
    name: "Mike Chen",
    email: "mike.chen@test.com", 
    password: "password123",
    currency: "USD",
    profile: "intermediate",
    monthlyTarget: 6000
  },
  {
    name: "Elena Rodriguez",
    email: "elena.rodriguez@test.com",
    password: "password123",
    currency: "USD", 
    profile: "advanced",
    monthlyTarget: 12000
  },
  {
    name: "Alex Thompson",
    email: "alex.thompson@test.com",
    password: "password123",
    currency: "USD",
    profile: "struggling",
    monthlyTarget: 2000
  },
  {
    name: "Lisa Wang",
    email: "lisa.wang@test.com",
    password: "password123",
    currency: "USD",
    profile: "excellent",
    monthlyTarget: 15000
  },
  {
    name: "David Kumar",
    email: "david.kumar@test.com",
    password: "password123",
    currency: "USD",
    profile: "intermediate",
    monthlyTarget: 4500
  }
];

// Project templates for different user types
const projectTemplates: Record<string, SeedProject[]> = {
  beginner: [
    { name: "Logo Design", clientName: "StartupCo", expectedPayment: 800, status: "completed", budgetAllocation: 15 },
    { name: "Website Mockup", clientName: "Local Bakery", expectedPayment: 1200, status: "active", budgetAllocation: 25 },
    { name: "Business Cards", clientName: "Freelance Writer", expectedPayment: 300, status: "completed", budgetAllocation: 10 }
  ],
  intermediate: [
    { name: "E-commerce Website", clientName: "Fashion Boutique", expectedPayment: 4500, status: "active", budgetAllocation: 30 },
    { name: "Mobile App UI", clientName: "FitnessTech", expectedPayment: 3200, status: "completed", budgetAllocation: 25 },
    { name: "Brand Identity Package", clientName: "GreenTech Solutions", expectedPayment: 2800, status: "on-hold", budgetAllocation: 20 },
    { name: "Dashboard Design", clientName: "Analytics Pro", expectedPayment: 2100, status: "completed", budgetAllocation: 15 }
  ],
  advanced: [
    { name: "Enterprise Platform", clientName: "TechCorp Inc", expectedPayment: 15000, status: "active", budgetAllocation: 35 },
    { name: "SaaS Application", clientName: "CloudSoft", expectedPayment: 12000, status: "completed", budgetAllocation: 30 },
    { name: "Digital Transformation", clientName: "RetailGiant", expectedPayment: 8500, status: "active", budgetAllocation: 25 },
    { name: "API Integration", clientName: "FinanceHub", expectedPayment: 6200, status: "completed", budgetAllocation: 20 }
  ],
  struggling: [
    { name: "Simple Website", clientName: "Mom & Pop Store", expectedPayment: 600, status: "on-hold", budgetAllocation: 30 },
    { name: "Social Media Graphics", clientName: "Local Restaurant", expectedPayment: 400, status: "completed", budgetAllocation: 20 },
    { name: "Flyer Design", clientName: "Community Event", expectedPayment: 200, status: "completed", budgetAllocation: 15 }
  ],
  excellent: [
    { name: "Global Rebrand", clientName: "Multinational Corp", expectedPayment: 25000, status: "active", budgetAllocation: 40 },
    { name: "AI Platform Design", clientName: "DeepTech Labs", expectedPayment: 18000, status: "completed", budgetAllocation: 35 },
    { name: "Fintech App", clientName: "CryptoBank", expectedPayment: 22000, status: "active", budgetAllocation: 30 },
    { name: "Healthcare Portal", clientName: "MedTech Solutions", expectedPayment: 16000, status: "completed", budgetAllocation: 25 }
  ]
};

// Generate realistic date ranges
const getRandomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const getLast6Months = (): Date[] => {
  const dates = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    dates.push(date);
  }
  return dates;
};

// Clear existing data
export const clearDatabase = async (): Promise<void> => {
  try {
    await User.deleteMany({});
    await Project.deleteMany({});
    await IncomeEntry.deleteMany({});
    await ExpenseEntry.deleteMany({});
    await SavingsGoal.deleteMany({});
    logger.info('Database cleared successfully');
  } catch (error) {
    logger.error('Error clearing database:', error);
    throw error;
  }
};

// Create users with different profiles
export const seedUsers = async (): Promise<mongoose.Types.ObjectId[]> => {
  const userIds: mongoose.Types.ObjectId[] = [];
  
  try {
    for (const userData of seedUserProfiles) {
      const user = await User.create({
        name: userData.name,
        email: userData.email,
        password: userData.password, // Let the User model handle hashing
        currency: userData.currency,
        achievements: ['welcome'],
        joinDate: getRandomDate(new Date(2024, 0, 1), new Date()),
        totalIncome: 0,
        totalSavings: 0
      });
      
      userIds.push(user._id as mongoose.Types.ObjectId);
      logger.info(`Created user: ${userData.name} (${userData.profile})`);
    }
    
    return userIds;
  } catch (error) {
    logger.error('Error seeding users:', error);
    throw error;
  }
};

// Create projects for each user based on their profile
export const seedProjects = async (userIds: mongoose.Types.ObjectId[]): Promise<Record<string, mongoose.Types.ObjectId[]>> => {
  const projectsByUser: Record<string, mongoose.Types.ObjectId[]> = {};
  
  try {
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const userProfile = seedUserProfiles[i].profile;
      const templates = projectTemplates[userProfile] || projectTemplates.intermediate;
      
      projectsByUser[userId.toString()] = [];
      
      for (const template of templates) {
        const project = await Project.create({
          userId,
          name: template.name,
          clientName: template.clientName,
          expectedPayment: template.expectedPayment,
          status: template.status,
          budgetAllocation: template.budgetAllocation,
          createdDate: getRandomDate(new Date(2024, 0, 1), new Date())
        });
        
        projectsByUser[userId.toString()].push(project._id as mongoose.Types.ObjectId);
      }
    }
    
    logger.info('Projects seeded successfully');
    return projectsByUser;
  } catch (error) {
    logger.error('Error seeding projects:', error);
    throw error;
  }
};

// Generate income entries based on user profile
export const seedIncome = async (
  userIds: mongoose.Types.ObjectId[], 
  projectsByUser: Record<string, mongoose.Types.ObjectId[]>
): Promise<void> => {
  try {
    const months = getLast6Months();
    
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const userProfile = seedUserProfiles[i].profile;
      const monthlyTarget = seedUserProfiles[i].monthlyTarget;
      const userProjects = projectsByUser[userId.toString()] || [];
      
      let totalUserIncome = 0;
      
      for (const month of months) {
        // Generate 2-5 income entries per month based on profile
        const entriesCount = userProfile === 'advanced' || userProfile === 'excellent' ? 
          Math.floor(Math.random() * 3) + 3 : Math.floor(Math.random() * 3) + 2;
        
        let monthlyIncome = 0;
        
        for (let j = 0; j < entriesCount; j++) {
          const projectId = userProjects[Math.floor(Math.random() * userProjects.length)];
          if (!projectId) continue;
          
          // Calculate amount based on profile
          let amount = 0;
          switch (userProfile) {
            case 'beginner':
              amount = Math.floor(Math.random() * 800) + 300; // $300-1100
              break;
            case 'intermediate':
              amount = Math.floor(Math.random() * 1500) + 800; // $800-2300
              break;
            case 'advanced':
              amount = Math.floor(Math.random() * 3000) + 2000; // $2000-5000
              break;
            case 'struggling':
              amount = Math.floor(Math.random() * 400) + 200; // $200-600
              break;
            case 'excellent':
              amount = Math.floor(Math.random() * 4000) + 3000; // $3000-7000
              break;
          }
          
          const categories = ['project-payment', 'bonus', 'other'] as const;
          const category = j === 0 ? 'project-payment' : categories[Math.floor(Math.random() * categories.length)];
          
          const entryDate = getRandomDate(month, new Date(month.getFullYear(), month.getMonth() + 1, 0));
          
          await IncomeEntry.create({
            userId,
            projectId,
            amount,
            description: category === 'project-payment' ? 'Project milestone payment' : 
                        category === 'bonus' ? 'Performance bonus' : 'Additional work',
            date: entryDate,
            category
          });
          
          monthlyIncome += amount;
          totalUserIncome += amount;
        }
      }
      
      // Update user's total income
      await User.findByIdAndUpdate(userId, { totalIncome: totalUserIncome });
      logger.info(`Generated income for ${seedUserProfiles[i].name}: $${totalUserIncome}`);
    }
    
    logger.info('Income entries seeded successfully');
  } catch (error) {
    logger.error('Error seeding income:', error);
    throw error;
  }
};

// Generate expense entries
export const seedExpenses = async (
  userIds: mongoose.Types.ObjectId[], 
  projectsByUser: Record<string, mongoose.Types.ObjectId[]>
): Promise<void> => {
  try {
    const months = getLast6Months();
    
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const userProfile = seedUserProfiles[i].profile;
      const userProjects = projectsByUser[userId.toString()] || [];
      
      for (const month of months) {
        // Generate 1-4 expense entries per month
        const entriesCount = Math.floor(Math.random() * 4) + 1;
        
        for (let j = 0; j < entriesCount; j++) {
          const projectId = userProjects[Math.floor(Math.random() * userProjects.length)];
          if (!projectId) continue;
          
          // Calculate expense amount (generally 10-30% of income)
          let amount = 0;
          switch (userProfile) {
            case 'beginner':
              amount = Math.floor(Math.random() * 200) + 50; // $50-250
              break;
            case 'intermediate':
              amount = Math.floor(Math.random() * 400) + 100; // $100-500
              break;
            case 'advanced':
              amount = Math.floor(Math.random() * 800) + 200; // $200-1000
              break;
            case 'struggling':
              amount = Math.floor(Math.random() * 150) + 30; // $30-180
              break;
            case 'excellent':
              amount = Math.floor(Math.random() * 1000) + 300; // $300-1300
              break;
          }
          
          const categories = ['software', 'subscriptions', 'equipment', 'marketing', 'other'] as const;
          const category = categories[Math.floor(Math.random() * categories.length)];
          
          const descriptions = {
            software: ['Adobe Creative Suite', 'Development Tools', 'Design Software', 'Project Management Tool'],
            subscriptions: ['Cloud Storage', 'Stock Photos', 'Email Marketing', 'Analytics Service'],
            equipment: ['New Laptop', 'Monitor', 'Graphics Tablet', 'Camera'],
            marketing: ['Google Ads', 'Social Media Ads', 'Website Hosting', 'SEO Tools'],
            other: ['Office Supplies', 'Internet Bill', 'Phone Bill', 'Training Course']
          };
          
          const entryDate = getRandomDate(month, new Date(month.getFullYear(), month.getMonth() + 1, 0));
          
          await ExpenseEntry.create({
            userId,
            projectId,
            amount,
            description: descriptions[category][Math.floor(Math.random() * descriptions[category].length)],
            date: entryDate,
            category
          });
        }
      }
    }
    
    logger.info('Expense entries seeded successfully');
  } catch (error) {
    logger.error('Error seeding expenses:', error);
    throw error;
  }
};

// Generate savings goals based on user profile
export const seedSavings = async (userIds: mongoose.Types.ObjectId[]): Promise<void> => {
  try {
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const userProfile = seedUserProfiles[i].profile;
      
      // Different savings patterns based on profile
      const savingsGoals = [];
      
      switch (userProfile) {
        case 'beginner':
          savingsGoals.push(
            { title: 'Emergency Fund', targetAmount: 5000, currentAmount: 1200, type: 'yearly' as const },
            { title: 'New Equipment', targetAmount: 2000, currentAmount: 400, type: 'monthly' as const }
          );
          break;
          
        case 'intermediate':
          savingsGoals.push(
            { title: 'Emergency Fund', targetAmount: 15000, currentAmount: 8000, type: 'yearly' as const },
            { title: 'Business Expansion', targetAmount: 10000, currentAmount: 3500, type: 'yearly' as const },
            { title: 'Professional Development', targetAmount: 3000, currentAmount: 1800, type: 'monthly' as const }
          );
          break;
          
        case 'advanced':
          savingsGoals.push(
            { title: 'Emergency Fund', targetAmount: 30000, currentAmount: 25000, type: 'yearly' as const },
            { title: 'Investment Portfolio', targetAmount: 50000, currentAmount: 20000, type: 'yearly' as const },
            { title: 'Office Space', targetAmount: 15000, currentAmount: 8000, type: 'yearly' as const }
          );
          break;
          
        case 'struggling':
          savingsGoals.push(
            { title: 'Emergency Fund', targetAmount: 2000, currentAmount: 300, type: 'yearly' as const },
            { title: 'New Laptop', targetAmount: 1500, currentAmount: 150, type: 'monthly' as const }
          );
          break;
          
        case 'excellent':
          savingsGoals.push(
            { title: 'Emergency Fund', targetAmount: 50000, currentAmount: 45000, type: 'yearly' as const },
            { title: 'Real Estate Investment', targetAmount: 100000, currentAmount: 35000, type: 'yearly' as const },
            { title: 'Retirement Fund', targetAmount: 200000, currentAmount: 75000, type: 'yearly' as const },
            { title: 'Business Acquisition', targetAmount: 80000, currentAmount: 25000, type: 'yearly' as const }
          );
          break;
      }
      
      let totalSavings = 0;
      
      for (const goal of savingsGoals) {
        const deadline = new Date();
        deadline.setMonth(deadline.getMonth() + (goal.type === 'monthly' ? 6 : 12));
        
        await SavingsGoal.create({
          userId,
          title: goal.title,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount,
          deadline: deadline.toISOString(),
          type: goal.type
        });
        
        totalSavings += goal.currentAmount;
      }
      
      // Update user's total savings
      await User.findByIdAndUpdate(userId, { totalSavings });
      logger.info(`Generated savings for ${seedUserProfiles[i].name}: $${totalSavings}`);
    }
    
    logger.info('Savings goals seeded successfully');
  } catch (error) {
    logger.error('Error seeding savings:', error);
    throw error;
  }
};

// Main seed function
export const seedDatabase = async (clearFirst: boolean = true): Promise<void> => {
  try {
    logger.info('Starting database seeding...');
    
    if (clearFirst) {
      await clearDatabase();
    }
    
    // Step 1: Create users
    const userIds = await seedUsers();
    
    // Step 2: Create projects
    const projectsByUser = await seedProjects(userIds);
    
    // Step 3: Generate income entries
    await seedIncome(userIds, projectsByUser);
    
    // Step 4: Generate expense entries
    await seedExpenses(userIds, projectsByUser);
    
    // Step 5: Create savings goals
    await seedSavings(userIds);
    
    logger.info('Database seeding completed successfully!');
    logger.info(`Created ${userIds.length} users with complete financial data`);
    
    // Log user credentials for testing
    logger.info('\n=== TEST USER CREDENTIALS ===');
    seedUserProfiles.forEach(user => {
      logger.info(`${user.name} (${user.profile}): ${user.email} / password123`);
    });
    logger.info('=============================\n');
    
  } catch (error) {
    logger.error('Error during database seeding:', error);
    throw error;
  }
};

export default seedDatabase;