import { Pool } from 'pg';

async function fixPolicyBrutValues() {
  const pool = new Pool({ connectionString: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  
  // First, let me understand the policy structure - find policies for this customer
  const policies = await pool.query(`
    SELECT c.id, c.hesap_kodu, c.musteri_ismi, c.brans_adi, c.brut, c.eski_police_brut_prim, c.eski_police_net_prim
    FROM customers c
    JOIN customer_profiles cp ON c.hesap_kodu = cp.hesap_kodu
    WHERE cp.id = '79926f10-6670-41e9-be12-a807d9436f12'
  `);
  
  console.log('Policies for YEŞİM ERALP:');
  policies.rows.forEach(p => {
    console.log(`${p.brans_adi} | brut: ${p.brut} | eski_brut: ${p.eski_police_brut_prim} | eski_net: ${p.eski_police_net_prim}`);
  });
  
  await pool.end();
}

fixPolicyBrutValues().catch(console.error);
