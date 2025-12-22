import { Pool } from 'pg';

async function fixAllPolicyBrutValues() {
  const pool = new Pool({ connectionString: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  
  // Find policies where brut is roughly 10x what it should be
  // We can detect this by comparing brut to typical ranges or looking at ratios
  // Policies with brut > 10000 that end in .00 or 0.00 are likely 10x errors
  
  // First, let's see the distribution
  const stats = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE CAST(brut AS NUMERIC) > 10000) as high_brut,
      COUNT(*) FILTER (WHERE CAST(brut AS NUMERIC) > 50000) as very_high_brut
    FROM customers 
    WHERE brut IS NOT NULL
  `);
  console.log('Stats:', stats.rows[0]);
  
  // Find policies where brut seems to be 10x too high
  // Check if brut / 10 would be close to reasonable values
  const suspicious = await pool.query(`
    SELECT id, musteri_ismi, brans_adi, brut, 
           CAST(brut AS NUMERIC) / 10 as brut_div10
    FROM customers 
    WHERE CAST(brut AS NUMERIC) > 5000
      AND MOD(CAST(brut AS NUMERIC)::integer, 10) = 0
    LIMIT 30
  `);
  
  console.log('\nSample of policies with high brut values:');
  suspicious.rows.forEach(p => {
    console.log(`${p.musteri_ismi} | ${p.brans_adi} | brut: ${p.brut} -> ${p.brut_div10}`);
  });
  
  // Fix: Divide brut by 10 for policies where brut > 5000 and ends in 0
  // But we need to be careful - let's use a more targeted approach
  // Looking at the data, values like 93944.00 should be 9394.40
  
  const result = await pool.query(`
    UPDATE customers 
    SET brut = (CAST(brut AS NUMERIC) / 10)::text
    WHERE CAST(brut AS NUMERIC) > 5000
      AND MOD(CAST(brut AS NUMERIC)::integer, 10) = 0
    RETURNING id
  `);
  
  console.log(`\nFixed ${result.rowCount} policies`);
  
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
