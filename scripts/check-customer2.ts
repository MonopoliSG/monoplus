import { db } from '../server/db';
import { customers } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function checkCustomer() {
  const profileId = '79926f10-6670-41e9-be12-a807d9436f12';
  
  // Get policies - select all columns
  const policies = await db.select()
    .from(customers)
    .where(eq(customers.profileId, profileId));
  
  console.log('Policies for this profile:');
  policies.forEach(p => {
    console.log(`${p.policeNo} | ${p.bransAdi} | Brut: ${p.brutPrim} | Net: ${p.netPrim} | ${p.durum}`);
  });
  
  // Calculate sum
  const activePolicies = policies.filter(p => p.durum === 'AKTIF');
  const totalBrut = activePolicies.reduce((sum, p) => sum + parseFloat(p.brutPrim || '0'), 0);
  console.log(`\nTotal Brut from active policies: ${totalBrut}`);
  console.log(`Expected (divided by 10): ${totalBrut / 10}`);
}

checkCustomer().catch(console.error);
