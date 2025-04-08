const express = require('express');
const router = express.Router();
const { 
    login, 
    verifyOTP, 
    resendOTP, 
    profile, 
    buildingMPRreport, 
    CrfMPRreport, 
    getContractorProjects 
} = require('../controllers/userController');

// All routes are POST and require 'office' in the body where applicable

router.post('/login', login); // Requires userId, password, office
router.post('/verify-otp', verifyOTP); // Requires userId, otp. Office context from otpStore.
router.post('/resend-otp', resendOTP); // Requires userId, office
router.post('/profile', profile); // Requires userId, office
router.post('/buildingMPRreport', buildingMPRreport); // Requires year, office
router.post('/CrfMPRreport', CrfMPRreport); // Requires year, office
router.post('/contractor-projects', getContractorProjects); // Requires contractorName, office

module.exports = router;