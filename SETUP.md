# POS System Setup Guide

## Project Migration from SQLite to MongoDB

This document outlines the steps taken to migrate the POS system from SQLite to MongoDB Atlas and set up the development environment.

### 1. Remove SQLite Dependencies
- Removed `better-sqlite3` from `package.json`
- Removed SQLite database configuration file (`server/db.js`)
- Removed SQLite to MongoDB migration script
- Cleaned up SQLite data directory

### 2. MongoDB Setup

#### 2.1 Local Development Setup (Optional)
```bash
# Install MongoDB Community Edition
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community
```

#### 2.2 MongoDB Atlas Configuration
1. Create `.env` file in the project root with the following configuration:
```env
MONGO_URI=mongodb+srv://harmeet24singh_db_user:rgVNeaq2SgztJDv4@cluster0.a2m0kky.mongodb.net/convenience_store
MONGO_DB=convenience_store
```

### 3. Project Dependencies
```bash
# Install project dependencies
npm install
```

### 4. Starting the Development Server
```bash
# Start the development server
npm run dev
```

The application will be available at:
- Main application: http://localhost:3000
- POS interface: http://localhost:3000/pos
- Inventory management: http://localhost:3000/inventory

### 5. Available API Endpoints
- Inventory: `/api/inventory`
- Users: `/api/users`
- Transactions: `/api/transaction`
- Categories: `/api/categories`

### 6. Security Recommendations
1. Ensure your IP address is whitelisted in MongoDB Atlas
2. Keep environment variables secure and never commit them to version control
3. Set up regular database backups
4. Use different database users for development and production

### 7. Troubleshooting
If you encounter connection issues:
1. Verify MongoDB Atlas connection string
2. Check if your IP is whitelisted in MongoDB Atlas
3. Ensure all environment variables are properly set
4. Check MongoDB Atlas cluster status

### 8. Development Tools Used
- Next.js 14.2.0
- MongoDB Atlas
- Node.js
- React 18

### 9. Important Notes
- The project now uses MongoDB exclusively; all SQLite code has been removed
- MongoDB Atlas is used for the database
- Environment variables must be properly configured before starting the application
- Make sure to run `npm install` after cloning the repository

### 10. Future Maintenance
1. Regularly update dependencies using `npm update`
2. Monitor MongoDB Atlas metrics
3. Keep environment variables updated
4. Backup database regularly

For any issues or questions, refer to:
1. [Next.js Documentation](https://nextjs.org/docs)
2. [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
3. [Project Repository](https://github.com/Harmeet24Singh/gptPOS)