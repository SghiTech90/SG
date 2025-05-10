const express = require("express");
const router = express.Router();
const {
  getBudgetCount,
  getUpvibhagCounts,
  getUniqueYears,
  getUniqueHeadNames,
  getBudgetSummaryByYear,
  getBudgetDetailsByYearAndHead,
  BudgetMaster2515,
  BudgetMasterNABARD,
  BudgetMasterMP,
  BudgetMasterMLA,
  BudgetMasterGAT_FBC,
  BudgetMasterGAT_D,
  BudgetMasterGAT_A,
  BudgetMasterDPDC,
  BudgetMasterDepositFund,
  BudgetMasterCRF,
  BudgetMasterBuilding,
  BudgetMasterAunty,
  BudgetMasterRoad,
  Cont2515,
  ContAnnuity,
  ContBuilding,
  ContNABARD,
  ContSHDOR,
  ContCRF,
  ContMLA,
  ContMP,
  ContDPDC,
  ContGAT_A,
  ContGAT_FBC,
  ContDepositFund,
  ContGAT_D,
  ContResidentialBuilding2216,
  ContNonResidentialBuilding2909,
  contractorGraph,
  ContractorBuildingReportApi,
  ContractorCRFReportApi,
  ContractorNabardReportApi,
  ContractorRoadReportApi,
  ContractorDPDCReportApi,
  ContractorAnnuityReportApi,
  ContractorBuildingUpdatePanelApi,
  ContractorCRFUpdatePanelApi,
  ContractorNABARDUpdatePanelApi,
  ContractorRoadUpdatePanelApi,
  ContractorAuntyUpdatePanelApi,
  DEBuildingUpdatePanelApi,
  DECRFUpdatePanelApi,
  DENABARDUpdatePanelApi,
  DERoadUpdatePanelApi,
  DEAuntyUpdatePanelApi,
  ContUpdPanelBuilding,
  ContUpdPanelCrf,
  ContUpdPanelNABARD,
  ContUpdPanelROAD,
  ContUpdPanelAunty
} = require("../controllers/budgetController");

// Route to get budget count
router.post("/count", getBudgetCount);
router.post("/contractorGraph", contractorGraph);

// Route to get Upvibhag counts from all budget tables
router.post("/upvibhag-counts", getUpvibhagCounts);

// Route to get unique years from provision tables
router.post("/unique-years", getUniqueYears); // Requires office

// Route to get unique head names from master tables
router.post("/unique-head-names", getUniqueHeadNames); // Requires office

// Route to get budget summary by year
router.post("/summary-by-year", getBudgetSummaryByYear); // Requires office, year

// Route to get budget details by year and head name
router.post("/details-by-year-head", getBudgetDetailsByYearAndHead); 

//Executive engineer
router.post("/BudgetMaster2515", BudgetMaster2515); 
router.post("/BudgetMasterNABARD", BudgetMasterNABARD); 
router.post("/BudgetMasterMP", BudgetMasterMP); 
router.post("/BudgetMasterMLA", BudgetMasterMLA); 
router.post("/BudgetMasterGAT_FBC", BudgetMasterGAT_FBC); 
router.post("/BudgetMasterGAT_D", BudgetMasterGAT_D); 
router.post("/BudgetMasterGAT_A", BudgetMasterGAT_A); 
router.post("/BudgetMasterDPDC", BudgetMasterDPDC); 
router.post("/BudgetMasterDepositFund", BudgetMasterDepositFund); 
router.post("/BudgetMasterCRF", BudgetMasterCRF); 
router.post("/BudgetMasterBuilding", BudgetMasterBuilding); 
router.post("/BudgetMasterAunty", BudgetMasterAunty); 
router.post("/BudgetMasterRoad", BudgetMasterRoad); 


//contractor post for abstract report
router.post("/Cont2515", Cont2515);
router.post("/ContAnnuity", ContAnnuity);
router.post("/ContBuilding", ContBuilding);
router.post("/ContNABARD", ContNABARD);
router.post("/ContSHDOR", ContSHDOR);
router.post("/ContCRF", ContCRF);
router.post("/ContMLA", ContMLA);
router.post("/ContMP", ContMP);
router.post("/ContDPDC", ContDPDC);
router.post("/ContGAT_A", ContGAT_A);
router.post("/ContGAT_FBC", ContGAT_FBC);
router.post("/ContDepositFund", ContDepositFund);
router.post("/ContGAT_D", ContGAT_D);
router.post("/ContResidentialBuilding2216", ContResidentialBuilding2216);
router.post("/ContNonResidentialBuilding2909", ContNonResidentialBuilding2909);

//contractor report page
router.post("/ContractorBuildingReportApi", ContractorBuildingReportApi);
router.post("/ContractorCRFReportApi", ContractorCRFReportApi); 
router.post("/ContractorNabardReportApi", ContractorNabardReportApi);
router.post("/ContractorRoadReportApi", ContractorRoadReportApi);
router.post("/ContractorDPDCReportApi", ContractorDPDCReportApi);
router.post("/ContractorAnnuityReportApi", ContractorAnnuityReportApi);

//contractor update report page
//बी.टी. देशमुख (contractor)
router.post("/ContractorBuildingUpdatePanelApi", ContractorBuildingUpdatePanelApi);
router.post("/ContractorCRFUpdatePanelApi", ContractorCRFUpdatePanelApi);
router.post("/ContractorNABARDUpdatePanelApi", ContractorNABARDUpdatePanelApi);
router.post("/ContractorRoadUpdatePanelApi", ContractorRoadUpdatePanelApi);
router.post("/ContractorAuntyUpdatePanelApi", ContractorAuntyUpdatePanelApi);
//श्री. आर.एल राठोड (DE) 
router.post("/DEBuildingUpdatePanelApi", DEBuildingUpdatePanelApi);
router.post("/DECRFUpdatePanelApi", DECRFUpdatePanelApi);
router.post("/DENABARDUpdatePanelApi", DENABARDUpdatePanelApi);
router.post("/DERoadUpdatePanelApi", DERoadUpdatePanelApi);
router.post("/DEAuntyUpdatePanelApi", DEAuntyUpdatePanelApi);

//Contractor Update Panel Select Queries
//--Contractor = मे.ए.एम.कोठारी // ShakhaAbhyantaName= श्री. पी एम घोडस्कर //  UpabhyantaName = श्री. पी एम घोडस्कर
router.post("/ContUpdPanelBuilding", ContUpdPanelBuilding);
router.post("/ContUpdPanelNABARD", ContUpdPanelNABARD);
router.post("/ContUpdPanelCRF", ContUpdPanelCrf);
router.post("/ContUpdPanelROAD", ContUpdPanelROAD);
router.post("/ContUpdPanelAunty", ContUpdPanelAunty);


module.exports = router;