# How to Run HRMS

## Prerequisites

- **Node.js** (v18+)
- **MongoDB** (running locally or remote URI)
- Backend env file: `HRMS-Backend/.env.development` (copy from `.env.example` and fill values)

## 1. Backend

```powershell
cd HRMS-Backend
npm install
```

Create `HRMS-Backend/.env.development` with at least:

- `MONGODB_URI=mongodb://localhost:27017/yourdb` (or your MongoDB connection string)
- `JWT_SECRET=your-secret-key`
- `PORT=5000` (optional, default 5000)

Then start:

```powershell
npm run dev
```

Or production:

```powershell
npm start
```

- API: http://localhost:5000  
- Swagger: http://localhost:5000/api-docs  

**ZKTeco:** If you don’t have a device, leave `ZKTECO_DEVICE_IP` unset (or remove it) in `.env.development`. Cron will skip device sync and the server will run without those errors.

## 2. Frontend

A `.env` file was added with `VITE_API_URL=http://localhost:5000`. If you removed it, create `HRMS-Frontend/.env` with:

```
VITE_API_URL=http://localhost:5000
```

Then:

```powershell
cd HRMS-Frontend
npm install
npm run dev
```

- App: http://localhost:5173  

## Summary of fixes applied

- **MongoDB:** Removed deprecated `useNewUrlParser` / `useUnifiedTopology` in `config/database.js`.
- **ZKTeco timeout:** Port and timeout are now numbers in `services/zktecoService.js` (fixes `ERR_INVALID_ARG_TYPE` for `msecs`).
- **Cron:** ZKTeco sync runs only when `ZKTECO_DEVICE_IP` is set; cron log for device logs uses `count` instead of `new`.
- **Windows:** Backend `npm start` uses `cross-env` so `NODE_ENV` works on Windows.
- **Frontend:** `.env` with `VITE_API_URL=http://localhost:5000` so the app can call the backend in dev.
