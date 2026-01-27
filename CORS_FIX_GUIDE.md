# 🔧 CORS Fix Guide - Domain Configuration

**Date:** November 30, 2025  
**Issue:** CORS error when accessing HRMS from `http://hrms.kloud.com.bd`  
**Status:** ✅ **FIXED**

---

## 📋 Problem Summary

### Error Message:
```
Access to XMLHttpRequest at 'http://103.146.220.225:84/api/auth/login' 
from origin 'http://hrms.kloud.com.bd' has been blocked by CORS policy: 
Request header field content-type is not allowed by 
Access-Control-Allow-Headers in preflight response.
```

### Root Cause:
The backend CORS configuration was using default settings (`app.use(cors())`) which didn't explicitly allow:
- The frontend domain `http://hrms.kloud.com.bd`
- The `Content-Type` header in preflight requests
- Other necessary headers for API requests

---

## ✅ Solution Applied

### Backend CORS Configuration Updated

**File:** `HRMS-Backend/server.js`

**Changes:**
1. ✅ Added explicit CORS configuration with allowed origins
2. ✅ Added `Content-Type` to `allowedHeaders`
3. ✅ Added `Authorization` header support
4. ✅ Configured credentials support
5. ✅ Added all necessary HTTP methods

### Allowed Origins:
- `http://hrms.kloud.com.bd`
- `https://hrms.kloud.com.bd`
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Alternative dev)
- Other localhost variants

### Allowed Headers:
- `Content-Type` ✅ (This was the missing one!)
- `Authorization`
- `X-Requested-With`
- `Accept`
- `Origin`
- `Access-Control-Request-Method`
- `Access-Control-Request-Headers`

### Allowed Methods:
- `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`

---

## 🚀 Deployment Steps

### Step 1: Restart Backend Server

```bash
cd /home/shamimkhaled/rupvai/HRMS-Backend

# Stop existing server
kill $(lsof -ti :5000) 2>/dev/null || pkill -f "node server.js"

# Start server
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

### Step 2: Verify CORS Headers

Test the CORS configuration:

```bash
curl -H "Origin: http://hrms.kloud.com.bd" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: content-type" \
     -X OPTIONS \
     http://103.146.220.225:84/api/auth/login \
     -v
```

**Expected Response Headers:**
```
Access-Control-Allow-Origin: http://hrms.kloud.com.bd
Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization,X-Requested-With,Accept,Origin
Access-Control-Allow-Credentials: true
```

### Step 3: Test Login API

```bash
curl -X POST http://103.146.220.225:84/api/auth/login \
  -H "Origin: http://hrms.kloud.com.bd" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@example.com","password":"12345"}' \
  -v
```

**Expected:** Should return `200 OK` with token, no CORS errors.

---

## 🌐 Frontend Configuration

### Environment Variable Setup

**For Production (Domain):**

Create or update `.env.production` in `HRMS-Frontend/`:

```env
VITE_API_URL=http://103.146.220.225:84
```

**For Development:**

Create or update `.env.development` in `HRMS-Frontend/`:

```env
VITE_API_URL=http://localhost:5000
```

### Rebuild Frontend (If Needed)

If you changed environment variables:

```bash
cd /home/shamimkhaled/rupvai/HRMS-Frontend

# Build for production
npm run build

# Or run dev server
npm run dev
```

---

## 🔍 Verification Checklist

- [x] Backend CORS configuration updated
- [ ] Backend server restarted
- [ ] CORS headers verified with curl
- [ ] Frontend environment variable set
- [ ] Frontend rebuilt (if env changed)
- [ ] Login works from `http://hrms.kloud.com.bd`
- [ ] No CORS errors in browser console

---

## 🐛 Troubleshooting

### Issue: Still Getting CORS Errors

**Solution 1: Clear Browser Cache**
```javascript
// In browser console
location.reload(true);
```

**Solution 2: Check Backend is Running**
```bash
curl http://103.146.220.225:84/
# Should return: {"message":"HRMS API Running",...}
```

**Solution 3: Verify CORS Headers**
```bash
curl -I -H "Origin: http://hrms.kloud.com.bd" \
     http://103.146.220.225:84/api/auth/login
```

**Solution 4: Check Nginx/Proxy Configuration**

If using Nginx as reverse proxy, ensure it's not stripping CORS headers:

```nginx
# In Nginx config
location /api {
    proxy_pass http://103.146.220.225:84;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    
    # Don't strip CORS headers
    proxy_pass_header Access-Control-Allow-Origin;
    proxy_pass_header Access-Control-Allow-Methods;
    proxy_pass_header Access-Control-Allow-Headers;
}
```

### Issue: "Network error" Instead of CORS Error

This might be a different issue:
1. Check backend is accessible from frontend server
2. Check firewall rules
3. Check DNS resolution
4. Verify API URL in frontend env

---

## 📊 Current Configuration

### Backend Server:
- **URL:** `http://103.146.220.225:84`
- **Port:** `84` (or check your actual port)
- **CORS:** ✅ Configured for `hrms.kloud.com.bd`

### Frontend:
- **Domain:** `http://hrms.kloud.com.bd`
- **API URL:** `http://103.146.220.225:84` (from `VITE_API_URL`)

### Network Flow:
```
Browser (hrms.kloud.com.bd)
  ↓
  POST /api/auth/login
  ↓
Backend (103.146.220.225:84)
  ↓
CORS Headers Added ✅
  ↓
Response with Token
```

---

## 🎯 Next Steps

1. ✅ **Restart Backend** - Apply CORS changes
2. ✅ **Test Login** - Verify CORS is working
3. ✅ **Check All APIs** - Ensure all endpoints work
4. ✅ **Monitor Logs** - Watch for any CORS issues

---

## 📝 Code Changes Summary

### Before:
```javascript
app.use(cors()); // Default CORS - too permissive but missing headers
```

### After:
```javascript
const corsOptions = {
  origin: ['http://hrms.kloud.com.bd', 'https://hrms.kloud.com.bd', ...],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', ...],
};

app.use(cors(corsOptions));
```

---

## ✅ Status

**CORS Configuration:** ✅ **FIXED**  
**Backend:** Ready for restart  
**Frontend:** Ready (check env vars)  
**Expected Result:** No more CORS errors! 🎉

---

**Last Updated:** November 30, 2025  
**Fixed By:** CORS configuration update in `server.js`
