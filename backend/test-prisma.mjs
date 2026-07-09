import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

console.log('DATABASE_URL:', process.env.DATABASE_URL);

try {
  const prisma = new PrismaClient();
  console.log('PrismaClient instantiated successfully');
  await prisma.$disconnect();
} catch (error) {
  console.error('Error:', error);
}
