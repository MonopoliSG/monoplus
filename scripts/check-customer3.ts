import { Pool } from 'pg';

async function checkCustomer() {
  const pool = new Pool({ connectionString: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const profileId = '79926f10-6670-41e9-be12-a807d9436f12';
  
  const policies = await pool.query(`
    SELECT police_no, brans_adi, brut_prim, net_prim, durum 
    FROM customers 
    WHERE profile_id = $1
  `, [profileId]);
  
  console.log('Policies for this profile:');
  let totalBrut = 0;
  policies.rows.forEach(p => {
    console.log(`${p.police_no} | ${p.brans_adi} | Brut: ${p.brut_prim} | Net: ${p.net_prim} | ${p.durum}`);
    if (p.durum === 'AKTIF') {
      totalBrut += parseFloat(p.brut_prim || '0');
    }
  });
  
  console.log(`\nTotal Brut from active policies: ${totalBrut}`);
  console.log(`Should be (÷10): ${totalBrut / 10}`);
  
  await pool.end();
}

checkCustomer().catch(console.error);
