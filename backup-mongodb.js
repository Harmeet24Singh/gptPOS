#!/usr/bin/env node

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Create backup directory if it doesn't exist
const backupDir = path.join(__dirname, "backups");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// Generate date-based backup structure
const now = new Date();
const dateString = now.toISOString().split("T")[0]; // YYYY-MM-DD format
const timeString = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-MM-SS format
const dateDirPath = path.join(backupDir, dateString);

// Create date directory if it doesn't exist
if (!fs.existsSync(dateDirPath)) {
  fs.mkdirSync(dateDirPath);
}

const backupFilename = `backup-${timeString}`;
const backupPath = path.join(dateDirPath, backupFilename);

console.log("🔄 Starting MongoDB backup...");
console.log(`📁 Backup will be saved to: ${backupPath}`);

// MongoDB connection details from .env
const mongoUri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB || "convenience_store";

if (!mongoUri) {
  console.error("❌ MONGO_URI not found in environment variables");
  process.exit(1);
}

// Create mongodump command
const dumpCommand = `mongodump --uri="${mongoUri}" --db="${dbName}" --out="${backupPath}"`;

// Execute backup
exec(dumpCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Backup failed: ${error.message}`);
    return;
  }

  if (stderr) {
    console.log(`⚠️  Warning: ${stderr}`);
  }

  console.log("✅ Backup completed successfully!");
  console.log(`📂 Backup location: ${backupPath}`);
  console.log(`📅 Date: ${dateString}`);
  console.log(`⏰ Time: ${timeString.replace(/-/g, ":")}`);

  // Show backup size
  try {
    const stats = fs.statSync(path.join(backupPath, dbName));
    console.log(`💾 Backup completed at: ${new Date().toLocaleString()}`);
  } catch (e) {
    // Ignore size check error
  }

  // Keep only last 10 backups per day (optional cleanup)
  cleanupOldBackups(dateDirPath);

  // Show total backups summary
  showBackupSummary(backupDir);
});

function cleanupOldBackups(dateDirPath) {
  try {
    const backups = fs
      .readdirSync(dateDirPath)
      .filter((name) => name.startsWith("backup-"))
      .map((name) => ({
        name,
        time: fs.statSync(path.join(dateDirPath, name)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    // Keep only the 10 most recent backups per day
    if (backups.length > 10) {
      const toDelete = backups.slice(10);
      toDelete.forEach((backup) => {
        const backupPath = path.join(dateDirPath, backup.name);
        fs.rmSync(backupPath, { recursive: true, force: true });
        console.log(`🗑️  Cleaned up old backup: ${backup.name}`);
      });
    }
  } catch (error) {
    console.log(`⚠️  Cleanup warning: ${error.message}`);
  }
}

function showBackupSummary(backupDir) {
  try {
    const dates = fs
      .readdirSync(backupDir)
      .filter((name) => name.match(/^\d{4}-\d{2}-\d{2}$/))
      .sort()
      .reverse();

    console.log(`\n📊 Backup Summary:`);
    console.log(`📁 Total backup dates: ${dates.length}`);

    dates.slice(0, 5).forEach((date) => {
      const datePath = path.join(backupDir, date);
      const backupCount = fs
        .readdirSync(datePath)
        .filter((name) => name.startsWith("backup-")).length;
      console.log(
        `   ${date}: ${backupCount} backup${backupCount !== 1 ? "s" : ""}`,
      );
    });

    if (dates.length > 5) {
      console.log(`   ... and ${dates.length - 5} more dates`);
    }
  } catch (error) {
    console.log(`⚠️  Summary warning: ${error.message}`);
  }
}
