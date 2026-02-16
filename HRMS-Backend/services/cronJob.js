// const cron = require("node-cron");
// const zkService = require("./zktecoService");

// // Sync logs every 5 minutes
// cron.schedule("*/5 * * * *", async () => {
//   console.log("⏳ [Cron] Running syncDeviceLogs...");
//   try {
//     const logs = await zkService.syncDeviceLogs();
//     console.log(`✅ [Cron] Synced ${logs.count} logs`);
//   } catch (error) {
//     console.error("❌ [Cron] syncDeviceLogs failed:", error.message);
//   }
// });

// // Sync users every 8 minutes
// cron.schedule("*/8 * * * *", async () => {
//   console.log("⏳ [Cron] Running syncUsers...");
//   try {
//     const users = await zkService.syncUsers();
//     console.log(`✅ [Cron] Synced ${users.count} users`);
//   } catch (error) {
//     console.error("❌ [Cron] syncUsers failed:", error.message);
//   }
// });

// console.log("📅 Cron jobs scheduled successfully");


const cron = require('node-cron');
const zkService = require('./zktecoService');

const hasZKTecoDevice = () => {
  const ip = process.env.ZKTECO_DEVICE_IP;
  return ip && String(ip).trim() !== '';
};

// Sync logs every 5 minutes (only when ZKTeco device is configured)
cron.schedule('*/5 * * * *', async () => {
  if (!hasZKTecoDevice()) {
    return;
  }
  console.log('⏳ [Cron] Running syncDeviceLogs...');
  try {
    const logs = await zkService.syncDeviceLogs();
    console.log(`✅ [Cron] Synced ${logs.count} new logs, total ${logs.total}`);
  } catch (error) {
    console.error('❌ [Cron] syncDeviceLogs failed:', error.message);
  }
});

// Sync users every 8 minutes (only when ZKTeco device is configured)
cron.schedule('*/8 * * * *', async () => {
  if (!hasZKTecoDevice()) {
    return;
  }
  console.log('⏳ [Cron] Running syncUsers...');
  try {
    const users = await zkService.syncUsers();
    console.log(`✅ [Cron] Synced ${users.new} new users, total ${users.total}`);
  } catch (error) {
    console.error('❌ [Cron] syncUsers failed:', error.message);
  }
});

console.log('📅 Cron jobs scheduled successfully');