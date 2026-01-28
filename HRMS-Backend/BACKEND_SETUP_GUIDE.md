# HRMS Backend Setup Guide

Complete guide to set up the HRMS backend locally and connect to the production database using SSH tunneling.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [SSH Tunnel Setup](#ssh-tunnel-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Connection](#database-connection)
5. [Running the Backend](#running-the-backend)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- **Node.js** (v14 or higher) installed
- **npm** (comes with Node.js)
- **SSH access** to the production server (`kloud@172.31.31.254`)
- **MongoDB Compass** (optional, but recommended for database inspection)
- **Git** (to clone/pull the repository)

---

## SSH Tunnel Setup

The production database is not directly accessible from your local machine. You need to create an SSH tunnel to forward the MongoDB port.

### Step 1: Create SSH Tunnel

Open a **terminal** (keep this running throughout your development session):

```bash
ssh -L 27018:localhost:27017 kloud@172.31.31.254
```

**What this does:**
- `-L 27018:localhost:27017` - Creates a local port forward
  - `27018` = Local port on your machine
  - `localhost:27017` = Remote MongoDB on the production server
- `kloud@172.31.31.254` = SSH credentials for the production server

**Important:**
- Keep this terminal session **open** while working
- If the connection drops, you'll need to reconnect
- The tunnel forwards `localhost:27018` on your machine → `localhost:27017` on the remote server

### Step 2: Verify Tunnel is Active

In a **new terminal** (while the SSH tunnel is running), test the connection:

```bash
mongosh "mongodb://localhost:27018"
```

You should see:
```
Using MongoDB: 8.0.14
Using Mongosh: 2.6.0
```

If you get `ECONNREFUSED`, the SSH tunnel is not active. Go back to Step 1.

---

## Environment Configuration

The backend uses environment-specific configuration files. You need to configure both `.env.development` and `.env.production` to point to the remote database.

### Step 1: Locate Environment Files

Navigate to the backend directory:

```bash
cd HRMS-Backend
```

You should have:
- `.env.development` - For development mode
- `.env.production` - For production mode
- `.env.example` - Template (reference only)

### Step 2: Configure Database Connection

Edit both `.env.development` and `.env.production` files:

**For `.env.development`:**

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
# Use SSH tunnel port 27018 to connect to remote database
MONGODB_URI=mongodb://localhost:27018/HRMS_system_vm_prod

# JWT Secret (CHANGE THIS TO A STRONG SECRET)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_use_random_string

# ZKTeco Device Configuration (if using biometric device)
ZKTECO_DEVICE_IP=192.168.1.100
ZKTECO_DEVICE_PORT=4370
ZKTECO_INPORT=5200

# Application Timezone
APP_TIMEZONE=Asia/Dhaka

# Email Configuration (optional, for password reset/invitations)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@hrms.com
```

**For `.env.production`:**

Use the same configuration as above, ensuring `MONGODB_URI` points to:

```env
MONGODB_URI=mongodb://localhost:27018/HRMS_system_vm_prod
```

**Key Points:**
- `localhost:27018` = Your local port (forwarded via SSH tunnel)
- `HRMS_system_vm_prod` = Production database name
- Alternative databases available: `HRMS_system_vm_dev`, `HRMS_system_vm_test`

### Step 3: Verify Environment Files

Check that your `MONGODB_URI` is correctly set:

```bash
# Check .env.development
grep MONGODB_URI .env.development

# Check .env.production
grep MONGODB_URI .env.production
```

Both should show: `MONGODB_URI=mongodb://localhost:27018/HRMS_system_vm_prod`

---

## Database Connection

### Available Databases

When connected via SSH tunnel, you can access:

- `HRMS_system_vm_prod` - **Production database** (recommended for development)
- `HRMS_system_vm_dev` - Development database
- `HRMS_system_vm_test` - Test database
- `HRMS_system_management` - Management database

### Verify Database Access

Using `mongosh` (with SSH tunnel active):

```bash
mongosh "mongodb://localhost:27018/HRMS_system_vm_prod"
```

Then run:

```js
// List all collections
show collections

// Count employees
db.employees.countDocuments()

// Count users
db.users.countDocuments()

// View a sample employee
db.employees.findOne()

// View a sample user
db.users.findOne()
```

### Login Credentials

**Super Admin Account:**
- Email: `superadmin@example.com`
- Password: `12345` (or as configured in production)

**Note:** If you need to reset the password, see [Troubleshooting](#troubleshooting) section.

---

## Running the Backend

### Step 1: Install Dependencies

```bash
cd HRMS-Backend
npm install
```

### Step 2: Create Required Directories

```bash
mkdir -p uploads
```

### Step 3: Start the Backend Server

**Development Mode (with auto-reload):**

```bash
npm run dev
```

**Production Mode:**

```bash
npm start
```

### Step 4: Verify Server is Running

You should see output like:

```
✅ MongoDB connected
Attempting to drop old conflicting indexes...
INFO: "employeeId_1" index not found on leaveentitlements. No action needed.
INFO: "companyId_1" index not found on leavepolicies. No action needed.
Finished checking/dropping old indexes.
Server running in production mode
API Documentation: http://localhost:5000/api-docs
Health Check:       http://localhost:5000
📅 Cron jobs scheduled successfully
```

### Step 5: Access API Documentation

Open your browser and visit:

- **Swagger UI**: `http://localhost:5000/api-docs`
- **Health Check**: `http://localhost:5000`

---

## Verification

### Test Database Connection

Create a test script to verify the connection:

```bash
cd HRMS-Backend
node <<'EOF'
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, `.env.${process.env.NODE_ENV || 'development'}`),
});
console.log('Using MONGODB_URI =', process.env.MONGODB_URI);

const mongoose = require('mongoose');
const User = require('./models/user');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to database');
  
  const user = await User.findOne({ email: 'superadmin@example.com' }).select('+password');
  console.log('User found:', !!user);
  if (user) {
    const ok = await user.comparePassword('12345');
    console.log('Password 12345 matches hash:', ok);
  }
  await mongoose.disconnect();
  process.exit(0);
})();
EOF
```

Expected output:
```
Using MONGODB_URI = mongodb://localhost:27018/HRMS_system_vm_prod
✅ Connected to database
User found: true
Password 12345 matches hash: true
```

### Test API Endpoint

Using `curl`:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"superadmin@example.com","password":"12345"}'
```

Expected response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "superadmin@example.com",
    "role": "Super Admin",
    ...
  }
}
```

---

## Troubleshooting

### Issue: "MongoDB connection failed"

**Symptoms:**
```
❌ MongoDB connection failed: Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"
```

**Solutions:**
1. Check that `MONGODB_URI` in your `.env` file starts with `mongodb://`
2. Verify there are no extra spaces or quotes around the URI
3. Ensure the SSH tunnel is active (see [SSH Tunnel Setup](#ssh-tunnel-setup))

### Issue: "ECONNREFUSED" when connecting

**Symptoms:**
```
MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27018
```

**Solutions:**
1. **SSH tunnel is not running** - Start it: `ssh -L 27018:localhost:27017 kloud@172.31.31.254`
2. **Tunnel dropped** - Reconnect the SSH tunnel
3. **Wrong port** - Verify you're using port `27018` (local) not `27017`

### Issue: "Invalid credentials" on login

**Symptoms:**
- Login returns `{"success": false, "error": "Invalid credentials"}`
- But you know the credentials are correct

**Solutions:**

1. **Verify user exists in database:**
   ```js
   // In mongosh
   db.users.findOne({ email: "superadmin@example.com" })
   ```

2. **Reset password hash:**
   ```bash
   # Generate new hash
   cd HRMS-Backend
   node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('12345', 10))"
   ```
   
   Then update in mongosh:
   ```js
   db.users.updateOne(
     { email: "superadmin@example.com" },
     { $set: { password: "<HASH_FROM_ABOVE>" } }
   )
   ```

3. **Check employee is active:**
   ```js
   // In mongosh
   const user = db.users.findOne({ email: "superadmin@example.com" });
   db.employees.findOne({ _id: user.employeeId, employeeStatus: 'active' })
   ```

### Issue: Backend connects to wrong database

**Symptoms:**
- Backend starts but shows empty data
- Different data than expected

**Solutions:**

1. **Check which environment file is being loaded:**
   - The backend loads `.env.${NODE_ENV || 'development'}`
   - If `NODE_ENV=production`, it loads `.env.production`
   - If `NODE_ENV` is unset, it loads `.env.development`

2. **Verify MONGODB_URI in both files:**
   ```bash
   grep MONGODB_URI .env.development .env.production
   ```

3. **Check backend startup logs:**
   - Look for: `[dotenv@...] injecting env from .env.xxx`
   - This shows which file was loaded

### Issue: SSH tunnel keeps disconnecting

**Solutions:**

1. **Use `-N` flag to prevent shell session:**
   ```bash
   ssh -N -L 27018:localhost:27017 kloud@172.31.31.254
   ```

2. **Use `autossh` for automatic reconnection:**
   ```bash
   # Install autossh
   sudo apt-get install autossh
   
   # Use autossh
   autossh -M 20000 -N -L 27018:localhost:27017 kloud@172.31.31.254
   ```

3. **Add SSH config for easier connection:**
   Edit `~/.ssh/config`:
   ```
   Host hrms-tunnel
       HostName 172.31.31.254
       User kloud
       LocalForward 27018 localhost:27017
   ```
   
   Then connect with: `ssh hrms-tunnel`

### Issue: ZKTeco device connection errors

**Symptoms:**
```
Error executing command: Error [ERR_SOCKET_CLOSED]: Socket is closed
❌ Log sync failed: Failed to connect to ZKTeco device
```

**Note:** These errors are **non-critical** if you're not using biometric devices. They occur because the cron job tries to sync with a device at `192.168.1.100` which may not be accessible.

**Solutions:**
- If not using ZKTeco devices, you can ignore these errors
- To disable, comment out the cron jobs in `services/cronJob.js`
- Or set `ZKTECO_DEVICE_IP` to an empty value

---

## Quick Reference

### Essential Commands

```bash
# 1. Start SSH tunnel (keep running)
ssh -L 27018:localhost:27017 kloud@172.31.31.254

# 2. In another terminal: Start backend
cd HRMS-Backend
npm run dev

# 3. Verify connection
mongosh "mongodb://localhost:27018/HRMS_system_vm_prod"
```

### Environment Variables Summary

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | Database connection string | `mongodb://localhost:27018/HRMS_system_vm_prod` |
| `JWT_SECRET` | Secret for JWT tokens | `your_super_secret_jwt_key...` |
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment mode | `production` or `development` |
| `APP_TIMEZONE` | Application timezone | `Asia/Dhaka` |

### Database Names

- `HRMS_system_vm_prod` - **Production** (use this for development)
- `HRMS_system_vm_dev` - Development
- `HRMS_system_vm_test` - Test
- `HRMS_system_management` - Management

---

## Next Steps

After successful setup:

1. ✅ Backend is running on `http://localhost:5000`
2. ✅ Connected to production database via SSH tunnel
3. ✅ Can authenticate with existing users
4. ✅ Ready to work on UI improvements
5. ✅ Ready to add new features

**Frontend Setup:**
- Ensure frontend `.env` has: `VITE_API_URL=http://localhost:5000`
- Start frontend: `cd HRMS-Frontend && npm run dev`

---

## Support

If you encounter issues not covered in this guide:

1. Check backend terminal logs for error messages
2. Verify SSH tunnel is active: `mongosh "mongodb://localhost:27018"`
3. Check which `.env` file is being loaded (see startup logs)
4. Verify database name matches: `HRMS_system_vm_prod`

---

**Last Updated:** January 28, 2026  
**Setup Verified:** ✅ Working with SSH tunnel to production database
