import dotenv from 'dotenv';
import { connectDB, disconnectDB } from './config/db.ts';

dotenv.config();

async function runSeed() {
  console.log('🌱 Starting standalone database seed script...');
  try {
    await connectDB();
    console.log('✅ Database seeding finished successfully.');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

runSeed();
