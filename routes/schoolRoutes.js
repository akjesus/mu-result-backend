const schoolController = require("../controllers/schoolController");
const express = require("express");
const router = express.Router();
const restrictTo = require("../controllers/authController").restrictTo;
const verifyToken = require("../controllers/authController").verifyToken;
router.use(verifyToken); // Protect all routes after this middleware

router.use(restrictTo("student", "staff", "admin", "superadmin","ict"));
router.get("/faculties", schoolController.getAllFaculties);
router.get("/sessions", schoolController.getSessions);
router.get("/sessions/all", schoolController.getAllSessions);
router.get("/semesters/all", schoolController.getAllSemesters);
router.post("/sessions", schoolController.createSession);
router.put("/sessions/:id", schoolController.updateSession);


router.get("/levels", schoolController.getLevels);
router.get("/sessions/:id/semesters", schoolController.getSemestersForSession);
router.get("/semesters/sessions", schoolController.getAllSemestersWithSessions);
router.post("/sessions/:id/semesters", schoolController.createSemester);

router.use(restrictTo("staff", "admin", "superadmin", "ict"));
router.get("/departments", schoolController.getAllDepartments);
router.post("/departments", schoolController.createDepartment);
router.get("departments/:id", schoolController.getDepartmentById);
router.put("/departments/:id", schoolController.updateDepartment);
router.post("/faculties", schoolController.createFaculty);
router.get("/faculties/:id", schoolController.getFacultyById);

router.use(restrictTo("admin", "superadmin", "ict"));
router.put("/faculties/:id", schoolController.updateFaculty);
router.post("/semesters/:id/activate", schoolController.activateSemester);
router.delete("/faculties/:id", schoolController.deleteFaculty);
router.delete("/departments/:id", schoolController.deleteDepartment);
router.delete("/sessions/:id", schoolController.deleteSession);
router.delete("/semesters/:id", schoolController.deleteSemester);

module.exports = router;
