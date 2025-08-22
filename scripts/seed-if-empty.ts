#!/usr/bin/env tsx

/**
 * Smart Database Seeding Script (TypeScript)
 * 
 * This script checks if the database is empty before running the seed.
 * It prevents data loss by only seeding when there are no existing users.
 * 
 * Usage:
 *   tsx scripts/seed-if-empty.ts
 *   npm run db:seed:check
 */

import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

async function checkAndSeed(): Promise<void> {
  try {
    console.log('🔍 Checking if database needs seeding...');
    
    // Check if there are any users in the database
    const userCount = await prisma.user.count();
    
    if (userCount > 0) {
      console.log(`✅ Database already has ${userCount} user(s), skipping seed`);
      console.log('💡 To force reseed, run: npm run db:reset');
      return;
    }
    
    console.log('📋 Database is empty, running seed...');
    
    // Run the Prisma seed command
    try {
      await execAsync('npx prisma db seed');
      console.log('🌱 Database seeded successfully!');
    } catch (seedError) {
      console.error('❌ Error during seeding:', seedError);
      throw seedError;
    }
    
  } catch (error: any) {
    console.error('❌ Error during database check/seed:', error);
    
    // If it's a connection error, the database might not be ready yet
    if (error.code === 'P1001' || error.code === 'ENOTFOUND') {
      console.log('⏳ Database not ready yet, will retry on next startup...');
      process.exit(0); // Don't fail the startup process
    }
    
    // Check if it's a table doesn't exist error (migrations haven't run)
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      console.log('⚠️  Database schema not found. Run migrations first: npm run db:deploy');
      process.exit(1);
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
checkAndSeed();

export default checkAndSeed;