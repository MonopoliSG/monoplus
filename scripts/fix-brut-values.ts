import { Pool } from 'pg';

async function fixBrutValues() {
  const pool = new Pool({ connectionString: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  
  // Find profiles where brut is roughly 10x the net (indicating ×10 error)
  // Normal commission would be 10-30%, so brut should be at most 1.5x net
  // If brut is > 5x net, it's likely a ×10 error
  const suspiciousProfiles = await pool.query(`
    SELECT id, musteri_ismi, toplam_brut_prim, toplam_net_prim,
           CAST(toplam_brut_prim AS NUMERIC) / NULLIF(CAST(toplam_net_prim AS NUMERIC), 0) as ratio
    FROM customer_profiles 
    WHERE CAST(toplam_brut_prim AS NUMERIC) > 0 
      AND CAST(toplam_net_prim AS NUMERIC) > 0
      AND CAST(toplam_brut_prim AS NUMERIC) / CAST(toplam_net_prim AS NUMERIC) > 5
  `);
  
  console.log(`Found ${suspiciousProfiles.rows.length} profiles with suspicious brut/net ratio (>5x):`);
  
  let fixedCount = 0;
  for (const p of suspiciousProfiles.rows) {
    const oldBrut = parseFloat(p.toplam_brut_prim);
    const newBrut = oldBrut / 10;
    const net = parseFloat(p.toplam_net_prim);
    
    // Only fix if new brut would be reasonable (close to net or slightly higher)
    if (newBrut >= net * 0.8 && newBrut <= net * 1.5) {
      console.log(`FIX: ${p.musteri_ismi} | Brut: ${oldBrut} -> ${newBrut} | Net: ${net}`);
      
      await pool.query(`
        UPDATE customer_profiles 
        SET toplam_brut_prim = $1
        WHERE id = $2
      `, [newBrut.toFixed(2), p.id]);
      
      fixedCount++;
    } else {
      console.log(`SKIP: ${p.musteri_ismi} | Brut: ${oldBrut} | Net: ${net} | Ratio: ${p.ratio}`);
    }
  }
  
  console.log(`\nFixed ${fixedCount} profiles`);
  
  // Check the specific customer
  const check = await pool.query(`
    SELECT id, musteri_ismi, toplam_brut_prim, toplam_net_prim 
    FROM customer_profiles 
    WHERE id = '79926f10-6670-41e9-be12-a807d9436f12'
  `);
  console.log('\nAfter fix - YEŞİM ERALP:', check.rows[0]);
  
  await pool.end();
}

fixBrutValues().catch(console.error);
