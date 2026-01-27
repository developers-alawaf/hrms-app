# HRMS VM Setup & Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the HRMS application on a Ubuntu VM, accessible via SSH from both Ubuntu and Windows (Putty/PowerShell).

**Server Information**:
- **IP Address**: 172.31.31.254
- **Username**: kloud
- **Password**: kloud@2025
- **Secondary IP**: 172.31.31.234

---

## Prerequisites

### Required Software

- **SSH Client**:
  - Ubuntu: Built-in SSH client
  - Windows: Putty or PowerShell (Windows 10+)
- **File Transfer**:
  - Ubuntu: `scp` or `rsync`
  - Windows: WinSCP, FileZilla, or PowerShell `scp`

### Access Requirements

- SSH access to the server
- Sudo/root privileges on the server
- Git repository access (or prepared deployment files)

---

## Part 1: Connecting to the Server

### Ubuntu/Linux Connection

1. **Open Terminal**

2. **Connect via SSH**
   ```bash
   ssh kloud@172.31.31.254
   ```

3. **Enter Password**
   ```
   Password: kloud@2025
   ```

4. **Verify Connection**
   ```bash
   whoami
   pwd
   ```

### Windows Connection (Putty)

1. **Download Putty**
   - Download from: https://www.putty.org/
   - Or use Windows Store version

2. **Configure Putty**
   - **Host Name**: `172.31.31.254`
   - **Port**: `22`
   - **Connection Type**: SSH
   - **Saved Sessions**: Save as "HRMS Server"

3. **Connect**
   - Click "Open"
   - Accept host key (if first time)
   - Enter username: `kloud`
   - Enter password: `kloud@2025`

4. **Verify Connection**
   ```bash
   whoami
   pwd
   ```

### Windows Connection (PowerShell)

1. **Open PowerShell**
   - Press `Win + X` and select "Windows PowerShell" or "Terminal"

2. **Connect via SSH**
   ```powershell
   ssh kloud@172.31.31.254
   ```

3. **Enter Password**
   ```
   Password: kloud@2025
   ```

4. **Verify Connection**
   ```bash
   whoami
   pwd
   ```

---

## Part 2: Initial Server Setup (Ubuntu)

### Step 1: Update System

```bash
sudo apt update
sudo apt upgrade -yroot      242562  0.0  0.0   3528   896 pts/4    S+  
```

### Step 2: Install Essential Tools

```bash
sudo apt install -y \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    ufw \
    nginx \
    certbot \
    python3-certbot-nginx
```

### Step 3: Install Node.js (v18 LTS)

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

**Expected Output**:
```
v18.x.x
9.x.x
```

### Step 4: Install MongoDB

**Option A: MongoDB Community Edition (Local)**

```bash
# Import MongoDB GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list
sudo apt update

# Install MongoDB
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

**Option B: MongoDB Atlas (Cloud - Recommended)**

If using MongoDB Atlas, skip MongoDB installation and use connection string from Atlas dashboard.

### Step 5: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Verify installation
pm2 --version
```

### Step 6: Configure Firewall

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Allow Backend API (if direct access needed)
sudo ufw allow 5000/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Part 3: Backend Deployment

### Step 1: Create Application Directory

```bash
# Create directory structure
sudo mkdir -p /var/www/hrms
sudo chown -R kloud:kloud /var/www/hrms
cd /var/www/hrms
```

### Step 2: Clone or Upload Backend Code

**Option A: Git Clone**

```bash
git clone <your-repository-url> .
# Or clone to specific directory
git clone <your-repository-url> /var/www/hrms/backend
```

**Option B: Upload Files (Windows - WinSCP/PowerShell)**

**Using PowerShell (from Windows)**:
```powershell
# Navigate to your local Backend directory
cd D:\Projects\HRMS\Backend

# Upload files
scp -r * kloud@172.31.31.254:/var/www/hrms/backend/
```

**Using WinSCP**:
1. Open WinSCP
2. Connect to `172.31.31.254` with credentials
3. Navigate to `/var/www/hrms/`
4. Create `backend` folder
5. Upload all Backend files

**Option C: Upload Files (Ubuntu - SCP)**

```bash
# From your local machine
scp -r /path/to/Backend/* kloud@172.31.31.254:/var/www/hrms/backend/
```

### Step 3: Navigate to Backend Directory

```bash
cd /var/www/hrms/backend
# Or if cloned directly
cd /var/www/hrms/Backend
```

### Step 4: Install Backend Dependencies

```bash
npm install --production
```

### Step 5: Create Environment File

```bash
nano .env.production
```

**Add the following content**:

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
# For Local MongoDB:
MONGODB_URI=mongodb://localhost:27017/hrms

# For MongoDB Atlas (replace with your connection string):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hrms?retryWrites=true&w=majority

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

**Save and Exit**:
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

**Generate Strong JWT Secret**:
```bash
# Generate random secret
openssl rand -base64 32
# Copy the output and use it as JWT_SECRET
```

### Step 6: Create Uploads Directory

```bash
mkdir -p uploads/passportSizePhoto
mkdir -p uploads/appointmentLetter
mkdir -p uploads/resume
mkdir -p uploads/nidCopy
mkdir -p uploads/document
mkdir -p logs
```

### Step 7: Test Backend

```bash
# Test if server starts
npm start

# If successful, stop with Ctrl+C
```

### Step 8: Start with PM2

```bash
# Start application
pm2 start server.js --name hrms-backend --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions shown (usually run a sudo command)

# Check status
pm2 status

# View logs
pm2 logs hrms-backend

# Monitor
pm2 monit
```

**PM2 Commands**:
```bash
# Restart
pm2 restart hrms-backend

# Stop
pm2 stop hrms-backend

# Delete
pm2 delete hrms-backend

# Reload (zero-downtime)
pm2 reload hrms-backend

# View logs
pm2 logs hrms-backend --lines 100

# Clear logs
pm2 flush
```

### Step 9: Verify Backend is Running

```bash
# Check if port 5000 is listening
sudo netstat -tlnp | grep 5000

# Or using ss
sudo ss -tlnp | grep 5000

# Test API
curl http://localhost:5000/
```

**Expected Response**:
```json
{"message":"HRMS API Running","uptime":123.45,"timestamp":"2025-01-XX..."}
```

---

## Part 4: Frontend Deployment

### Step 1: Navigate to Frontend Directory

```bash
cd /var/www/hrms
```

### Step 2: Clone or Upload Frontend Code

**Option A: Git Clone**

```bash
git clone <your-repository-url> frontend
cd frontend
```

**Option B: Upload Files (Windows - PowerShell)**

```powershell
# From Windows PowerShell
cd D:\Projects\HRMS\Frontend
scp -r * kloud@172.31.31.254:/var/www/hrms/frontend/
```

**Option C: Upload Files (Ubuntu - SCP)**

```bash
# From your local machine
scp -r /path/to/Frontend/* kloud@172.31.31.254:/var/www/hrms/frontend/
```

### Step 3: Install Frontend Dependencies

```bash
cd /var/www/hrms/frontend
npm install
```

### Step 4: Create Environment File

```bash
nano .env.production
```

**Add the following content**:

```env
VITE_API_URL=http://172.31.31.254:5000
# Or if using domain:
# VITE_API_URL=https://api.yourdomain.com
```

**Save and Exit**: `Ctrl + X`, `Y`, `Enter`

### Step 5: Build Frontend

```bash
npm run build
```

**Expected Output**:
```
✓ built in X.XXs
```

### Step 6: Verify Build Output

```bash
ls -la dist/
```

You should see:
- `index.html`
- `assets/` directory

### Step 7: Set Permissions

```bash
sudo chown -R www-data:www-data /var/www/hrms/frontend/dist
```

---

## Part 5: Nginx Configuration

### Step 1: Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/hrms
```

**Add the following configuration**:

```nginx
# Frontend Configuration
server {
    listen 80;
    server_name 172.31.31.254;  # Replace with your domain if available
    
    root /var/www/hrms/frontend/dist;
    index index.html;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Serve uploaded files
    location /uploads {
        alias /var/www/hrms/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
```

**Save and Exit**: `Ctrl + X`, `Y`, `Enter`

### Step 2: Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/hrms /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t
```

**Expected Output**:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Step 3: Restart Nginx

```bash
sudo systemctl restart nginx
sudo systemctl status nginx
```

### Step 4: Verify Nginx is Running

```bash
# Check if port 80 is listening
sudo netstat -tlnp | grep 80

# Test frontend
curl http://172.31.31.254/
```

---

## Part 6: SSL Certificate Setup (Optional but Recommended)

### Step 1: Install Certbot (Already installed in Step 2)

```bash
# Verify certbot is installed
certbot --version
```

### Step 2: Obtain SSL Certificate

**If you have a domain name**:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Follow the prompts**:
- Enter email address
- Agree to terms
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

**If you don't have a domain**:
- Skip SSL setup for now
- Access via HTTP: `http://172.31.31.254`
- Consider using a free domain service or configure later

### Step 3: Auto-Renewal

Certbot automatically sets up renewal. Verify:

```bash
# Test renewal
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl status certbot.timer
```

---

## Part 7: Final Verification

### Step 1: Check All Services

```bash
# Check PM2
pm2 status

# Check Nginx
sudo systemctl status nginx

# Check MongoDB (if local)
sudo systemctl status mongod

# Check Backend API
curl http://localhost:5000/

# Check Frontend
curl http://localhost/
```

### Step 2: Test from Browser

1. **Open browser**
2. **Navigate to**: `http://172.31.31.254`
3. **Verify**:
   - Frontend loads
   - Can access login page
   - API calls work (check browser console)

### Step 3: Test API Endpoints

```bash
# Health check
curl http://172.31.31.254/api/

# Test with authentication (replace token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://172.31.31.254/api/employees
```

---

## Part 8: Maintenance & Monitoring

### Viewing Logs

**Backend Logs (PM2)**:
```bash
pm2 logs hrms-backend
pm2 logs hrms-backend --lines 100
```

**Nginx Logs**:
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

**MongoDB Logs** (if local):
```bash
sudo tail -f /var/log/mongodb/mongod.log
```

### Updating Application

**Backend Update**:
```bash
cd /var/www/hrms/backend

# Pull latest changes (if using git)
git pull origin main

# Or upload new files
# Then:
npm install --production
pm2 restart hrms-backend
```

**Frontend Update**:
```bash
cd /var/www/hrms/frontend

# Pull latest changes (if using git)
git pull origin main

# Or upload new files
# Then:
npm install
npm run build
# Nginx will automatically serve new build
```

### Backup Database

**MongoDB Backup (Local)**:
```bash
# Create backup
mongodump --out /backup/hrms-$(date +%Y%m%d)

# Restore backup
mongorestore /backup/hrms-20250101
```

**MongoDB Atlas**: Use Atlas backup features in dashboard

### Monitoring Resources

```bash
# CPU and Memory
htop
# Or
top

# Disk usage
df -h

# PM2 monitoring
pm2 monit
```

---

## Part 9: Troubleshooting

### Backend Not Starting

```bash
# Check PM2 logs
pm2 logs hrms-backend

# Check if port is in use
sudo lsof -i :5000

# Check environment variables
cd /var/www/hrms/backend
cat .env.production

# Test manually
node server.js
```

### Frontend Not Loading

```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify files exist
ls -la /var/www/hrms/frontend/dist/

# Check permissions
ls -la /var/www/hrms/frontend/dist/
```

### API Not Responding

```bash
# Check backend is running
pm2 status

# Check backend logs
pm2 logs hrms-backend

# Test backend directly
curl http://localhost:5000/

# Check Nginx proxy configuration
sudo nginx -t
```

### Database Connection Issues

```bash
# Check MongoDB status (if local)
sudo systemctl status mongod

# Test MongoDB connection
mongosh

# Check connection string in .env
cat /var/www/hrms/backend/.env.production | grep MONGODB_URI
```

### Permission Issues

```bash
# Fix uploads directory permissions
sudo chown -R kloud:kloud /var/www/hrms/backend/uploads
sudo chmod -R 755 /var/www/hrms/backend/uploads

# Fix frontend permissions
sudo chown -R www-data:www-data /var/www/hrms/frontend/dist
sudo chmod -R 755 /var/www/hrms/frontend/dist
```

---

## Part 10: Windows-Specific Instructions

### Using Putty for File Transfer

1. **Download WinSCP** (recommended for file transfer)
   - Download from: https://winscp.net/

2. **Configure WinSCP**
   - **Host name**: `172.31.31.254`
   - **Port**: `22`
   - **User name**: `kloud`
   - **Password**: `kloud@2025`
   - **Protocol**: SFTP

3. **Upload Files**
   - Left panel: Local files
   - Right panel: Remote server
   - Navigate to `/var/www/hrms/`
   - Drag and drop files

### Using PowerShell for File Transfer

```powershell
# Upload single file
scp D:\Projects\HRMS\Backend\server.js kloud@172.31.31.254:/var/www/hrms/backend/

# Upload directory
scp -r D:\Projects\HRMS\Backend\* kloud@172.31.31.254:/var/www/hrms/backend/

# Download file
scp kloud@172.31.31.254:/var/www/hrms/backend/.env.production D:\Downloads\
```

### Using PowerShell for Remote Commands

```powershell
# Execute single command
ssh kloud@172.31.31.254 "pm2 status"

# Execute multiple commands
ssh kloud@172.31.31.254 "cd /var/www/hrms/backend && pm2 restart hrms-backend"
```

---

## Part 11: Security Hardening

### 1. Change Default SSH Port (Optional)

```bash
sudo nano /etc/ssh/sshd_config
# Change: Port 22 to Port 2222
sudo systemctl restart sshd
```

### 2. Disable Root Login

```bash
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

### 3. Setup SSH Key Authentication

**On Windows (PowerShell)**:
```powershell
# Generate SSH key
ssh-keygen -t rsa -b 4096

# Copy public key to server
type $env:USERPROFILE\.ssh\id_rsa.pub | ssh kloud@172.31.31.254 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

**On Ubuntu**:
```bash
# Generate SSH key
ssh-keygen -t rsa -b 4096

# Copy public key to server
ssh-copy-id kloud@172.31.31.254
```

### 4. Enable Fail2Ban

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 5. Regular Updates

```bash
# Setup automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Part 12: Quick Reference Commands

### Service Management

```bash
# PM2
pm2 start server.js --name hrms-backend
pm2 restart hrms-backend
pm2 stop hrms-backend
pm2 logs hrms-backend
pm2 status

# Nginx
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl status nginx
sudo nginx -t

# MongoDB (if local)
sudo systemctl start mongod
sudo systemctl stop mongod
sudo systemctl restart mongod
sudo systemctl status mongod
```

### File Operations

```bash
# View file
cat filename
less filename
nano filename

# Edit file
nano filename
vim filename

# Copy file
cp source destination

# Move file
mv source destination

# Delete file
rm filename
rm -r directory
```

### Network

```bash
# Check listening ports
sudo netstat -tlnp
sudo ss -tlnp

# Test connectivity
ping 8.8.8.8
curl http://localhost:5000
```

---

## Part 13: Deployment Checklist

### Pre-Deployment

- [ ] Server accessible via SSH
- [ ] Node.js installed (v18+)
- [ ] MongoDB installed or Atlas connection string ready
- [ ] PM2 installed
- [ ] Nginx installed
- [ ] Firewall configured
- [ ] Domain name configured (if using SSL)

### Backend Deployment

- [ ] Backend code uploaded/cloned
- [ ] Dependencies installed (`npm install --production`)
- [ ] `.env.production` file created with correct values
- [ ] Uploads directories created
- [ ] Backend starts successfully
- [ ] PM2 process running
- [ ] API accessible at `http://localhost:5000`

### Frontend Deployment

- [ ] Frontend code uploaded/cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.production` file created with API URL
- [ ] Frontend built successfully (`npm run build`)
- [ ] Build output in `dist/` directory
- [ ] Permissions set correctly

### Nginx Configuration

- [ ] Nginx configuration file created
- [ ] Site enabled
- [ ] Configuration tested (`nginx -t`)
- [ ] Nginx restarted
- [ ] Frontend accessible via browser
- [ ] API proxy working

### SSL (Optional)

- [ ] Domain name configured
- [ ] Certbot installed
- [ ] SSL certificate obtained
- [ ] Auto-renewal configured
- [ ] HTTPS working

### Verification

- [ ] Frontend loads in browser
- [ ] Login page accessible
- [ ] API endpoints responding
- [ ] File uploads working
- [ ] Database connection working
- [ ] All services running

---

## Support & Additional Resources

### Useful Commands

```bash
# System information
uname -a
df -h
free -h
top

# Process management
ps aux | grep node
kill -9 PID

# Network troubleshooting
ifconfig
ip addr
ping google.com
```

### Log Locations

- **PM2 Logs**: `~/.pm2/logs/`
- **Nginx Logs**: `/var/log/nginx/`
- **MongoDB Logs**: `/var/log/mongodb/`
- **System Logs**: `/var/log/syslog`

---

## Notes

1. **IP Address**: Replace `172.31.31.254` with your actual domain name when configuring SSL
2. **JWT Secret**: Always use a strong, random secret in production
3. **Database**: MongoDB Atlas is recommended for production
4. **Backups**: Set up regular database backups
5. **Monitoring**: Consider setting up monitoring tools (PM2 Plus, New Relic, etc.)
6. **Updates**: Keep system and dependencies updated regularly

---

*Last Updated: Based on provided server credentials and deployment requirements*

