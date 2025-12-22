import { Pool } from 'pg';

async function checkCustomer() {
  const pool = new Pool({ connectionString: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const profileId = '79926f10-6670-41e9-be12-a807d9436f12';
  
  // First get column names
  const cols = await pool.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'customers' AND (column_name LIKE '%brut%' OR column_name LIKE '%prim%' OR column_name LIKE '%police%' OR column_name LIKE '%brans%')
  `);
  console.log('Columns:', cols.rows.map(r => r.column_name));
  
  const policies = await pool.query(`
    SELECT id, brans_adi, eski_police_brut_prim, eski_police_net_prim, durum 
    FROM customers 
    WHERE profile_id = $1
  `, [profileId]);
  
  console.log('\nPolicies for this profile:');
  let totalBrut = 0;
  policies.rows.forEach(p => {
    console.log(`${p.brans_adi} | Brut: ${p.eski_police_brut_prim} | Net: ${p.eski_police_net_prim} | ${p.durum}`);
    if (p.durum === 'AKTIF') {
      totalBrut += parseFloat(p.eski_police_brut_prim || '0');
    }
  });
  
  console.log(`\nTotal Brut from active policies: ${totalBrut}`);
  console.log(`Should be (÷10): ${totalBrut / 10}`);
  
  await pool.end();
}

checkCustomer().catch(console.error);
