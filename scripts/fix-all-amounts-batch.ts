import { db } from "../server/db";
import { customers, customerProfiles } from "../shared/schema";
import { eq, sql } from "drizzle-orm";

async function fixAllAmounts() {
  console.log("Starting batch fix...");
  
  // Fix all policies with brut > 100000 in one SQL update (divide by 100)
  await db.execute(sql`
    UPDATE customers 
    SET brut = brut / 100,
        net = net / 100
    WHERE brut > 100000
  `);
  console.log("Fixed high brut policies");

  // Also fix policies with net > 100000 that weren't caught
  await db.execute(sql`
    UPDATE customers 
    SET net = net / 100
    WHERE net > 100000
  `);
  console.log("Fixed high net policies");
  
  // Update all customer profile totals
  console.log("Updating profile totals...");
  const profiles = await db.select({ id: customerProfiles.id, hesapKodu: customerProfiles.hesapKodu }).from(customerProfiles);
  
  let count = 0;
  for (const profile of profiles) {
    if (!profile.hesapKodu) continue;
    
    const totals = await db.select({
      totalBrut: sql<string>`COALESCE(SUM(brut), 0)`,
      totalNet: sql<string>`COALESCE(SUM(net), 0)`
    }).from(customers).where(eq(customers.hesapKodu, profile.hesapKodu));
    
    await db.update(customerProfiles).set({
      toplamBrutPrim: String(totals[0].totalBrut || "0"),
      toplamNetPrim: String(totals[0].totalNet || "0")
    }).where(eq(customerProfiles.id, profile.id));
    
    count++;
    if (count % 100 === 0) console.log(`Updated ${count} profiles...`);
  }
  
  console.log(`Updated ${profiles.length} profiles. Done!`);
}

fixAllAmounts().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
