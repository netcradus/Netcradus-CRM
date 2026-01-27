// models/Forecast.js
const mongoose = require("mongoose");

const forecastSchema = new mongoose.Schema({
  period: { type: String, required: true },
  owner: { type: String, required: true },
  target: { type: Number, required: true },
  forecast: { type: Number, required: true },
  achieved: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Forecast", forecastSchema);
