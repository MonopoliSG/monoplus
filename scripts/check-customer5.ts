import { Pool } from 'pg';

async function checkCustomer() {
  const pool = new Pool({ connectionString: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const profileId = '79926f10-6670-41e9-be12-a807d9436f12';
  
  // Get all columns
  const cols = await pool.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'customers' AND (column_name LIKE '%durum%' OR column_name LIKE '%status%' OR column_name LIKE '%aktif%')
  `);
  console.log('Status columns:', cols.rows.map(r => r.column_name));
  
  // Get policies
  const policies = await pool.query(`
    SELECT id, brans_adi, eski_police_brut_prim, eski_police_net_prim, police_kayit_tipi 
    FROM customers 
    WHERE profile_id = $1
  `, [profileId]);
  
  console.log('\nPolicies for this profile:');
  let totalBrut = 0;
  policies.rows.forEach(p => {
    console.log(`${p.brans_adi} | Brut: ${p.eski_police_brut_prim} | Kayit: ${p.police_kayit_tipi}`);
    if (p.police_kayit_tipi === 'AKTIF' || !p.police_kayit_tipi) {
      totalBrut += parseFloat(p.eski_police_brut_prim || '0');
    }
  });
  
  console.log(`\nTotal Brut: ${totalBrut}`);
  
  await pool.end();
}

checkCustomer().catch(console.error);
