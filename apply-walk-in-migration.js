// Simple Node.js script to apply walk-in booking migration
// Just run: node apply-walk-in-migration.js

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('========================================');
  console.log('Walk-in Booking Migration');
  console.log('========================================\n');

  try {
    // Read migration SQL file
    const migrationPath = path.join(__dirname, 'apps/backend/prisma/migrations/20260117_walk_in_bookings/migration.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('[1/3] Running SQL migration...');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        await prisma.$executeRawUnsafe(statement + ';');
      }
    }

    console.log('✓ SQL migration completed successfully\n');

    console.log('[2/3] Verifying migration...');
    
    // Verify columns exist
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      AND column_name IN ('actual_start_at', 'actual_end_at', 'is_walk_in', 'estimated_duration_hours', 'walk_in_notes')
      ORDER BY column_name
    `;

    console.log('✓ Migration verified successfully');
    console.log('  New columns:', result.map(r => r.column_name).join(', '));
    console.log('');

    console.log('[3/3] Next steps:');
    console.log('  1. Run: cd apps/backend && npx prisma generate');
    console.log('  2. Restart backend server');
    console.log('  3. Test the new endpoints\n');

    console.log('========================================');
    console.log('Migration Complete! ✅');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
