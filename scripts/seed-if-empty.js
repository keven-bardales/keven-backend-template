#!/usr/bin/env node

/**
 * Smart Database Seeding Script
 * 
 * This script checks if the database is empty before running the seed.
 * It prevents data loss by only seeding when there are no existing users.
 * 
 * Usage:
 *   node scripts/seed-if-empty.js
 *   npm run db:seed:check
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndSeed() {
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
    
    // Import and run the existing seed script
    const seedScript = require('../prisma/seed.ts');
    
    if (typeof seedScript === 'function') {
      await seedScript();
    } else {
      // If seed script is not exported as function, run it via child process
      const { execSync } = require('child_process');
      execSync('npm run db:seed', { stdio: 'inherit' });
    }
    
    console.log('🌱 Database seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error during database check/seed:', error);
    
    // If it's a connection error, the database might not be ready yet
    if (error.code === 'P1001' || error.code === 'ENOTFOUND') {
      console.log('⏳ Database not ready yet, will retry on next startup...');
      process.exit(0); // Don't fail the startup process
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Check if this script is being run directly
if (require.main === module) {
  checkAndSeed();
}

module.exports = checkAndSeed;