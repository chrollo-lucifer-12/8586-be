#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { seedDatabase } from '../utils/seedData';
import Database from '../config/database';
import logger from '../utils/logger';

// Load environment variables
dotenv.config();

// CLI argument parsing
const args = process.argv.slice(2);
const shouldClear = !args.includes('--no-clear');
const helpFlag = args.includes('--help') || args.includes('-h');

if (helpFlag) {
  console.log(`
🌱 FreelancerPro Database Seeder

Usage: npm run seed [options]

Options:
  --no-clear    Don't clear existing data before seeding
  --help, -h    Show this help message

Examples:
  npm run seed              # Clear database and seed with fresh data
  npm run seed -- --no-clear   # Add seed data to existing database
  
This script creates 6 test users with different financial profiles:
• Sarah Johnson (Beginner) - Getting started freelancer
• Mike Chen (Intermediate) - Established freelancer  
• Elena Rodriguez (Advanced) - High-earning freelancer
• Alex Thompson (Struggling) - Having financial difficulties
• Lisa Wang (Excellent) - Very successful freelancer
• David Kumar (Intermediate) - Solid middle-tier freelancer

Each user gets realistic:
• Projects based on their experience level
• Income entries spanning 6 months
• Expense entries with various categories
• Savings goals appropriate to their profile

All users have the password: password123
`);
  process.exit(0);
}

async function runSeed() {
  try {
    logger.info('🌱 Starting FreelancerPro Database Seeding...');
    
    // Connect to database
    const db = Database.getInstance();
    await db.connect();
    
    // Run seeding
    await seedDatabase(shouldClear);
    
    logger.info('✅ Seeding completed successfully!');
    logger.info('🔐 All users have password: password123');
    logger.info('🚀 You can now test the application with realistic data');
    
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    logger.info('📚 Database connection closed');
    process.exit(0);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  logger.info('\n⚠️  Seeding interrupted by user');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('\n⚠️  Seeding terminated');
  await mongoose.connection.close();
  process.exit(0);
});

// Run the seeder
runSeed();