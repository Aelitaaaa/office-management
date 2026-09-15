import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash('hiura123', 10);

  await prisma.user.upsert({
    where: {
      username: 'hiura',
    },
    update: {
      password,
    },
    create: {
      name: 'Hiura',
      username: 'hiura',
      email: 'hiura@office.local',
      password,
      role: 'ADMIN',
    },
  });

  console.log('User Hiura berhasil dibuat');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });