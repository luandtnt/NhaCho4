/**
 * Create Listings for Enhanced Rentable Items
 * Creates published listings for all rentable items
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creating listings for enhanced rentable items...\n');

  const landlordUser = await prisma.user.findFirst({
    where: { email: 'landlord@example.com' },
  });

  if (!landlordUser) {
    throw new Error('❌ Landlord user not found');
  }

  const orgId = landlordUser.org_id;

  // Get all rentable items
  const rentableItems = await prisma.rentableItem.findMany({
    where: {
      org_id: orgId,
      status: 'ACTIVE',
    },
    include: {
      space_node: {
        include: {
          asset: true,
        },
      },
    },
  });

  console.log(`Found ${rentableItems.length} rentable items\n`);

  let created = 0;

  for (const item of rentableItems) {
    const asset = item.space_node.asset;
    
    // Create listing
    const listing = await prisma.listing.create({
      data: {
        org_id: orgId,
        title: `Cho thuê ${asset.name} ${item.code}`,
        description: `${asset.name} ${item.code} tại ${item.address_full}. Diện tích ${item.area_sqm}m², giá ${item.base_price?.toString()}đ/${item.price_unit?.toLowerCase()}`,
        media: [],
        tags: [],
        pricing_display: {
          currency: item.currency || 'VND',
          base_price: item.base_price?.toString() || '0',
          from_amount: parseFloat(item.base_price?.toString() || '0'),
          unit: item.price_unit?.toLowerCase() || 'month',
        },
        status: 'PUBLISHED',
        rentable_items: {
          create: {
            rentable_item_id: item.id,
          },
        },
      },
    });

    created++;
  }

  console.log(`\n🎉 Created ${created} published listings!`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
