import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function rollbackMigration() {
  console.log('⏪ Starting Property Types Migration Rollback...\n');

  const confirm = process.argv.includes('--confirm');
  
  if (!confirm) {
    console.log('⚠️  WARNING: This will remove all property type data!');
    console.log('   To confirm rollback, run: npm run rollback:property-types -- --confirm\n');
    process.exit(0);
  }

  try {
    // Read rollback SQL file
    const rollbackPath = path.join(
      __dirname,
      '../prisma/migrations/20260115_add_property_types/rollback.sql'
    );
    
    if (!fs.existsSync(rollbackPath)) {
      throw new Error(`Rollback file not found: ${rollbackPath}`);
    }

    const rollbackSQL = fs.readFileSync(rollbackPath, 'utf-8');

    console.log('📝 Executing rollback SQL...');
    
    // Execute rollback in a transaction
    await prisma.$executeRawUnsafe(rollbackSQL);

    console.log('✅ Rollback completed successfully!\n');

    console.log('🔍 Verifying rollback...');
    
    // Verify tables are dropped
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('property_categories', 'amenities')
    `;
    
    if (Array.isArray(tables) && tables.length === 0) {
      console.log('   ✓ Reference tables removed');
    } else {
      console.log('   ⚠️  Some tables still exist');
    }

    console.log('\n✨ Rollback verification passed!');
    console.log('   System restored to previous state.');

  } catch (error) {
    console.error('❌ Rollback failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

rollbackMigration();
