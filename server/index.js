const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const connectDB = require("./config/db");
const { initializeSocket } = require("./socket");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json());

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

const salesInboxRoutes = require("./routes/salesInboxRoutes");
app.use("/api/sales-inbox", salesInboxRoutes);

const campaignRoutes = require("./routes/campaignRoutes");
app.use("/api/campaigns", campaignRoutes);

const priceBookRoutes = require("./routes/priceBooks");
app.use("/api/pricebooks", priceBookRoutes);

const caseRoutes = require("./routes/caseRoutes");
app.use("/api/cases", caseRoutes);

const meetingRoutes = require("./routes/meetingRoutes");
app.use("/api/meetings", meetingRoutes);

const solutionRoutes = require("./routes/solutionRoutes");
app.use("/api/solutions", solutionRoutes);

const documentRoutes = require("./routes/documentRoutes");
app.use("/api/documents", documentRoutes);

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

const { registerCronJobs, getCronLastRun } = require("./cron");
registerCronJobs();

app.get("/api/health/cron", (req, res) => {
  res.status(200).json({ success: true, data: getCronLastRun() });
});

initializeSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});