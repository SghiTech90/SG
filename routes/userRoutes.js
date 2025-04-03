const express = require('express');
const router = express.Router();
const { login, verifyOTP, resendOTP, profile, buildingMPRreport, CrfMPRreport } = require('../controllers/userController');

// Route for login
router.post('/login', login);

// Route for OTP verification
router.post('/verify-otp', verifyOTP);

// Route for resending OTP
router.post('/resend-otp', resendOTP);

// Route for building MPR report
router.post('/buildingMPRreport', buildingMPRreport);

// Route for CRF MPR report
router.post('/CrfMPRreport', CrfMPRreport);

router.post('/profile', profile);

module.exports = router;