const router = require("express").Router();
const multer = require("multer")
const upload = multer()
const resultController = require("../controllers/resultController");
const verifyToken = require("../controllers/authController").verifyToken;
const restrictTo = require("../controllers/authController").restrictTo;

router.use(verifyToken); // Protect all routes after this middleware
router.use(restrictTo("superadmin", "admin", "staff", "student"));

router.get('/student', resultController.getResultsByStudent);
router.get('/courses', resultController.getCoursesWithResults);
router.get('/cgpa/:studentId', resultController.calculateCGPA);

router.use(restrictTo("superadmin", "admin", "staff"));
router.get('/course/:id', resultController.getResultsByCourse);
router.get('/department/:id', resultController.getResultsByDepartment);
router.get('/department/:deptId/level/:levelId', resultController.getResultsByDepartmentAndLevel);
router.get('/cgpa',  resultController.calculateAllCGPA);
router.get('/departments/:id',  resultController.getallResultsforDepartment);
router.get('/cgpa/highest-lowest',  resultController.getHighestandLowestCGPA);
router.get("/",  resultController.getAllResults);
router.get("/:id",  resultController.getResultById);

router.use(restrictTo("superadmin", "admin"));


router.post("/", resultController.createResult);
router.put("/batch-update", resultController.batchUpdateResults);
router.post("/bulk-upload", upload.single("file"), resultController.bulkUploadResults);
router.put("/:id", resultController.updateResult);

router.use(restrictTo("superadmin"));
router.delete("/:id", resultController.deleteResult);




module.exports = router;