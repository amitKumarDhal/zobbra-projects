const { PrismaClient } = require('@prisma/client');

const users = ['postgres', 'mohan', 'root', 'admin'];
const passes = ['', 'postgres', 'postgrespassword', 'root', 'admin', 'password', '1234', '123456', 'mohan', 'mohan123'];

async function check() {
  for (const user of users) {
    for (const pass of passes) {
      const url = `postgresql://${user}:${pass}@localhost:5432/zobra_db?schema=public`;
      const client = new PrismaClient({ datasources: { db: { url } } });
      try {
        await client.$connect();
        console.log('✅ MATCHED USER & PASSWORD:', user, ':', pass);
        await client.$disconnect();
        return;
      } catch (e) {
        if (e.message.includes('does not exist')) {
          console.log('✅ MATCHED USER & PASSWORD (DB missing):', user, ':', pass);
          await client.$disconnect();
          return;
        }
      } finally {
        await client.$disconnect();
      }
    }
  }
  console.log('No user/password matched.');
}

check();
