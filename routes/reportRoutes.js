const reportController = require('../controllers/reportController');
const express = require('express');
const router = express.Router();
const restrictTo = require('../controllers/authController').restrictTo;
const verifyToken = require('../controllers/authController').verifyToken;
router.use(verifyToken); // Protect all routes after this middleware

router.use(restrictTo('admin', 'superadmin', 'staff'))
router.get('/course/:id', reportController.getGradeDistributionByCourse);


module.exports = router;