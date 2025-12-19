const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function fixPaymentAmounts() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("transactions");

    // Get ALL July transactions
    const julyTransactions = await collection.find({
      timestamp: {
        $gte: new Date("2025-07-01T00:00:00.000Z"),
        $lt: new Date("2025-08-01T00:00:00.000Z"),
      }
    }).toArray();

    console.log(`\n📋 Found ${julyTransactions.length} July transactions to fix payment amounts`);

    let updateCount = 0;
    let totalUnpaidBefore = 0;
    let problematicCount = 0;

    for (const transaction of julyTransactions) {
      let needsUpdate = false;
      let newPaymentBreakdown = [...transaction.paymentBreakdown];
      let newCashAmount = transaction.cashAmount;
      let newCardAmount = transaction.cardAmount;

      // Calculate current payment total
      const currentPaymentTotal = transaction.paymentBreakdown.reduce((sum, p) => sum + p.amount, 0);
      const difference = transaction.total - currentPaymentTotal;

      if (Math.abs(difference) > 0.01) { // If difference is more than 1 cent
        problematicCount++;
        totalUnpaidBefore += Math.max(0, difference);
        
        if (transaction.paymentMethod === "cash") {
          // Cash transaction - set payment amount to transaction total
          newPaymentBreakdown = [{ method: "cash", amount: transaction.total }];
          newCashAmount = transaction.total;
          newCardAmount = 0;
          needsUpdate = true;
          
        } else if (transaction.paymentMethod === "card") {
          // Card transaction - set payment amount to transaction total
          newPaymentBreakdown = [{ method: "card", amount: transaction.total }];
          newCashAmount = 0;
          newCardAmount = transaction.total;
          needsUpdate = true;
          
        } else if (transaction.paymentMethod === "mixed") {
          // Mixed transaction - keep the payment distribution but scale to match total
          const cashPayment = newPaymentBreakdown.find(p => p.method === "cash");
          const cardPayment = newPaymentBreakdown.find(p => p.method === "card");
          
          if (cashPayment && cardPayment) {
            // Maintain the ratio but scale to match transaction total
            const totalCurrentPayments = cashPayment.amount + cardPayment.amount;
            const cashRatio = cashPayment.amount / totalCurrentPayments;
            const cardRatio = cardPayment.amount / totalCurrentPayments;
            
            const newCashPayment = Math.round(transaction.total * cashRatio * 100) / 100;
            const newCardPayment = Math.round((transaction.total - newCashPayment) * 100) / 100;
            
            newPaymentBreakdown = [
              { method: "cash", amount: newCashPayment },
              { method: "card", amount: newCardPayment }
            ];
            newCashAmount = newCashPayment;
            newCardAmount = newCardPayment;
            needsUpdate = true;
          }
        }
      }

      if (needsUpdate) {
        const updateResult = await collection.updateOne(
          { _id: transaction._id },
          {
            $set: {
              paymentBreakdown: newPaymentBreakdown,
              cashAmount: newCashAmount,
              cardAmount: newCardAmount
            }
          }
        );

        if (updateResult.modifiedCount > 0) {
          updateCount++;
          if (updateCount % 50 === 0) {
            console.log(`Fixed ${updateCount} transactions...`);
          }
        }
      }
    }

    console.log(`\n✅ Successfully fixed payment amounts for ${updateCount} transactions`);
    console.log(`📊 Problematic transactions found: ${problematicCount}`);
    console.log(`💰 Total unpaid amount before fix: $${totalUnpaidBefore.toFixed(2)}`);
    
    // Verify the fix
    console.log(`\n🔍 Verifying fix with sample transactions:`);
    const verifyTransactions = await collection.find({
      timestamp: {
        $gte: new Date("2025-07-01T00:00:00.000Z"),
        $lt: new Date("2025-08-01T00:00:00.000Z"),
      }
    }).limit(5).toArray();

    verifyTransactions.forEach((t, idx) => {
      const paymentTotal = t.paymentBreakdown.reduce((sum, p) => sum + p.amount, 0);
      const difference = t.total - paymentTotal;
      console.log(`${idx + 1}. ${t.transactionId}: Total=$${t.total}, Paid=$${paymentTotal.toFixed(2)}, Diff=$${difference.toFixed(2)}`);
    });

    // Calculate new unpaid amount
    const allTransactions = await collection.find({
      timestamp: {
        $gte: new Date("2025-07-01T00:00:00.000Z"),
        $lt: new Date("2025-08-01T00:00:00.000Z"),
      }
    }).toArray();

    let newUnpaid = 0;
    allTransactions.forEach(transaction => {
      const totalPaid = transaction.paymentBreakdown.reduce((sum, payment) => sum + payment.amount, 0);
      const unpaidAmount = transaction.total - totalPaid;
      if (unpaidAmount > 0.01) {
        newUnpaid += unpaidAmount;
      }
    });

    console.log(`\n💰 New unpaid amount after fix: $${newUnpaid.toFixed(2)}`);

  } catch (error) {
    console.error("Error fixing payment amounts:", error);
  } finally {
    await client.close();
    console.log("\nConnection closed");
  }
}

fixPaymentAmounts();