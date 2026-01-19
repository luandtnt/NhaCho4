/**
 * Cleanup Old Rentable Items
 * Deletes old items that don't have enhanced fields (base_price IS NULL)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting cleanup of old rentable items...\n');

  // Find old items (without enhanced fields)
  const oldItems = await prisma.rentableItem.findMany({
    where: {
      base_price: null,
    },
    include: {
      listings: true,
      bookings: true,
      space_node: {
        include: {
          asset: true,
        },
      },
    },
  });

  console.log(`Found ${oldItems.length} old items to delete\n`);

  // Get unique asset IDs
  const oldAssetIds = [...new Set(oldItems.map(item => item.space_node.asset_id))];
  console.log(`Found ${oldAssetIds.length} old assets to delete\n`);

  // Delete listings first (cascade will handle listing_rentable_items)
  const listingIds = oldItems.flatMap(item => item.listings.map(l => l.listing_id));
  const uniqueListingIds = [...new Set(listingIds)];
  
  if (uniqueListingIds.length > 0) {
    console.log(`Deleting ${uniqueListingIds.length} listings...`);
    await prisma.listing.deleteMany({
      where: {
        id: { in: uniqueListingIds },
      },
    });
    console.log('✅ Listings deleted\n');
  }

  // Delete rentable items
  console.log(`Deleting ${oldItems.length} rentable items...`);
  await prisma.rentableItem.deleteMany({
    where: {
      id: { in: oldItems.map(item => item.id) },
    },
  });
  console.log('✅ Rentable items deleted\n');

  // Delete space nodes
  const spaceNodeIds = oldItems.map(item => item.space_node_id);
  const allSpaceNodes = await prisma.spaceNode.findMany({
    where: {
      asset_id: { in: oldAssetIds },
    },
  });
  
  console.log(`Deleting ${allSpaceNodes.length} space nodes...`);
  await prisma.spaceNode.deleteMany({
    where: {
      id: { in: allSpaceNodes.map(n => n.id) },
    },
  });
  console.log('✅ Space nodes deleted\n');

  // Delete assets
  console.log(`Deleting ${oldAssetIds.length} assets...`);
  await prisma.asset.deleteMany({
    where: {
      id: { in: oldAssetIds },
    },
  });
  console.log('✅ Assets deleted\n');

  // Verify cleanup
  const remainingItems = await prisma.rentableItem.count();
  const remainingListings = await prisma.listing.count();
  
  console.log('📊 Final counts:');
  console.log(`  - Rentable items: ${remainingItems}`);
  console.log(`  - Listings: ${remainingListings}`);
  
  console.log('\n🎉 Cleanup complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
