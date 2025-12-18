const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function importData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const sqlDir = path.join(__dirname, '../sql_parts');
  const files = fs.readdirSync(sqlDir).filter(f => f.endsWith('.sql')).sort();

  console.log(`Found ${files.length} SQL files`);

  let totalImported = 0;
  let errors = 0;

  for (const file of files) {
    const filePath = path.join(sqlDir, file);
    let sql = fs.readFileSync(filePath, 'utf-8');
    
    // Parse and execute the SQL properly
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(sql);
      await client.query('COMMIT');
      const rowCount = result.rowCount || 0;
      totalImported += rowCount;
      console.log(`✓ ${file}: ${rowCount} records`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`✗ ${file}: ${err.message.slice(0, 100)}`);
      
      // Log position in SQL for debugging first error
      if (errors === 0) {
        const posMatch = err.message.match(/position (\d+)/);
        if (posMatch) {
          const pos = parseInt(posMatch[1]);
          console.error(`   Near: "${sql.slice(pos - 30, pos + 30)}"`);
        }
      }
      errors++;
    } finally {
      client.release();
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total: ${totalImported} records`);
  console.log(`Errors: ${errors}`);

  await pool.end();
}

importData().catch(console.error);
