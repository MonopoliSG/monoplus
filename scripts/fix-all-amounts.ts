import { db } from "../server/db";
import { customers, customerProfiles } from "../shared/schema";
import { eq, gt, sql } from "drizzle-orm";

async function fixAllAmounts() {
  console.log("Starting batch fix for all customer policy amounts...");
  
  // Find all policies with brut > 100000 (likely wrong - need to divide by 100)
  const wrongPolicies = await db.select({
    id: customers.id,
    hesapKodu: customers.hesapKodu,
    policeNumarasi: customers.policeNumarasi,
    anaBrans: customers.anaBrans,
    brut: customers.brut,
    net: customers.net
  }).from(customers)
    .where(gt(sql`CAST(${customers.brut} AS DECIMAL)`, 100000));
  
  console.log(`Found ${wrongPolicies.length} policies with brut > 100,000 TL (likely need correction)`);
  
  let fixedCount = 0;
  const affectedHesapKodlari = new Set<string>();
  
  for (const policy of wrongPolicies) {
    const currentBrut = parseFloat(policy.brut || "0");
    const currentNet = parseFloat(policy.net || "0");
    
    // Divide by 100 to get correct values
    const newBrut = (currentBrut / 100).toFixed(2);
    const newNet = (currentNet / 100).toFixed(2);
    
    console.log(`Fixing policy ${policy.policeNumarasi} (${policy.anaBrans}):`);
    console.log(`  Brut: ${currentBrut} -> ${newBrut}`);
    console.log(`  Net: ${currentNet} -> ${newNet}`);
    
    await db.update(customers)
      .set({ brut: newBrut, net: newNet })
      .where(eq(customers.id, policy.id));
    
    fixedCount++;
    if (policy.hesapKodu) {
      affectedHesapKodlari.add(policy.hesapKodu);
    }
  }
  
  console.log(`\nFixed ${fixedCount} policies`);
  console.log(`Affected ${affectedHesapKodlari.size} unique customers`);
  
  // Now update all customer profile totals
  console.log("\nUpdating customer profile totals...");
  
  const allProfiles = await db.select().from(customerProfiles);
  let profilesUpdated = 0;
  
  for (const profile of allProfiles) {
    if (!profile.hesapKodu) continue;
    
    // Recalculate totals from policies
    const totalsResult = await db.select({
      totalBrut: sql<string>`COALESCE(SUM(CAST(${customers.brut} AS DECIMAL(15,2))), 0)`,
      totalNet: sql<string>`COALESCE(SUM(CAST(${customers.net} AS DECIMAL(15,2))), 0)`
    }).from(customers)
      .where(eq(customers.hesapKodu, profile.hesapKodu));
    
    const totals = totalsResult[0];
    
    await db.update(customerProfiles)
      .set({
        toplamBrutPrim: totals.totalBrut || "0",
        toplamNetPrim: totals.totalNet || "0"
      })
      .where(eq(customerProfiles.id, profile.id));
    
    profilesUpdated++;
  }
  
  console.log(`Updated ${profilesUpdated} customer profiles`);
  console.log("Done!");
}

fixAllAmounts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
