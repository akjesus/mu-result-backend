const express = require('express');
const router = express.Router();

const passwordController = require('../controllers/passwordController');

router.post('/change', passwordController.changePassword);
router.post('/reset', passwordController.resetPassword);
router.post('/forgot', passwordController.forgotPassword);


module.exports = router;