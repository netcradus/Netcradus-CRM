const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load env vars
dotenv.config({ path: path.join(__dirname, "../server/.env") });

const clientController = require("../server/controllers/clientController");

async function run() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/netcradus-crm";
  console.log("Connecting to:", mongoUri);
  await mongoose.connect(mongoUri);
  console.log("Connected successfully!");

  // Mock req and res
  const req = {
    user: {
      _id: new mongoose.Types.ObjectId(),
      role: "admin"
    },
    query: {
      page: 1,
      limit: 10
    }
  };

  const res = {
    statusCode: 200,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      console.log(`Response JSON [Code: ${this.statusCode}]:`, JSON.stringify(data, null, 2));
      return this;
    }
  };

  try {
    console.log("======================================");
    console.log("TESTING getClientStats...");
    await clientController.getClientStats(req, res);
  } catch (err) {
    console.error("getClientStats failed directly:", err);
  }

  try {
    console.log("======================================");
    console.log("TESTING getClients...");
    await clientController.getClients(req, res);
  } catch (err) {
    console.error("getClients failed directly:", err);
  }

  await mongoose.connection.close();
}

run();
