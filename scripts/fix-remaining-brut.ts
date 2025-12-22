import { Pool } from 'pg';

async function fixRemainingBrut() {
  const pool = new Pool({ connectionString: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  
  // Find all policies with brut > 10000 - these are likely 10x errors
  // Normal car insurance (trafik/kasko) is typically 1000-5000 TL range
  const highBrut = await pool.query(`
    SELECT id, musteri_ismi, brans_adi, brut
    FROM customers 
    WHERE brut > 10000
    ORDER BY brut DESC
    LIMIT 50
  `);
  
  console.log(`Found ${highBrut.rows.length} policies with brut > 10000:`);
  highBrut.rows.slice(0, 20).forEach(p => {
    console.log(`${p.musteri_ismi} | ${p.brans_adi} | brut: ${p.brut} -> ${parseFloat(p.brut)/10}`);
  });
  
  // Fix all policies with brut > 10000 by dividing by 10
  const result = await pool.query(`
    UPDATE customers 
    SET brut = brut / 10
    WHERE brut > 10000
    RETURNING id
  `);
  
  console.log(`\nFixed ${result.rowCount} policies with brut > 10000`);
  
  // Verify the specific customer
  const verify = await pool.query(`
    SELECT c.id, c.musteri_ismi, c.brans_adi, c.brut
    FROM customers c
    JOIN customer_profiles cp ON c.hesap_kodu = cp.hesap_kodu
    WHERE cp.id = '79926f10-6670-41e9-be12-a807d9436f12'
  `);
  
  console.log('\nAfter fix - YEŞİM ERALP policies:');
  verify.rows.forEach(p => {
    console.log(`${p.brans_adi} | brut: ${p.brut}`);
  });
  
  await pool.end();
}

fixRemainingBrut().catch(console.error);
