import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`
    SELECT id, bundle_id, config::text 
    FROM config_bundles 
    WHERE status = 'ACTIVE'
    LIMIT 1
  `;

  console.log('Raw result:', result);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
