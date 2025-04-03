const express = require('express');
const router = express.Router();
const { getBudgetCount, getUpvibhagCounts } = require('../controllers/budgetController');

// Route to get budget count
router.post('/count', getBudgetCount);

// Route to get Upvibhag counts from all budget tables
router.post('/upvibhag-counts', getUpvibhagCounts);

module.exports = router; 