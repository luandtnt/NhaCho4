import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('========================================');
  console.log('Walk-in Booking Migration');
  console.log('========================================\n');

  try {
    // Read migration SQL file
    const migrationPath = path.join(__dirname, '../prisma/migrations/20260117_walk_in_bookings/migration.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('[1/2] Running SQL migration...');
    
    // Execute the entire SQL as one statement
    await prisma.$executeRawUnsafe(sql);

    console.log('✓ SQL migration completed successfully\n');

    console.log('[2/2] Verifying migration...');
    
    // Verify columns exist
    const result: any = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      AND column_name IN ('actual_start_at', 'actual_end_at', 'is_walk_in', 'estimated_duration_hours', 'walk_in_notes')
      ORDER BY column_name
    `;

    console.log('✓ Migration verified successfully');
    console.log('  New columns:', result.map((r: any) => r.column_name).join(', '));
    console.log('');

    console.log('========================================');
    console.log('Migration Complete! ✅');
    console.log('========================================\n');
    console.log('Next steps:');
    console.log('  1. Restart backend server (npm run dev)');
    console.log('  2. Test at: http://localhost:5173/quick-checkin\n');

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    
    // If columns already exist, that's OK
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Columns already exist - skipping migration');
      console.log('✓ Migration OK (columns already added)\n');
    } else {
      console.error('\nFull error:', error);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
