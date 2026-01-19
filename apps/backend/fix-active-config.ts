import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find the active config
  const activeConfig = await prisma.configBundle.findFirst({
    where: { status: 'ACTIVE' },
  });

  console.log('Active config:', activeConfig?.bundle_id);

  if (activeConfig) {
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
      where: { id: activeConfig.id },
      data: { config: updatedConfig },
    });

    console.log('✅ Config updated with all asset types');
    
    // Verify
    const updated = await prisma.configBundle.findUnique({
      where: { id: activeConfig.id },
    });
    console.log('Updated config:', JSON.stringify(updated?.config, null, 2));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
