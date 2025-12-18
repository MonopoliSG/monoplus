const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function importData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const sqlDir = path.join(__dirname, '../sql_parts');
  const files = fs.readdirSync(sqlDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} SQL files to import`);

  let totalImported = 0;
  let errors = 0;

  for (const file of files) {
    const filePath = path.join(sqlDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    
    try {
      const result = await pool.query(sql);
      const rowCount = result.rowCount || 0;
      totalImported += rowCount;
      console.log(`✓ ${file}: ${rowCount} records imported`);
    } catch (err) {
      console.error(`✗ ${file}: Error - ${err.message}`);
      errors++;
    }
  }

  console.log('\n=== Import Summary ===');
  console.log(`Total records imported: ${totalImported}`);
  console.log(`Files with errors: ${errors}`);

  await pool.end();
}

importData().catch(console.error);
