const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const { initializeSocket } = require("./socket");
const { registerCronJobs, getCronLastRun } = require("./cron");
const { isDriveEnabled } = require("./utils/featureFlags");
const zohoSyncService = require("./services/zohoSyncService");

dotenv.config();

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "super_secret_jwt_key_for_development_12345";
}
const checkDriveHealth = async () => {
  if (!isDriveEnabled()) {
    return { status: "maintenance", message: "Drive is temporarily unavailable for maintenance." };
  }
  return require("./config/drive").checkDriveHealth();
};

const app = express();
const server = http.createServer(app);

app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "1mb" }));

app.get("/", (req, res) => {
  res.send("NetCradus CRM Backend is running");
});

app.get("/test", (req, res) => {
  res.send("API is working");
});

app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "ok" });
});

const requireDbReady = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Database is reconnecting. Please retry shortly.",
    });
  }
  next();
};

app.use("/api", requireDbReady);

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const onboardingRoutes = require("./routes/onboardingRoutes");
app.use("/api/onboarding", onboardingRoutes);

app.get("/api/health/cron", (req, res) => {
  res.status(200).json({ success: true, data: getCronLastRun() });
});

const healthRoutes = require("./routes/healthRoutes");
app.use("/api/health", healthRoutes);
app.use("/api", require("./routes/zohoRoutes"));

const authMiddleware = require("./middleware/authMiddleware");
app.use("/api", authMiddleware);

app.use("/api/conversations", require("./routes/conversationRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/users", require("./routes/userPresenceRoutes"));
app.use("/api/org-hierarchy", require("./routes/orgHierarchy"));
app.use("/api/leads", require("./routes/leadsRoutes"));
app.use("/api/accounts", require("./routes/accountRoutes"));
app.use("/api/expenses", require("./routes/expenseRoutes"));
app.use("/api/calls", require("./routes/callsRoutes"));
app.use("/api/contacts", require("./routes/contactRoutes"));
app.use("/api/deals", require("./routes/dealsRoutes"));
app.use(
  "/api/super-user/sales",
  require("./routes/superUserSalesRoutes")
);
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/broadcasts", require("./routes/broadcastRoutes"));
app.use("/api/meeting-reminders", require("./routes/meetingReminderRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/partner", require("./routes/partnerRoutes"));
app.use("/api/columns", require("./routes/columnRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/quotes", require("./routes/quoteRoutes"));
app.use("/api/salesorders", require("./routes/salesOrderRoutes"));
app.use("/api/purchase-orders", require("./routes/purchaseOrderRoutes"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));
app.use("/api/interviews", require("./routes/interviewRoutes"));
app.use("/api/sales-inbox", require("./routes/salesInboxRoutes"));
app.use("/api/campaigns", require("./routes/campaignRoutes"));
app.use("/api/social", require("./routes/socialRoutes"));
app.use("/api/media", require("./routes/mediaRoutes"));
app.use("/api/audience", require("./routes/audienceRoutes"));
app.use("/api/utm", require("./routes/utmRoutes"));
app.use("/api/approval", require("./routes/approvalRoutes"));
app.use("/api/pricebooks", require("./routes/priceBooks"));
app.use("/api/cases", require("./routes/caseRoutes"));
app.use("/api/meetings", require("./routes/meetingsRoutes"));
app.use("/api/solutions", require("./routes/solutionRoutes"));

app.use("/api/documents", require("./routes/documentRoutes"));
app.use("/api/employee-assets", require("./routes/employeeAssetRoutes"));

app.use("/api/internal-mail", require("./routes/internalMailRoutes"));

app.use("/api/forecasts", require("./routes/forecastRoutes"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/leave", require("./routes/leave"));
app.use("/api/holidays", require("./routes/holidays"));
app.use("/api/visits", require("./routes/visitRoutes"));
app.use("/api/vendors", require("./routes/vendors"));
app.use("/api/tickets", require("./routes/ticketRoutes"));
app.use("/api/management", require("./routes/managementRoutes"));
app.use("/api/manager", require("./routes/managerRoutes"));
app.use("/api/manager/meetings", require("./routes/teamMeetingRoutes"));
app.use("/api/password-manager", require("./routes/passwordManagerRoutes"));
app.use("/api/workspace", require("./routes/workspaceRoutes"));

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  if (process.env.DISABLE_CRON === "true") {
    console.log("[CRON] Disabled by DISABLE_CRON=true");
  } else {
    registerCronJobs();
  }

  initializeSocket(server);
  await zohoSyncService.startPolling();

  server.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server is running on port ${PORT}`);

    const driveStatus = await checkDriveHealth();
    if (driveStatus.status === "maintenance") {
      console.log("[Drive] Skipping startup health check; Drive is in maintenance mode.");
      return;
    }
    if (driveStatus.status !== "ok") {
      console.error("\nDRIVE CONNECTION FAILED - file uploads will not work. Check OAuth credentials.");
      console.error(`Reason: ${driveStatus.message}\n`);
    } else {
      console.log("DRIVE CONNECTED - Storage system operational.");
    }
  });
};

const shutdown = (signal) => {
  console.log(`[Server] Received ${signal}. Shutting down.`);
  zohoSyncService.stopPolling();
  server.close(() => process.exit(0));
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer();
