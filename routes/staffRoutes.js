const staffController = require('../controllers/staffController');
const express = require('express');
const router = express.Router();
const restrictTo = require('../controllers/authController').restrictTo;
const verifyToken = require('../controllers/authController').verifyToken;

router.use(verifyToken);
router.use(restrictTo("admin", "superadmin", "staff"));
router.get('/', staffController.getAllStaff);
router.post('/', staffController.createStaff);
router.get('/:id', staffController.getStaffById);

router.use(restrictTo("admin", "superadmin"));
router.delete('/:id',  staffController.deleteStaff);
router.patch('/:id',  staffController.resetPassword);
router.put('/:id',  staffController.updateStaff);



module.exports = router;