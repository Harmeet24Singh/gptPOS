const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB connection from environment
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "convenience_store";

async function shuffleByDayOfWeek() {
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
    }).sort({ transactionId: 1 }).toArray();

    console.log(`\n📋 Found ${julyTransactions.length} July transactions to redistribute by day patterns`);

    // Define weekly business patterns (percentage of weekly volume per day)
    const dayPatterns = {
      1: 0.10, // Monday - slow (10%)
      2: 0.16, // Tuesday - good (16%) 
      3: 0.16, // Wednesday - good (16%)
      4: 0.12, // Thursday - slow (12%)
      5: 0.18, // Friday - good (18%)
      6: 0.20, // Saturday - best (20%)
      0: 0.08  // Sunday - slowest (8%)
    };

    // Get all days in July 2025
    const julyDays = [];
    for (let day = 1; day <= 31; day++) {
      const date = new Date(2025, 6, day); // Month 6 = July (0-indexed)
      const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, etc.
      julyDays.push({
        date: date,
        dayOfWeek: dayOfWeek,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
        multiplier: dayPatterns[dayOfWeek],
        transactions: []
      });
    }

    console.log(`\n📅 July 2025 day patterns:`);
    const weekSummary = {};
    julyDays.forEach(day => {
      const expectedTransactions = Math.round(julyTransactions.length * day.multiplier / 31 * 7); // Weekly pattern applied
      day.expectedTransactions = expectedTransactions;
      
      if (!weekSummary[day.dayName]) {
        weekSummary[day.dayName] = { count: 0, total: 0 };
      }
      weekSummary[day.dayName].count++;
      weekSummary[day.dayName].total += expectedTransactions;
      
      console.log(`${day.date.toDateString()}: ${expectedTransactions} transactions (${day.dayName})`);
    });

    console.log(`\n📊 Weekly pattern summary:`);
    Object.entries(weekSummary).forEach(([dayName, data]) => {
      const avg = Math.round(data.total / data.count);
      const percentage = (data.total / julyTransactions.length * 100).toFixed(1);
      console.log(`${dayName}: ${avg} avg/day, ${data.total} total (${percentage}%)`);
    });

    // Distribute transactions across days based on patterns
    let transactionIndex = 0;
    
    for (const day of julyDays) {
      const transactionsForDay = day.expectedTransactions;
      
      for (let i = 0; i < transactionsForDay && transactionIndex < julyTransactions.length; i++) {
        const transaction = julyTransactions[transactionIndex];
        
        // Calculate random time during business hours (6 AM to 11 PM)
        const businessStart = 6; // 6 AM
        const businessEnd = 23;   // 11 PM
        const businessHours = businessEnd - businessStart;
        
        // Create time distribution throughout the day with peak hours
        let hourMultiplier;
        const randomHour = businessStart + Math.random() * businessHours;
        
        // Peak hours: 7-9 AM, 12-2 PM, 5-8 PM
        if ((randomHour >= 7 && randomHour <= 9) || 
            (randomHour >= 12 && randomHour <= 14) || 
            (randomHour >= 17 && randomHour <= 20)) {
          hourMultiplier = 0.7 + Math.random() * 0.3; // Peak: 70-100% 
        } else {
          hourMultiplier = 0.3 + Math.random() * 0.4; // Off-peak: 30-70%
        }
        
        const finalHour = Math.floor(businessStart + hourMultiplier * businessHours);
        const minutes = Math.floor(Math.random() * 60);
        const seconds = Math.floor(Math.random() * 60);
        
        // Set new timestamp for the transaction
        const newTimestamp = new Date(day.date);
        newTimestamp.setHours(finalHour, minutes, seconds, Math.floor(Math.random() * 1000));
        
        day.transactions.push({
          ...transaction,
          newTimestamp: newTimestamp
        });
        
        transactionIndex++;
      }
    }

    console.log(`\n🔄 Redistributing ${transactionIndex} transactions across July with realistic day patterns...`);

    // Update transactions with new timestamps
    let updateCount = 0;
    
    for (const day of julyDays) {
      for (const transactionData of day.transactions) {
        const updateResult = await collection.updateOne(
          { _id: transactionData._id },
          {
            $set: {
              timestamp: transactionData.newTimestamp
            }
          }
        );

        if (updateResult.modifiedCount > 0) {
          updateCount++;
          if (updateCount % 50 === 0) {
            console.log(`Updated ${updateCount}/${transactionIndex} transactions...`);
          }
        }
      }
    }

    console.log(`\n✅ Successfully redistributed ${updateCount} transactions with realistic weekly patterns`);

    // Verify the distribution
    console.log(`\n🔍 Verification - transactions per day of week:`);
    const verificationStats = await collection.aggregate([
      {
        $match: {
          timestamp: {
            $gte: new Date("2025-07-01T00:00:00.000Z"),
            $lt: new Date("2025-08-01T00:00:00.000Z"),
          }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: "$timestamp" },
          count: { $sum: 1 },
          totalAmount: { $sum: "$total" }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]).toArray();

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    verificationStats.forEach(stat => {
      const dayName = dayNames[stat._id - 1]; // MongoDB dayOfWeek is 1-indexed
      const percentage = (stat.count / julyTransactions.length * 100).toFixed(1);
      console.log(`${dayName}: ${stat.count} transactions (${percentage}%) - $${stat.totalAmount.toFixed(2)}`);
    });

  } catch (error) {
    console.error("Error shuffling by day of week:", error);
  } finally {
    await client.close();
    console.log("\nConnection closed");
  }
}

shuffleByDayOfWeek();