import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('========================================');
  console.log('Adding Walk-in Booking Columns');
  console.log('========================================\n');

  const columns = [
    { name: 'actual_start_at', type: 'TIMESTAMP' },
    { name: 'actual_end_at', type: 'TIMESTAMP' },
    { name: 'is_walk_in', type: 'BOOLEAN DEFAULT FALSE' },
    { name: 'estimated_duration_hours', type: 'INTEGER' },
    { name: 'walk_in_notes', type: 'TEXT' },
  ];

  for (const col of columns) {
    try {
      console.log(`Adding column: ${col.name}...`);
      await prisma.$executeRawUnsafe(
        `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`
      );
      console.log(`✓ ${col.name} added`);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log(`⚠️  ${col.name} already exists - skipping`);
      } else {
        console.error(`❌ Failed to add ${col.name}:`, error.message);
      }
    }
  }

  console.log('\nAdding indexes...');
  
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_bookings_actual_start_at ON bookings(actual_start_at)',
    'CREATE INDEX IF NOT EXISTS idx_bookings_actual_end_at ON bookings(actual_end_at)',
    'CREATE INDEX IF NOT EXISTS idx_bookings_is_walk_in ON bookings(is_walk_in)',
    'CREATE INDEX IF NOT EXISTS idx_bookings_status_start_at ON bookings(status, start_at)',
  ];

  for (const idx of indexes) {
    try {
      await prisma.$executeRawUnsafe(idx);
      console.log('✓ Index added');
    } catch (error: any) {
      console.log('⚠️  Index already exists - skipping');
    }
  }

  console.log('\nVerifying columns...');
  const result: any = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'bookings' 
    AND column_name IN ('actual_start_at', 'actual_end_at', 'is_walk_in', 'estimated_duration_hours', 'walk_in_notes')
    ORDER BY column_name
  `;

  console.log('✓ Columns verified:');
  result.forEach((r: any) => {
    console.log(`  - ${r.column_name} (${r.data_type})`);
  });

  console.log('\n========================================');
  console.log('Migration Complete! ✅');
  console.log('========================================\n');
  console.log('Next steps:');
  console.log('  1. Restart backend: npm run dev');
  console.log('  2. Test at: http://localhost:5173/quick-checkin\n');

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
