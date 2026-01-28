# HRMS Backend Setup Guide

This guide will help you set up the HRMS backend application.

## Prerequisites

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download here](https://www.mongodb.com/try/download/community) or use MongoDB Atlas (cloud)
- **npm** (comes with Node.js) or **yarn**

## Step 1: Install Dependencies

Navigate to the backend directory and install all required packages:

```bash
cd HRMS-Backend
npm install
```

## Step 2: Environment Configuration

1. Copy the `.env.example` file to create your `.env` file:

```bash
cp .env.example .env
```

2. Open the `.env` file and fill in the required environment variables:

```env
MONGODB_URI=mongodb://localhost:27017/hrms
JWT_SECRET=your-super-secret-jwt-key-here
PORT=5000
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password-or-app-password
APP_TIMEZONE=Asia/Dhaka
```

### Environment Variables Explained:

- **MONGODB_URI**: MongoDB connection string
  - Local: `mongodb://localhost:27017/hrms`
  - MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/hrms?retryWrites=true&w=majority`
  
- **JWT_SECRET**: A secret key for JWT token encryption (use a strong random string)
  - Generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

- **PORT**: Server port (default: 5000)

- **EMAIL_USER**: Email address for sending emails (e.g., password reset, invitations)

- **EMAIL_PASS**: Email password or app-specific password (for Gmail, use App Password)

- **APP_TIMEZONE**: Application timezone (default: Asia/Dhaka)

## Step 3: MongoDB Setup

### Option A: Local MongoDB

1. Install MongoDB locally or use Docker:
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

2. Ensure MongoDB is running:
   ```bash
   # Check if MongoDB is running
   mongosh --eval "db.version()"
   ```

### Option B: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get your connection string and update `MONGODB_URI` in `.env`

## Step 4: Create Required Directories

The application needs an `uploads` directory for file storage:

```bash
mkdir -p uploads
```

## Step 5: Start the Server

### Development Mode (with auto-reload):

```bash
npm run dev
```

### Production Mode:

```bash
npm start
```

### Test Mode:

```bash
npm run start:test
```

## Step 6: Verify Installation

Once the server starts, you should see:

```
✅ MongoDB connected
Server running in development mode
API Documentation: http://localhost:5000/api-docs
Health Check:       http://localhost:5000
```

### Test the API:

1. **Health Check**: Visit `http://localhost:5000/` in your browser
   - Should return: `{"message":"HRMS API Running",...}`

2. **API Documentation**: Visit `http://localhost:5000/api-docs`
   - Swagger UI with all API endpoints

## Project Structure

```
HRMS-Backend/
├── config/          # Configuration files (database, etc.)
├── controllers/     # Request handlers
├── middleware/      # Custom middleware (auth, upload, etc.)
├── models/          # Mongoose models
├── routes/          # API routes
├── services/        # Business logic services (cron jobs, sync, etc.)
├── swagger/         # API documentation config
├── utils/           # Utility functions
├── migrations/      # Database migration scripts
├── uploads/         # File uploads directory (create this)
├── server.js        # Main server entry point
└── .env             # Environment variables (create from .env.example)
```

## Features

- ✅ RESTful API with Express.js
- ✅ MongoDB database with Mongoose
- ✅ JWT authentication
- ✅ File uploads (Multer)
- ✅ Swagger API documentation
- ✅ Cron jobs for scheduled tasks
- ✅ Email functionality (Nodemailer)
- ✅ CORS configured for frontend integration
- ✅ Activity logging
- ✅ Attendance sync with ZKTeco devices

## Troubleshooting

### MongoDB Connection Error

- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env` is correct
- Verify network connectivity if using remote MongoDB

### Port Already in Use

- Change `PORT` in `.env` to a different port
- Or kill the process using the port:
  ```bash
  # Linux/Mac
  lsof -ti:5000 | xargs kill -9
  
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  ```

### Module Not Found Errors

- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

### Email Not Working

- For Gmail, enable "Less secure app access" or use App Password
- Check `EMAIL_USER` and `EMAIL_PASS` in `.env`
- Verify email credentials are correct

## Development Tips

- Use `npm run dev` for development (auto-reloads on file changes)
- Check `http://localhost:5000/api-docs` for API documentation
- All API routes are prefixed with `/api`
- Authentication is required for most endpoints (except auth routes)

## Next Steps

After setting up the backend:

1. Set up the frontend (see `HRMS-Frontend/README.md`)
2. Create your first admin user through the API or initial setup
3. Configure company settings
4. Set up departments and designations
5. Add employees and configure shifts

## Support

For issues or questions, check:
- API Documentation: `http://localhost:5000/api-docs`
- Health Check: `http://localhost:5000/`
