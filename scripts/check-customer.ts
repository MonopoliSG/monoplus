import { db } from '../server/db';
import { customers, customerProfiles } from '../shared/schema';
import { eq, and, sum, count } from 'drizzle-orm';

async function checkCustomer() {
  const profileId = '79926f10-6670-41e9-be12-a807d9436f12';
  
  // Get profile
  const profile = await db.select().from(customerProfiles).where(eq(customerProfiles.id, profileId)).limit(1);
  console.log('Profile:', JSON.stringify(profile[0], null, 2));
  
  // Get policies
  const policies = await db.select({
    id: customers.id,
    policeNo: customers.policeNo,
    bransAdi: customers.bransAdi,
    brutPrim: customers.brutPrim,
    netPrim: customers.netPrim,
    durum: customers.durum
  })
  .from(customers)
  .where(eq(customers.profileId, profileId));
  
  console.log('\nPolicies:');
  policies.forEach(p => console.log(`${p.policeNo} | ${p.bransAdi} | Brut: ${p.brutPrim} | Net: ${p.netPrim} | ${p.durum}`));
  
  // Calculate sum
  const activePolicies = policies.filter(p => p.durum === 'AKTIF');
  const totalBrut = activePolicies.reduce((sum, p) => sum + parseFloat(p.brutPrim || '0'), 0);
  console.log(`\nTotal Brut from active policies: ${totalBrut}`);
  console.log(`Profile shows: ${profile[0]?.totalPremium}`);
}

checkCustomer().catch(console.error);
