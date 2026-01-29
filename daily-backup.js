#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const MAX_BACKUPS = 30; // Keep 30 days of backups
const BACKUP_RETENTION_DAYS = 30;

// Create backup directory
const backupDir = path.join(__dirname, 'daily-backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// Generate backup filename with date
const today = new Date();
const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
const backupFilename = `daily-backup-${dateString}`;
const backupPath = path.join(backupDir, backupFilename);

// Skip if backup for today already exists
if (fs.existsSync(backupPath)) {
  console.log(`✅ Backup for ${dateString} already exists. Skipping...`);
  process.exit(0);
}

console.log(`🔄 Starting daily backup for ${dateString}...`);

const mongoUri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB || 'convenience_store';

if (!mongoUri) {
  console.error('❌ MONGO_URI not found in environment variables');
  process.exit(1);
}

const dumpCommand = `mongodump --uri="${mongoUri}" --db="${dbName}" --out="${backupPath}"`;

exec(dumpCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Daily backup failed: ${error.message}`);
    // You could add email notification here
    process.exit(1);
  }

  console.log(`✅ Daily backup completed: ${backupFilename}`);
  
  // Cleanup old backups
  cleanupOldBackups();
  
  // Optional: Add to git for version control
  addToGitIfRequested();
});

function cleanupOldBackups() {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - BACKUP_RETENTION_DAYS);
    
    const backups = fs.readdirSync(backupDir)
      .filter(name => name.startsWith('daily-backup-'))
      .filter(name => {
        const backupPath = path.join(backupDir, name);
        const stats = fs.statSync(backupPath);
        return stats.mtime < cutoffDate;
      });

    backups.forEach(backup => {
      const backupPath = path.join(backupDir, backup);
      fs.rmSync(backupPath, { recursive: true, force: true });
      console.log(`🗑️  Removed old backup: ${backup}`);
    });
    
    if (backups.length > 0) {
      console.log(`🧹 Cleaned up ${backups.length} old backup(s)`);
    }
  } catch (error) {
    console.log(`⚠️  Cleanup warning: ${error.message}`);
  }
}

function addToGitIfRequested() {
  // Uncomment the lines below if you want to commit backups to git
  // WARNING: Only do this for small databases, as git isn't ideal for large binary files
  
  /*
  exec('git add daily-backups/ && git commit -m "Daily database backup"', (error) => {
    if (!error) {
      console.log('📝 Backup committed to git');
    }
  });
  */
}