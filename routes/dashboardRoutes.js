const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const verifyToken = require("../controllers/authController").verifyToken;


router.use(verifyToken); // Protect all routes after this middleware

router.get("/", dashboardController.getDashboardData);

module.exports = router;