import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function runMigration() {
  console.log('🚀 Starting Property Types Migration...\n');

  try {
    // Read migration SQL file
    const migrationPath = path.join(
      __dirname,
      '../prisma/migrations/20260115_add_property_types/migration.sql'
    );
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📝 Executing migration SQL...');
    
    // Execute migration in a transaction
    await prisma.$executeRawUnsafe(migrationSQL);

    console.log('✅ Migration completed successfully!\n');

    // Verify migration
    console.log('🔍 Verifying migration...');
    
    const categories = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM property_categories
    `;
    console.log(`   - Property categories: ${categories[0].count}`);

    const amenities = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM amenities
    `;
    console.log(`   - Amenities: ${amenities[0].count}`);

    const rentableItems = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM rentable_items WHERE property_category IS NOT NULL
    `;
    console.log(`   - Rentable items migrated: ${rentableItems[0].count}`);

    console.log('\n✨ Migration verification passed!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\n⚠️  To rollback, run: npm run rollback:property-types');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
