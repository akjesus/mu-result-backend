const router = require("express").Router();
const multer = require("multer")
const upload = multer()
const resultController = require("../controllers/resultController");
const verifyToken = require("../controllers/authController").verifyToken;
const restrictTo = require("../controllers/authController").restrictTo;

router.use(verifyToken);
// Routes accessible to all authenticated users (students, staff, etc.)
router.use(restrictTo("superadmin", "admin", "staff", "student", "hod", "dean"));
router.get('/student', resultController.getResultsByStudent);
router.get('/courses', resultController.getCoursesWithResults);
router.get('/cgpa/:studentId', resultController.calculateCGPA);
// Routes accessible to staff, HODs, Deans, and Admins
router.use(restrictTo("superadmin", "admin", "staff", "hod", "dean", "lecturer"));
router.get('/course/:id', resultController.getResultsByCourse);
router.get('/department/:id', resultController.getResultsByDepartment);
router.get('/department/:deptId/level/:levelId', resultController.getResultsByDepartmentAndLevel);
router.get('/cgpa',  resultController.calculateAllCGPA);
router.get('/departments/:id',  resultController.getallResultsforDepartment);
router.get('/cgpa/highest-lowest',  resultController.getHighestandLowestCGPA);
router.get("/",  resultController.getAllResults);
router.get("/:id",  resultController.getResultById);
// Routes accessible to staff, HODs, Deans, and Admins for creating/updating results
router.use(restrictTo("superadmin", "admin", "hod", "dean", "lecturer"));
router.post("/", resultController.createResult);
router.put("/batch-update", resultController.batchUpdateResults);
router.post("/bulk-upload", upload.single("file"), resultController.bulkUploadResults);
router.put("/:id", resultController.updateResult);
// Routes accessible to HODs, Deans, Admins for approving results
router.use(restrictTo("superadmin", "admin", "hod", "dean"));
router.post("/approve", resultController.approveResults);
router.post("/approve/courses", resultController.approveCourses);
router.post("/approve/courses/toggle", resultController.toggleApproval);
router.get("/approval/courses", resultController.getResultsForApproval);
// Routes accessible only to Super Admin for deleting results
router.use(restrictTo("superadmin"));
router.delete("/:id", resultController.deleteResult);

module.exports = router;