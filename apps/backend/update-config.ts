import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const config = await prisma.configBundle.findFirst({
    where: {
      bundle_id: 'cfg_2026_01_04_001',
    },
  });

  if (config) {
    const updatedConfig: any = {
      asset_types: {
        apartment_building: {
          schema_ref: 'schemas/apartment_building.json',
        },
        apartment_monthly: {
          schema_ref: 'schemas/apartment.json',
        },
        coworking_hourly: {
          schema_ref: 'schemas/coworking.json',
        },
      },
      pricing: {
        policies: ['pricing/apartment_monthly.json'],
      },
      workflows: {
        agreement: 'workflows/agreement.json',
        billing: 'workflows/billing.json',
      },
    };

    await prisma.configBundle.update({
      where: { id: config.id },
      data: { config: updatedConfig },
    });

    console.log('✅ Config updated with all asset types');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
