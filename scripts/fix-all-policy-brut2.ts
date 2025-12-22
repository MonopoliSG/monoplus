import { Pool } from 'pg';

async function fixAllPolicyBrutValues() {
  const pool = new Pool({ connectionString: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  
  // Fix: Divide brut by 10 for policies where brut > 5000 and ends in 0
  const result = await pool.query(`
    UPDATE customers 
    SET brut = brut / 10
    WHERE brut > 5000
      AND MOD(brut::integer, 10) = 0
    RETURNING id
  `);
  
  console.log(`Fixed ${result.rowCount} policies`);
  
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

fixAllPolicyBrutValues().catch(console.error);
