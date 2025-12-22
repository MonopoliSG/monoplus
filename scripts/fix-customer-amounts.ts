import { db } from "../server/db";
import { customers, customerProfiles } from "../shared/schema";
import { eq, sql } from "drizzle-orm";

async function fixCustomerAmounts() {
  const hesapKodu = "22064163576";
  
  console.log("Fetching policies for hesap_kodu:", hesapKodu);
  
  // Get current values
  const currentPolicies = await db.select({
    id: customers.id,
    policeNumarasi: customers.policeNumarasi,
    anaBrans: customers.anaBrans,
    brut: customers.brut,
    net: customers.net
  }).from(customers).where(eq(customers.hesapKodu, hesapKodu));
  
  console.log("Current policies:", JSON.stringify(currentPolicies, null, 2));
  
  // Fix the values - divide by 100
  for (const policy of currentPolicies) {
    const currentBrut = parseFloat(policy.brut || "0");
    const currentNet = parseFloat(policy.net || "0");
    
    // Only fix if values are too large (> 100000)
    if (currentBrut > 100000 || currentNet > 100000) {
      const newBrut = (currentBrut / 100).toFixed(2);
      const newNet = (currentNet / 100).toFixed(2);
      
      console.log(`Fixing policy ${policy.id}:`);
      console.log(`  Brut: ${currentBrut} -> ${newBrut}`);
      console.log(`  Net: ${currentNet} -> ${newNet}`);
      
      await db.update(customers)
        .set({ brut: newBrut, net: newNet })
        .where(eq(customers.id, policy.id));
    }
  }
  
  // Update customer profile totals
  const profileId = "4aa69a38-dbe2-463c-a04b-052b3a046a48";
  
  // Recalculate totals from policies
  const totalsResult = await db.select({
    totalBrut: sql<string>`SUM(CAST(${customers.brut} AS DECIMAL(15,2)))`,
    totalNet: sql<string>`SUM(CAST(${customers.net} AS DECIMAL(15,2)))`
  }).from(customers)
    .where(eq(customers.hesapKodu, hesapKodu));
  
  const totals = totalsResult[0];
  console.log("New totals:", totals);
  
  // Update customer profile
  await db.update(customerProfiles)
    .set({
      toplamBrutPrim: totals.totalBrut || "0",
      toplamNetPrim: totals.totalNet || "0"
    })
    .where(eq(customerProfiles.id, profileId));
  
  console.log("Profile updated!");
  
  // Verify
  const updatedPolicies = await db.select({
    id: customers.id,
    policeNumarasi: customers.policeNumarasi,
    anaBrans: customers.anaBrans,
    brut: customers.brut,
    net: customers.net
  }).from(customers).where(eq(customers.hesapKodu, hesapKodu));
  
  console.log("Updated policies:", JSON.stringify(updatedPolicies, null, 2));
}

fixCustomerAmounts()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
