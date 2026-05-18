const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const connectDB = require("./config/db");
const { initializeSocket } = require("./socket");
const { registerCronJobs, getCronLastRun } = require("./cron");
const { isDriveEnabled } = require("./utils/featureFlags");

dotenv.config();
connectDB();

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

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);
const onboardingRoutes = require("./routes/onboardingRoutes");
app.use("/api/onboarding", onboardingRoutes);

app.get("/api/health/cron", (req, res) => {
  res.status(200).json({ success: true, data: getCronLastRun() });
});

const healthRoutes = require("./routes/healthRoutes");
app.use("/api/health", healthRoutes);

const authMiddleware = require("./middleware/authMiddleware");
const onboardingExemptMiddleware = require("./middleware/onboardingExemptMiddleware");
app.use("/api", authMiddleware, onboardingExemptMiddleware);

const conversationRoutes = require("./routes/conversationRoutes");
app.use("/api/conversations", conversationRoutes);
const messageRoutes = require("./routes/messageRoutes");
app.use("/api/messages", messageRoutes);
const userPresenceRoutes = require("./routes/userPresenceRoutes");
app.use("/api/users", userPresenceRoutes);
const orgHierarchyRoutes = require("./routes/orgHierarchy");
app.use("/api/org-hierarchy", orgHierarchyRoutes);

const leadsRoutes = require("./routes/leadsRoutes");
app.use("/api/leads", leadsRoutes);

const accountRoutes = require("./routes/accountRoutes");
app.use("/api/accounts", accountRoutes);

const expenseRoutes = require("./routes/expenseRoutes");
app.use("/api/expenses", expenseRoutes);

const callsRoutes = require("./routes/callsRoutes");
app.use("/api/calls", callsRoutes);

const contactRoutes = require("./routes/contactRoutes");
app.use("/api/contacts", contactRoutes);

const dealsRoutes = require("./routes/dealsRoutes");
app.use("/api/deals", dealsRoutes);

const taskRoutes = require("./routes/taskRoutes");
app.use("/api/tasks", taskRoutes);

const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

const projectRoutes = require("./routes/projectRoutes");
app.use("/api/projects", projectRoutes);

const columnRoutes = require("./routes/columnRoutes");
app.use("/api/columns", columnRoutes);

const productRoutes = require("./routes/productRoutes");
app.use("/api/products", productRoutes);

const quoteRoutes = require("./routes/quoteRoutes");
app.use("/api/quotes", quoteRoutes);

const salesOrderRoutes = require("./routes/salesOrderRoutes");
app.use("/api/salesorders", salesOrderRoutes);

const purchaseOrderRoutes = require("./routes/purchaseOrderRoutes");
app.use("/api/purchase-orders", purchaseOrderRoutes);

const invoiceRoutes = require("./routes/invoiceRoutes");
app.use("/api/invoices", invoiceRoutes);
const interviewRoutes = require("./routes/interviewRoutes");
app.use("/api/interviews", interviewRoutes);

const salesInboxRoutes = require("./routes/salesInboxRoutes");
app.use("/api/sales-inbox", salesInboxRoutes);

const campaignRoutes = require("./routes/campaignRoutes");
app.use("/api/campaigns", campaignRoutes);
const socialRoutes = require("./routes/socialRoutes");
app.use("/api/social", socialRoutes);
const mediaRoutes = require("./routes/mediaRoutes");
app.use("/api/media", mediaRoutes);
const audienceRoutes = require("./routes/audienceRoutes");
app.use("/api/audience", audienceRoutes);
const utmRoutes = require("./routes/utmRoutes");
app.use("/api/utm", utmRoutes);
const approvalRoutes = require("./routes/approvalRoutes");
app.use("/api/approval", approvalRoutes);

const priceBookRoutes = require("./routes/priceBooks");
app.use("/api/pricebooks", priceBookRoutes);

const caseRoutes = require("./routes/caseRoutes");
app.use("/api/cases", caseRoutes);

const meetingRoutes = require("./routes/meetingRoutes");
app.use("/api/meetings", meetingRoutes);

const solutionRoutes = require("./routes/solutionRoutes");
app.use("/api/solutions", solutionRoutes);

if (isDriveEnabled()) {
  const documentRoutes = require("./routes/documentRoutes");
  app.use("/api/documents", documentRoutes);
} else {
  app.use("/api/documents", (req, res) => {
    res.status(503).json({
      success: false,
      code: "DRIVE_MAINTENANCE",
      message: "Drive is temporarily unavailable while we perform maintenance.",
    });
  });
}

const forecastRoutes = require("./routes/forecastRoutes");
app.use("/api/forecasts", forecastRoutes);

const attendanceRoutes = require("./routes/attendance");
app.use("/api/attendance", attendanceRoutes);

const leaveRoutes = require("./routes/leave");
app.use("/api/leave", leaveRoutes);

const holidayRoutes = require("./routes/holidays");
app.use("/api/holidays", holidayRoutes);

const visitRoutes = require("./routes/visitRoutes");
app.use("/api/visits", visitRoutes);

const ticketRoutes = require("./routes/ticketRoutes");
app.use("/api/tickets", ticketRoutes);

const managementRoutes = require("./routes/managementRoutes");
app.use("/api/management", managementRoutes);

const passwordManagerRoutes = require("./routes/passwordManagerRoutes");
app.use("/api/password-manager", passwordManagerRoutes);

if (process.env.DISABLE_CRON === "true") {
  console.log("[CRON] Disabled by DISABLE_CRON=true");
} else {
  registerCronJobs();
}

initializeSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", async () => {
  console.log(`🚀 Server is running on port ${PORT}`);

  // Drive Startup Check
  const driveStatus = await checkDriveHealth();
  if (driveStatus.status === 'maintenance') {
    console.log('[Drive] Skipping startup health check; Drive is in maintenance mode.');
    return;
  }
  if (driveStatus.status !== 'ok') {
    console.error('\n⚠️  DRIVE CONNECTION FAILED — file uploads will not work. Check OAuth credentials.');
    console.error(`Reason: ${driveStatus.message}\n`);
  } else {
    console.log('✅ DRIVE CONNECTED — Storage system operational.');
  }
});
