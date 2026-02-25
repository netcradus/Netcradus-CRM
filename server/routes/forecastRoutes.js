const express = require("express");
const router = express.Router();
const forecastController = require("../controllers/forecastController");

// Routes
router.get("/", forecastController.getForecasts);
router.get("/:id", forecastController.getForecast);
router.post("/", forecastController.createForecast);
router.put("/:id", forecastController.updateForecast);
router.delete("/:id", forecastController.deleteForecast);

module.exports = router;
