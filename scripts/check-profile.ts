import { Pool } from 'pg';

async function checkProfile() {
  const pool = new Pool({ connectionString: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const profileId = '79926f10-6670-41e9-be12-a807d9436f12';
  
  // Get profile
  const profile = await pool.query(`
    SELECT id, musteri_ismi, toplam_brut_prim, toplam_net_prim, aktif_police, toplam_police 
    FROM customer_profiles 
    WHERE id = $1
  `, [profileId]);
  
  console.log('Profile:', profile.rows[0]);
  
  // Check if there are problematic values - values that are 10x too high
  // For example, values ending in 0 that when divided by 10 look reasonable
  const suspicious = await pool.query(`
    SELECT id, musteri_ismi, toplam_brut_prim, toplam_net_prim
    FROM customer_profiles 
    WHERE CAST(toplam_brut_prim AS NUMERIC) > 50000
    LIMIT 20
  `);
  
  console.log('\nProfiles with high brut (>50000):');
  suspicious.rows.forEach(p => {
    console.log(`${p.musteri_ismi} | Brut: ${p.toplam_brut_prim} | Net: ${p.toplam_net_prim} | ÷10: ${parseFloat(p.toplam_brut_prim)/10}`);
  });
  
  await pool.end();
}

checkProfile().catch(console.error);
