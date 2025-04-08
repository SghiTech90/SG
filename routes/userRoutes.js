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

// Authentication & Modification Routes (POST)
router.post('/login', login); // Requires userId, password
router.post('/verify-otp', verifyOTP); // Requires userId, otp 
router.post('/resend-otp', resendOTP); // Requires userId
router.post('/profile', profile); // Requires userId 
router.post('/contractor-projects', getContractorProjects); // Requires contractorName

// Read-only Report Routes (GET)
// Year should be passed as a query parameter, e.g., /buildingMPRreport?year=2023-2024
router.get('/buildingMPRreport', buildingMPRreport); 
router.get('/CrfMPRreport', CrfMPRreport); 

module.exports = router;