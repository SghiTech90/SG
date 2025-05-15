const express = require("express");
const router = express.Router();
const {
  getUpcomingDueDates,
  AllgetUpcomingDueDates,
} = require("../controllers/notificationController");

// Route to get upcoming due dates (next 20 days)
router.post("/upcoming-due-dates", getUpcomingDueDates);
router.post("/all-upcoming-due-dates", AllgetUpcomingDueDates);

module.exports = router;
