const express = require("express");
const router = express.Router();
const restrictTo = require("../controllers/authController").restrictTo;
const verifyToken = require("../controllers/authController").verifyToken;
const studentController = require("../controllers/studentController");
const {getResultsByStudent, getAllResultsForStudent, getCurrentGPA} = require("../controllers/resultController");
const { changeStudentPassword } = require("../controllers/authController");

const multer = require("multer")
const upload = multer()

router.use(verifyToken);
router.use(restrictTo("superadmin", "admin", "staff", "student"));
router.get("/profile", studentController.getMyProfile);
router.post("/update-picture", upload.single("file"), studentController.updateProfilePicture);
router.get("/result", getResultsByStudent);
router.get("/gpa", getCurrentGPA);
router.get("/all-results", getAllResultsForStudent);
router.post("/change-password", changeStudentPassword);


router.use(restrictTo("admin", "staff", "superadmin"));
router.get('/departments', studentController.getStudentsByDepartment);
router.post("/bulk-upload", upload.single("file"), studentController.bulkUploadStudents);
router.get("/bulk-download", studentController.bulkDownloadStudents);
router.get("/", studentController.getAllStudents);
router.post("/",  studentController.createStudent);
router.get("/:id", studentController.getUserById);

router.use(restrictTo("admin", "superadmin"));
router.post("/:id/reset-password", studentController.resetPassword);
router.put("/:id/block-unblock",  studentController.blockUnblockStudent);
router.put("/:id",  studentController.updateStudent);


router.use(restrictTo("superadmin"));
router.post("/reset-all-passwords", studentController.resetAllPasswords);
router.delete("/:id",  studentController.deleteUser);




module.exports = router;
