const Forecast = require("../models/Forecast");

// Get all forecasts
exports.getForecasts = async (req, res) => {
  try {
    const forecasts = await Forecast.find();
    res.json(forecasts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single forecast by ID
exports.getForecast = async (req, res) => {
  try {
    const forecast = await Forecast.findById(req.params.id);
    if (!forecast) return res.status(404).json({ message: "Forecast not found" });
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new forecast
exports.createForecast = async (req, res) => {
  try {
    const forecast = new Forecast(req.body);
    await forecast.save();
    res.status(201).json(forecast);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update forecast
exports.updateForecast = async (req, res) => {
  try {
    const forecast = await Forecast.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!forecast) return res.status(404).json({ message: "Forecast not found" });
    res.json(forecast);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete forecast
exports.deleteForecast = async (req, res) => {
  try {
    const forecast = await Forecast.findByIdAndDelete(req.params.id);
    if (!forecast) return res.status(404).json({ message: "Forecast not found" });
    res.json({ message: "Forecast deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
