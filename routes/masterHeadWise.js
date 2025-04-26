const express = require("express");
const router = express.Router();
const {
  BUILDINGHEADWISEREPORT,
  DPDCHEADWISEREPORT,
  SHDORHEADWISEREPORT,
  NABARDHEADWISEREPORT,
  CRFHEADWISEREPORT,
  MASTERHEADWISEREPOSTBuilding
} = require("../controllers/masterHeadWiseController");

// Route to get upcoming due dates (next 20 days)
router.post("/BUILDINGHEADWISEREPORT", BUILDINGHEADWISEREPORT);
router.post("/DPDCHEADWISEREPORT", DPDCHEADWISEREPORT);
router.post("/SHDORHEADWISEREPORT", SHDORHEADWISEREPORT);
router.post("/NABARDHEADWISEREPORT", NABARDHEADWISEREPORT);
router.post("/CRFHEADWISEREPORT", CRFHEADWISEREPORT);
router.post("/MASTERHEADWISEREPOSTBuilding", MASTERHEADWISEREPOSTBuilding);


module.exports = router;
