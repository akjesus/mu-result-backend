const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const restrictTo = require("../controllers/authController").restrictTo;
const verifyToken = require("../controllers/authController").verifyToken;


router.post("/login", authController.login);

router.use(verifyToken); 
router.post("/logout", authController.adminLogout);
router.post("/refresh", authController.refreshToken);
router.get("/me", authController.getMe);

// All routes after this middleware are restricted to Super Admin
router.use(restrictTo("superadmin"));
router.post("/reset-password", authController.resetPassword);
router.post("/create-admin", authController.createAdmin);

module.exports = router;
