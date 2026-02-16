const { MongoClient } = require("mongodb");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function compareJulyVsMarch() {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGO_DB);

    console.log("🔍 COMPARING JULY VS MARCH 2025 DATABASE STRUCTURE\n");

    // Get July transaction structure
    console.log("1️⃣ JULY TRANSACTION STRUCTURE (Working):");
    const julyTransaction = await db.collection("transactions").findOne({
      timestamp: { $gte: new Date("2025-07-01"), $lt: new Date("2025-08-01") },
    });

    if (julyTransaction) {
      console.log("Complete July Transaction:");
      console.log(JSON.stringify(julyTransaction, null, 2));
    }

    console.log("\n" + "=".repeat(80) + "\n");

    // Get March transaction structure
    console.log("2️⃣ MARCH 2025 TRANSACTION STRUCTURE (Problematic):");
    const marchTransaction = await db.collection("transactions").findOne({
      timestamp: { $gte: new Date(2025, 2, 1), $lt: new Date(2025, 3, 1) },
    });

    if (marchTransaction) {
      console.log("Complete March Transaction:");
      console.log(JSON.stringify(marchTransaction, null, 2));
    }

    console.log("\n" + "=".repeat(80) + "\n");

    // Compare field differences
    console.log("3️⃣ FIELD DIFFERENCES:");

    if (julyTransaction && marchTransaction) {
      const julyFields = Object.keys(julyTransaction);
      const marchFields = Object.keys(marchTransaction);

      const missingInMarch = julyFields.filter(
        (field) => !marchFields.includes(field),
      );
      const extraInMarch = marchFields.filter(
        (field) => !julyFields.includes(field),
      );

      console.log(`Missing in March: ${missingInMarch.join(", ") || "None"}`);
      console.log(`Extra in March: ${extraInMarch.join(", ") || "None"}`);

      // Check field value differences
      console.log("\n4️⃣ FIELD VALUE TYPE DIFFERENCES:");
      julyFields.forEach((field) => {
        if (marchFields.includes(field)) {
          const julyValue = julyTransaction[field];
          const marchValue = marchTransaction[field];

          if (typeof julyValue !== typeof marchValue) {
            console.log(
              `   ${field}: July=${typeof julyValue}, March=${typeof marchValue}`,
            );
          }
        }
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

compareJulyVsMarch();
