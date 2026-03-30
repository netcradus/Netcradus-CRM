const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Create express app
const app = express();

// Set trust proxy for rate limiting on Render
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());

// Base routes
app.get("/", (req, res) => {
  res.send("NetCradus CRM Backend is running 🚀");
});

app.get("/test", (req, res) => {
  res.send("API is working");
});

app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Auth routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// Leads routes
const leadsRoutes = require("./routes/leadsRoutes");
app.use("/api/leads", leadsRoutes);

// Accounts routes
const accountRoutes = require("./routes/accountRoutes");
app.use("/api/accounts", accountRoutes);

//expense Routes
const expenseRoutes = require("./routes/expenseRoutes");
app.use("/api/expenses", expenseRoutes)

// Calls routes
const callsRoutes = require("./routes/callsRoutes");
app.use("/api/calls", callsRoutes);

// Contacts routes
const contactRoutes = require("./routes/contactRoutes");
app.use("/api/contacts", contactRoutes);

// Deals routes
const DealsRoutes = require("./routes/dealsRoutes");
app.use("/api/deals", DealsRoutes);

// Tasks routes
const taskRoutes = require("./routes/taskRoutes");
app.use("/api/tasks", taskRoutes);

const projectRoutes = require("./routes/projectRoutes");
app.use("/api/projects", projectRoutes);

//Column Routes
const columnRoutes = require("./routes/columnRoutes");
app.use("/api/columns", columnRoutes);

//product routes
const productRoutes = require("./routes/productRoutes");
app.use("/api/products", productRoutes);

//quotes routes
const quoteRoutes = require("./routes/quoteRoutes");
app.use("/api/quotes", quoteRoutes);

//Salesorder routes
const salesOrderRoutes = require("./routes/salesOrderRoutes");
app.use("/api/salesorders", salesOrderRoutes);

//PurchaseOrder routes
const purchaseOrderRoutes = require("./routes/purchaseOrderRoutes");
app.use("/api/purchase-orders", purchaseOrderRoutes);

//Invoice Routes
const invoiceRoutes = require("./routes/invoiceRoutes");
app.use("/api/invoices", invoiceRoutes);

// Use SalesInbox routes
const salesInboxRoutes = require('./routes/salesInboxRoutes');
app.use('/api/sales-inbox', salesInboxRoutes);

//Campaign Routes
const campaignRoutes = require("./routes/campaignRoutes");
app.use("/api/campaigns", campaignRoutes);

//pricebooks routes
const priceBookRoutes = require("./routes/priceBooks");
app.use("/api/pricebooks", priceBookRoutes);

// Case Routes
const caseRoutes = require("./routes/caseRoutes");
app.use("/api/cases", caseRoutes);

// meeting Routes
const meetingRoutes = require("./routes/meetingRoutes");
app.use("/api/meetings", meetingRoutes);

//solution Routes
const solutionRoutes = require("./routes/solutionRoutes");
app.use("/api/solutions", solutionRoutes);

//Document routes
const documentRoutes = require("./routes/documentRoutes");
app.use("/api/documents", documentRoutes);

const forecastRoutes = require("./routes/forecastRoutes");
app.use("/api/forecasts", forecastRoutes);

const visitRoutes = require("./routes/visitRoutes");
app.use("/api/visits", visitRoutes);

// Start server


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
