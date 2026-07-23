const mongoose = require("mongoose");

mongoose.set("bufferCommands", false);
mongoose.set("bufferTimeoutMS", Number(process.env.MONGO_BUFFER_TIMEOUT_MS || 2000));

const connectDB = async () => {
  try {
    const dbUri = process.env.MONGO_URI || "mongodb+srv://netcradus_db_user:gwQGRJs7Y4WFbHda@cluster0.zcdpx8c.mongodb.net/crm_db?retryWrites=true&w=majority";
    const conn = await mongoose.connect(dbUri, {
      maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 10),
      minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 0),
      serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 10000),
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
