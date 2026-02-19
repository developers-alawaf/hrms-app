# 🔧 Domain Deployment Guide - HRMS Application

**Date:** December 2024  
**Issue:** Authentication fails when accessing via domain `hrms.kloud.com.bd`  
**Status:** ✅ **CONFIGURED**

---

## 📋 Problem Summary

### Current Configuration:
- **Private IP:** 172.31.31.254
- **Public IP:** 103.146.220.225
- **Domain:** hrms.kloud.com.bd
- **Ports:** 80, 84, 88
- **Application Path:** `/var/www/HRMS/`

### Issue:
- ✅ Works: `http://103.146.220.225:84/` (IP-based access)
- ❌ Fails: `http://hrms.kloud.com.bd/` (Domain-based access)

---

## ✅ Solution Applied

### 1. Backend CORS Configuration Updated

**File:** `HRMS-Backend/server.js`

**Changes Made:**
1. ✅ Added domain with all ports (80, 84, 88) to allowed origins
2. ✅ Added explicit check for `hrms.kloud.com.bd` domain
3. ✅ Ensured both HTTP and HTTPS variants are allowed
4. ✅ Maintained credentials support for cookies/auth headers

**Allowed Origins Now Include:**
```javascript
'http://hrms.kloud.com.bd'
'https://hrms.kloud.com.bd'
'http://hrms.kloud.com.bd:80'
'http://hrms.kloud.com.bd:84'
'http://hrms.kloud.com.bd:88'
'https://hrms.kloud.com.bd:80'
'https://hrms.kloud.com.bd:84'
'https://hrms.kloud.com.bd:88'
// ... plus IP addresses and localhost
```

---

## 🚀 Deployment Steps

### Step 1: Update Backend Server Code

On your VM server, update the backend code:

```bash
cd /var/www/HRMS/Backend

# If using git:
git pull origin main

# Or manually update server.js with the new CORS configuration
```

### Step 2: Restart Backend Server

```bash
cd /var/www/HRMS/Backend

# Find and stop the running backend process
ps aux | grep "node.*server.js"
kill <PID>

# Or use PM2 if you're using it:
pm2 restart hrms-backend

# Or start manually:
nohup node server.js > backend.log 2>&1 &

# Verify it's running
tail -f backend.log
```

**Expected Output:**
```
Server running in development mode
API Documentation: http://localhost:5000/api-docs
Health Check:       http://localhost:5000
```

### Step 3: Configure Nginx Reverse Proxy (Recommended)

If your application is accessed on port 80 (standard HTTP), you likely need Nginx as a reverse proxy.

**Create/Update Nginx Configuration:**

```bash
sudo nano /etc/nginx/sites-available/hrms
```

**Add the following configuration:**

```nginx
# Upstream backend server
upstream hrms_backend {
    server localhost:5000;  # Adjust port if your backend runs on different port
    # Or server 172.31.31.254:5000;
}

# Frontend + API Proxy
server {
    listen 80;
    listen 84;
    listen 88;
    server_name hrms.kloud.com.bd 103.146.220.225 172.31.31.254;

    # Frontend static files
    root /var/www/HRMS/Frontend/dist;
    index index.html;

    # Logging
    access_log /var/log/nginx/hrms_access.log;
    error_log /var/log/nginx/hrms_error.log;

    # Frontend routes - serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy - forward /api requests to backend
    location /api {
        proxy_pass http://hrms_backend;
        proxy_http_version 1.1;
        
        # Essential proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # CORS headers - pass through (backend handles CORS)
        proxy_pass_header Access-Control-Allow-Origin;
        proxy_pass_header Access-Control-Allow-Methods;
        proxy_pass_header Access-Control-Allow-Headers;
        proxy_pass_header Access-Control-Allow-Credentials;
        
        # WebSocket support (if needed)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Uploads/Static files from backend
    location /uploads {
        proxy_pass http://hrms_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API Documentation
    location /api-docs {
        proxy_pass http://hrms_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Enable the site:**

```bash
# Create symbolic link if not exists
sudo ln -s /etc/nginx/sites-available/hrms /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
# Or
sudo service nginx reload
```

### Step 4: Configure Firewall

Ensure ports 80, 84, and 88 are open:

```bash
# For UFW (Ubuntu Firewall)
sudo ufw allow 80/tcp
sudo ufw allow 84/tcp
sudo ufw allow 88/tcp
sudo ufw status

# For iptables
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 84 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 88 -j ACCEPT
sudo iptables-save
```

### Step 5: Update Frontend Configuration

**Option A: Use Domain for API (Recommended)**

Update frontend environment file:

```bash
cd /var/www/HRMS/Frontend
nano .env.production
```

Add:
```env
VITE_API_URL=http://hrms.kloud.com.bd
# Or if using specific port:
# VITE_API_URL=http://hrms.kloud.com.bd:84
```

Rebuild frontend:
```bash
npm run build
```

**Option B: Keep IP for API (If no reverse proxy)**

If backend is directly accessible, keep:
```env
VITE_API_URL=http://103.146.220.225:84
```

**Important:** Make sure to rebuild frontend after changing environment variables:
```bash
cd /var/www/HRMS/Frontend
npm run build
```

**Dashboard API (400/404) / Month summary not showing:** If the dashboard shows cards but counts are wrong or you see 400/404 for `/api/dashboard` or `/api/dashboard/month-summary`:
- Use the **same origin** for API when Nginx proxies `/api` to the backend: set `VITE_API_URL=` (empty) in `.env.production` before building, so the frontend uses relative URLs (e.g. `/api/dashboard/month-summary`) and the browser sends them to the same host; Nginx then proxies to the backend.
- Or set `VITE_API_URL=http://hrms.kloud.com.bd` (same as the site URL) so requests go to the same domain.
- Ensure Nginx forwards **all** `/api` subpaths: use `location /api/` (with trailing slash) and `proxy_pass http://hrms_backend;` (no path after upstream name) so every path under `/api/` is proxied (e.g. `/api/dashboard`, `/api/dashboard/month-summary`).
- **VM production:** Deploy the latest backend code and restart the Node process so `/api/dashboard` and `/api/dashboard/month-summary` both return 200. The backend now returns 200 with minimal data when the user has no employee link or employee not found, and returns 500 (not 400) for unexpected errors.

**VM: Fix 400/404 on dashboard (exact steps):**
1. On the VM, pull or copy the latest backend code (including `HRMS-Backend/controllers/dashboardController.js` and `HRMS-Backend/routes/dashboardRoutes.js`).
2. Restart the backend (e.g. `pm2 restart hrms-backend` or `systemctl restart hrms-backend` or kill and start `node server.js`).
3. Test without auth (should get 401, not 404):  
   `curl -s -o /dev/null -w "%{http_code}" http://hrms.kloud.com.bd/api/dashboard` → expect **401**  
   `curl -s -o /dev/null -w "%{http_code}" http://hrms.kloud.com.bd/api/dashboard/month-summary` → expect **401**
4. With a valid token (from browser after login):  
   `curl -s -H "Authorization: Bearer YOUR_TOKEN" http://hrms.kloud.com.bd/api/dashboard` → expect **200** and JSON.  
   `curl -s -H "Authorization: Bearer YOUR_TOKEN" http://hrms.kloud.com.bd/api/dashboard/month-summary` → expect **200** and JSON.
5. If you still get 404 on month-summary, confirm `dashboardRoutes.js` contains:  
   `router.get('/month-summary', dashboardController.getMonthSummary);`

---

## 🔍 Verification Steps

### 1. Test Backend Health Check

```bash
# Test via IP
curl http://103.146.220.225:84/

# Test via domain
curl http://hrms.kloud.com.bd/
```

**Expected:** `{"message":"HRMS API Running",...}`

### 2. Test CORS Headers

```bash
# Test CORS preflight
curl -H "Origin: http://hrms.kloud.com.bd" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: content-type" \
     -X OPTIONS \
     http://hrms.kloud.com.bd/api/auth/login \
     -v
```

**Expected Headers:**
```
Access-Control-Allow-Origin: http://hrms.kloud.com.bd
Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization,X-Requested-With,Accept,Origin
Access-Control-Allow-Credentials: true
```

### 3. Test Login API

```bash
curl -X POST http://hrms.kloud.com.bd/api/auth/login \
  -H "Origin: http://hrms.kloud.com.bd" \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}' \
  -v
```

**Expected:** `200 OK` with token in response body

### 4. Browser Testing

1. Open browser and navigate to: `http://hrms.kloud.com.bd/`
2. Open Developer Tools (F12) → Network tab
3. Attempt to login
4. Check:
   - ✅ No CORS errors in console
   - ✅ Login request returns 200 OK
   - ✅ Token is received and stored
   - ✅ Redirect to dashboard works

---

## 🐛 Troubleshooting

### Issue 1: "Network Error" or Connection Refused

**Symptoms:** Can't reach the backend API

**Solutions:**
```bash
# Check if backend is running
ps aux | grep node
netstat -tlnp | grep :5000  # or your backend port

# Check if Nginx is running
sudo systemctl status nginx
sudo nginx -t

# Check firewall
sudo ufw status
```

### Issue 2: CORS Errors in Browser Console

**Symptoms:** 
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solutions:**

1. **Verify CORS headers are present:**
```bash
curl -I -H "Origin: http://hrms.kloud.com.bd" \
     http://hrms.kloud.com.bd/api/auth/login
```

2. **Check backend logs for CORS issues:**
```bash
tail -f /var/www/HRMS/Backend/backend.log
```

3. **Clear browser cache:**
   - Hard refresh: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
   - Or clear cache in browser settings

4. **Verify allowedOrigins includes domain:**
   - Check `server.js` CORS configuration
   - Ensure domain is in the allowedOrigins array

### Issue 3: Authentication Returns 401/403

**Symptoms:** Login fails with authentication errors

**Solutions:**

1. **Check backend authentication logs:**
```bash
tail -f /var/www/HRMS/Backend/backend.log | grep -i "login\|auth\|jwt"
```

2. **Verify JWT secret is set:**
```bash
cd /var/www/HRMS/Backend
cat .env | grep JWT_SECRET
```

3. **Test authentication directly:**
```bash
curl -X POST http://hrms.kloud.com.bd/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  -v
```

### Issue 4: Domain Resolves but Shows Wrong Content

**Symptoms:** Domain works but shows default Nginx page or different app

**Solutions:**

1. **Verify Nginx server_name includes domain:**
```bash
sudo cat /etc/nginx/sites-available/hrms | grep server_name
```

2. **Check which site is being served:**
```bash
sudo nginx -T | grep -A 10 "server_name.*hrms.kloud.com.bd"
```

3. **Ensure correct site is enabled:**
```bash
ls -la /etc/nginx/sites-enabled/
```

### Issue 5: Cookies/Sessions Not Working

**Symptoms:** Login succeeds but session not maintained

**Solutions:**

1. **Check cookie domain settings** (if using sessions):
   - Cookies should be set for `.kloud.com.bd` or `hrms.kloud.com.bd`
   - Verify `credentials: true` in CORS config

2. **Check SameSite cookie attribute:**
   - Should be `SameSite=None` for cross-domain (if needed)
   - Or `SameSite=Lax` for same-domain

3. **Verify localStorage is working:**
   - Open browser console
   - Check: `localStorage.getItem('token')`

---

## 📊 Network Architecture

### Current Setup (Recommended):
```
Internet
  ↓
Domain: hrms.kloud.com.bd (resolves to 103.146.220.225)
  ↓
VM Server (172.31.31.254 / 103.146.220.225)
  ↓
Nginx (Port 80/84/88)
  ├─ / → Frontend (static files from /var/www/HRMS/Frontend/dist)
  └─ /api → Backend (proxy to Node.js on port 5000)
              ↓
         Node.js Backend
              ↓
         MongoDB Database
```

### Alternative Setup (Direct Access):
```
Internet
  ↓
Domain: hrms.kloud.com.bd
  ↓
VM Server
  ├─ Frontend: Nginx serving static files (Port 80/84/88)
  └─ Backend: Node.js directly accessible (Port 84)
```

---

## 🔐 Security Recommendations

1. **Enable HTTPS (SSL/TLS):**
   - Get SSL certificate (Let's Encrypt - free)
   - Configure Nginx for HTTPS
   - Update CORS to include HTTPS origins

2. **Firewall Rules:**
   - Only open necessary ports (80, 443, 84, 88 if needed)
   - Block direct access to backend port (5000) from internet
   - Use Nginx as reverse proxy

3. **Environment Variables:**
   - Never commit `.env` files
   - Use strong JWT_SECRET
   - Rotate secrets regularly

4. **Rate Limiting:**
   - Add rate limiting to Nginx for login endpoints
   - Prevent brute force attacks

---

## 📝 Checklist

Before going live, verify:

- [ ] Backend CORS configuration updated with domain
- [ ] Backend server restarted
- [ ] Nginx configured and tested
- [ ] Firewall rules configured (ports 80, 84, 88)
- [ ] Frontend rebuilt with correct API URL
- [ ] DNS pointing domain to server IP
- [ ] Health check endpoint accessible
- [ ] CORS headers verified with curl
- [ ] Login tested via domain
- [ ] Session/cookie persistence verified
- [ ] No errors in browser console
- [ ] All API endpoints tested

---

## 🎯 Quick Reference Commands

```bash
# Backend
cd /var/www/HRMS/Backend
pm2 restart hrms-backend  # or your process manager
# OR
node server.js

# Frontend
cd /var/www/HRMS/Frontend
npm run build

# Nginx
sudo nginx -t
sudo systemctl reload nginx

# Logs
tail -f /var/www/HRMS/Backend/backend.log
tail -f /var/log/nginx/hrms_error.log

# Test
curl http://hrms.kloud.com.bd/
curl http://hrms.kloud.com.bd/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'
```

---

## 📞 Support

If issues persist:

1. Check backend logs: `/var/www/HRMS/Backend/backend.log`
2. Check Nginx logs: `/var/log/nginx/hrms_error.log`
3. Check browser console for errors
4. Verify DNS resolution: `nslookup hrms.kloud.com.bd`
5. Test backend directly: `curl http://172.31.31.254:5000/`

---

**Last Updated:** December 2024  
**Documentation Version:** 1.0
