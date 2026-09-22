import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      company: { select: { id: true, name: true } },
      _count: {
        select: {
          quotes: true,
          orders: true,
          inquiries: true,
        }
      }
    }
  });
  console.log('All Users in DB:');
  console.log(JSON.stringify(users, null, 2));

  const quotesCount = await prisma.quote.count();
  const ordersCount = await prisma.order.count();
  const inquiriesCount = await prisma.inquiry.count();
  console.log({ quotesCount, ordersCount, inquiriesCount });
}

main().finally(() => prisma.$disconnect());
