const schoolController = require('../controllers/schoolController');
const express = require('express');
const router = express.Router();
const restrictTo = require('../controllers/authController').restrictTo;
const verifyToken = require('../controllers/authController').verifyToken;
router.use(verifyToken); // Protect all routes after this middleware

router.use(restrictTo("student", "staff", "admin", "superadmin"));
router.get('/faculties', schoolController.getAllFaculties);
router.get('/sessions', schoolController.getSessions);
router.get('/levels', schoolController.getLevels);

router.use(restrictTo( 'staff', "admin", "superadmin"));
router.get('/departments', schoolController.getAllDepartments);
router.post('/departments', schoolController.createDepartment);
router.get('departments/:id', schoolController.getDepartmentById);
router.put('/departments/:id', schoolController.updateDepartment);
router.post('/faculties', schoolController.createFaculty);
router.get('/faculties/:id', schoolController.getFacultyById);
router.get('/sessions/:id/semesters', schoolController.getSemestersForSession);


router.use(restrictTo('admin', "superadmin"));
router.post('/semesters/:id/activate', schoolController.activateSemester);
router.delete('/faculties/:id', schoolController.deleteFaculty);
router.delete('/departments/:id', schoolController.deleteDepartment);






module.exports = router;