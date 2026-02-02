#!/usr/bin/env node

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
require("dotenv").config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  const backupDir = path.join(__dirname, "backups");

  if (!fs.existsSync(backupDir)) {
    console.error(
      "❌ No backups directory found. Run backup-mongodb.js first.",
    );
    process.exit(1);
  }

  // List available backups by date
  const dates = fs
    .readdirSync(backupDir)
    .filter((name) => name.match(/^\d{4}-\d{2}-\d{2}$/))
    .sort()
    .reverse();

  if (dates.length === 0) {
    console.error("❌ No backup dates found in the backups directory.");
    process.exit(1);
  }

  // Build list of all backups with date context
  const allBackups = [];
  dates.forEach((date) => {
    const datePath = path.join(backupDir, date);
    const backupsInDate = fs
      .readdirSync(datePath)
      .filter((name) => name.startsWith("backup-"))
      .sort()
      .reverse();

    backupsInDate.forEach((backup) => {
      const backupPath = path.join(datePath, backup);
      const stats = fs.statSync(backupPath);
      const timeStr = backup.replace("backup-", "").replace(/-/g, ":");
      allBackups.push({
        displayName: `${date} at ${timeStr}`,
        fullPath: backupPath,
        date: date,
        time: timeStr,
        modified: stats.mtime,
      });
    });
  });

  if (allBackups.length === 0) {
    console.error("❌ No backups found in any date directories.");
    process.exit(1);
  }

  console.log("📂 Available backups:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  allBackups.forEach((backup, index) => {
    console.log(`${index + 1}. 📅 ${backup.displayName}`);
  });
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Get user choice
  const choice = await askQuestion(
    '\n🔢 Enter backup number to restore (or "q" to quit): ',
  );

  if (choice.toLowerCase() === "q") {
    console.log("👋 Restore cancelled.");
    rl.close();
    return;
  }

  const backupIndex = parseInt(choice) - 1;
  if (
    isNaN(backupIndex) ||
    backupIndex < 0 ||
    backupIndex >= allBackups.length
  ) {
    console.error("❌ Invalid backup number.");
    rl.close();
    return;
  }

  const selectedBackup = allBackups[backupIndex];
  const backupPath = selectedBackup.fullPath;

  // Confirm restore
  const confirm = await askQuestion(
    `⚠️  This will REPLACE your current database with backup from:\n📅 ${selectedBackup.displayName}\n\nAre you sure? (type "CONFIRM" to proceed): `,
  );

  if (confirm !== "CONFIRM") {
    console.log("👋 Restore cancelled.");
    rl.close();
    return;
  }

  // MongoDB connection details
  const mongoUri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB || "convenience_store";

  if (!mongoUri) {
    console.error("❌ MONGO_URI not found in environment variables");
    rl.close();
    return;
  }

  console.log(`🔄 Restoring database from ${selectedBackup.displayName}...`);

  // Create mongorestore command (drop existing data first)
  const restoreCommand = `mongorestore --uri="${mongoUri}" --db="${dbName}" --drop "${path.join(backupPath, dbName)}"`;

  exec(restoreCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Restore failed: ${error.message}`);
      rl.close();
      return;
    }

    if (stderr) {
      console.log(`⚠️  Warning: ${stderr}`);
    }

    console.log("✅ Database restore completed successfully!");
    console.log(`📂 Restored from: ${selectedBackup.displayName}`);
    console.log(`⏰ Restore completed at: ${new Date().toLocaleString()}`);

    rl.close();
  });
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

main().catch(console.error);
