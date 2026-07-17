const mongoose = require("mongoose");

const run = async () => {
  const directUri = "mongodb://netcradus_db_user:gwQGRJs7Y4WFbHda@ac-ti9ddbi-shard-00-01.zcdpx8c.mongodb.net:27017/crm_db?ssl=true&authSource=admin&replicaSet=atlas-m1w9i2-shard-0";
  console.log("Connecting directly to Mongoose...");
  await mongoose.connect(directUri);
  console.log("SUCCESS! Connected directly to MongoDB shard.");
  await mongoose.disconnect();
};

run().catch(err => {
  console.error("Connection failed:", err.message);
});
