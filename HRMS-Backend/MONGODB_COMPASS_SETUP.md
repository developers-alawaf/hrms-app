# MongoDB Compass Setup Guide

## Do You Need MongoDB Compass?

**Short answer: No, it's optional but highly recommended for development.**

MongoDB Compass is a **GUI (Graphical User Interface)** tool for MongoDB. Your backend will work perfectly fine without it, but it makes development much easier.

### Without Compass:
- ✅ Backend works fine
- ✅ You can use MongoDB shell (`mongosh`) for database operations
- ❌ Harder to visualize data
- ❌ Requires command-line knowledge

### With Compass:
- ✅ Visual database browser
- ✅ Easy data viewing and editing
- ✅ Query builder (no need to write MongoDB queries manually)
- ✅ Index management
- ✅ Performance monitoring
- ✅ Schema analysis

**Recommendation:** Install it if you're doing development work. It's free and makes debugging much easier.

---

## Installation

### Option 1: Download from Official Website (Recommended)

1. **Download MongoDB Compass:**
   - Visit: https://www.mongodb.com/try/download/compass
   - Choose your operating system (Windows, macOS, or Linux)
   - Download the installer

2. **Install:**
   - **Windows:** Run the `.exe` installer
   - **macOS:** Open the `.dmg` file and drag to Applications
   - **Linux:** Extract the `.tar.gz` file and run the executable

### Option 2: Install via Package Manager

#### Ubuntu/Debian (WSL2):
```bash
# Download the .deb package
wget https://downloads.mongodb.com/compass/mongodb-compass_1.44.0_amd64.deb

# Install
sudo dpkg -i mongodb-compass_1.44.0_amd64.deb

# Fix any dependency issues
sudo apt-get install -f
```

#### macOS (Homebrew):
```bash
brew install --cask mongodb-compass
```

#### Windows (Chocolatey):
```bash
choco install mongodb-compass
```

---

## Connecting to Your MongoDB

### For Local MongoDB (Default Setup)

1. **Open MongoDB Compass**

2. **Connection String:**
   ```
   mongodb://localhost:27017
   ```
   
   Or if you want to connect to a specific database:
   ```
   mongodb://localhost:27017/hrms
   ```

3. **Click "Connect"**

That's it! You should now see your databases.

### For MongoDB Atlas (Cloud)

1. **Get your connection string from MongoDB Atlas:**
   - Log in to [MongoDB Atlas](https://cloud.mongodb.com/)
   - Go to your cluster
   - Click "Connect"
   - Choose "Connect using MongoDB Compass"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

2. **In Compass:**
   - Paste the connection string
   - Replace `<password>` with your actual password
   - Click "Connect"

### Using Your Backend's Connection String

If you've already set up your `.env` file, you can use the same `MONGODB_URI`:

1. Open your `.env` file
2. Copy the `MONGODB_URI` value
3. Paste it into Compass connection field
4. Click "Connect"

**Example:**
```
mongodb://localhost:27017/hrms
```

---

## First Steps After Connecting

1. **View Databases:**
   - You'll see a list of databases on the left sidebar
   - Look for `hrms` (or whatever database name you configured)

2. **Explore Collections:**
   - Click on your database
   - You'll see collections (tables) like:
     - `users`
     - `employees`
     - `companies`
     - `leaveentitlements`
     - etc.

3. **View Documents:**
   - Click on any collection to see the data
   - You can filter, sort, and edit documents

---

## Common Use Cases

### 1. View User Data
- Navigate to `hrms` → `users` collection
- See all registered users

### 2. Check Employee Records
- Navigate to `hrms` → `employees` collection
- View employee information

### 3. Debug Database Issues
- Check if data is being saved correctly
- Verify relationships between documents
- Inspect document structure

### 4. Manual Data Entry (Development)
- Add test data directly
- Edit existing records
- Delete test data

### 5. Run Queries
- Use the query builder (no coding needed)
- Filter documents
- Sort and limit results

---

## Troubleshooting

### Can't Connect to Local MongoDB

**Check if MongoDB is running:**
```bash
# Linux/WSL2
sudo systemctl status mongod

# Start if not running
sudo systemctl start mongod

# macOS
brew services list | grep mongodb

# Windows
# Check Services (services.msc) for MongoDB
```

**Verify connection string:**
- Default: `mongodb://localhost:27017`
- Make sure port 27017 is not blocked

### Connection Timeout

- Check firewall settings
- Verify MongoDB is accessible
- For remote connections, ensure IP is whitelisted (MongoDB Atlas)

### Authentication Required

If your MongoDB requires authentication:
```
mongodb://username:password@localhost:27017/hrms
```

---

## Alternative: MongoDB Shell (mongosh)

If you prefer command-line or don't want to install Compass:

```bash
# Connect to local MongoDB
mongosh

# Or connect to specific database
mongosh mongodb://localhost:27017/hrms

# List databases
show dbs

# Use a database
use hrms

# List collections
show collections

# Query documents
db.users.find()
db.employees.find().pretty()
```

---

## Summary

- **MongoDB Compass is optional** - your backend works without it
- **Highly recommended for development** - makes database management easier
- **Free to download** from MongoDB website
- **Easy to connect** - just use your `MONGODB_URI` from `.env`
- **Great for debugging** - visualize data, run queries, manage indexes

If you're just getting started, I'd recommend installing it. It will save you a lot of time during development!
