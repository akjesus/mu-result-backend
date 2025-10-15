const courseController = require("../controllers/courseController");
const express = require("express");
const router = express.Router();
const restrictTo = require("../controllers/authController").restrictTo;
const verifyToken = require("../controllers/authController").verifyToken;
router.use(verifyToken); // Protect all routes after this middleware

router.get("/", courseController.getAllCourses);
router.get("/:id", courseController.getCourseById);

router.use(restrictTo("admin", "superadmin"));
router.delete("/:id", courseController.deleteCourse);
router.post("/", courseController.createCourse);
router.put("/:id", courseController.updateCourse);

module.exports = router;