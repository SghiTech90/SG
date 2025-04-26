const { getPool, sql } = require("../config/db");

// Generic function to get all head report based on table names
const getAllHeadReport = async (
  req,
  res,
  masterTable,
  provisionTable,
  reportName
) => {
  try {
    const { office } = req.body; // 👈 changed from req.query to req.body

    if (!office) {
      return res.status(400).json({
        success: false,
        message: "office body parameter is required",
      });
    }

    const pool = await getPool(office);
    if (!pool) {
      throw new Error("Database pool is not available.");
    }

    const query = `
            SELECT 
                ROW_NUMBER() OVER(PARTITION BY a.[LekhaShirsh] ORDER BY a.[Upvibhag] ASC) as 'SrNo',
                a.[SubType],
                a.[U_WIN] as 'U_WIN',
                a.[LekhaShirsh] as 'lekhashirsh',
                a.[LekhaShirshName] as 'LekhaShirshName',
                a.[KamacheName] as kamachenaav,
                convert(nvarchar(max),a.[TrantrikAmt])+' '+convert(nvarchar(max), a.[TrantrikDate]) as tantrik,
                b.[MarchEndingExpn] as marchexpn,
                b.[AkunAnudan] as akndan,
                b.[AikunKharch] as aknkharch,
                b.[Magni] as Magni,
                b.[UrvaritAmt] as UrvaritAmt,
                CAST(CASE WHEN a.[Sadyasthiti] = N'पूर्ण'  THEN 1 ELSE 0 END as decimal(18,0)) as 'C',
                CAST(CASE WHEN a.[Sadyasthiti] = N'प्रगतीत'  THEN 1 ELSE 0 END as decimal(18,0)) as 'P',
                CAST(CASE WHEN a.[Sadyasthiti] = N'सुरू न झालेली'  THEN 1 ELSE 0 END as decimal(18,0)) as 'NS'
            FROM ${masterTable} as a 
            JOIN ${provisionTable} as b ON a.WorkID = b.WorkID 
            WHERE b.Arthsankalpiyyear = '2025-2026'
        `;

    const result = await pool
      .request()
      .query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error(`Error in ${reportName}:`, error);
    res.status(500).json({
      success: false,
      message: `Error fetching ${reportName} report`,
      error: error.message,
    });
  }
};

// Define specific report controllers using the generic function
const buildingAllHEAD = (req, res) =>
  getAllHeadReport(
    req,
    res,
    "BudgetMasterBuilding",
    "BuildingProvision",
    "buildingAllHEAD"
  );
  const AunnityAllHEAD = (req, res) =>
    getAllHeadReport(
      req,
      res,
      "BudgetMasterNABARD",
      "NABARDProvision",
      "AunnityAllHEAD"
    );
const CrfMPRreportAllHEAD = (req, res) =>
  getAllHeadReport(
    req,
    res,
    "BudgetMasterCRF",
    "CRFProvision",
    "CrfMPRreportAllHEAD"
  );
const DepositAllHead = (req, res) =>
  getAllHeadReport(
    req,
    res,
    "BudgetMasterDepositFund",
    "DepositFundProvision",
    "DepositAllHead"
  );
const DPDCAllHead = (req, res) =>
  getAllHeadReport(
    req,
    res,
    "BudgetMasterDPDC",
    "DPDCProvision",
    "DPDCAllHead"
  );
const MLAAllHEAD = (req, res) =>
  getAllHeadReport(req, res, "BudgetMasterMLA", "MLAProvision", "MLAAllHEAD");
const MPAllHEAD = (req, res) =>
  getAllHeadReport(req, res, "BudgetMasterMP", "MPProvision", "MPAllHEAD");
const NABARDAllHEAD = (req, res) =>
  getAllHeadReport(
    req,
    res,
    "BudgetMasterNABARD",
    "NABARDProvision",
    "NABARDAllHEAD"
  );
const ROADAllHEAD = (req, res) =>
  getAllHeadReport(
    req,
    res,
    "BudgetMasterRoad",
    "RoadProvision",
    "ROADAllHEAD"
  );
const GAT_A_AllHEAD = (req, res) =>
  getAllHeadReport(
    req,
    res,
    "BudgetMasterGAT_A",
    "GAT_AProvision",
    "GAT_A_AllHEAD"
  );
const GAT_D_AllHEAD = (req, res) =>
  getAllHeadReport(
    req,
    res,
    "BudgetMasterGAT_D",
    "GAT_DProvision",
    "GAT_D_AllHEAD"
  );
const GRAMVIKAS_AllHEAD = (req, res) =>
  getAllHeadReport(
    req,
    res,
    "BudgetMaster2515",
    "[2515Provision]",
    "GRAMVIKAS_AllHEAD"
  ); // Note: Schema bracket needed if table name has numbers

module.exports = {
  buildingAllHEAD,
  CrfMPRreportAllHEAD,
  DepositAllHead,
  DPDCAllHead,
  MLAAllHEAD,
  MPAllHEAD,
  NABARDAllHEAD,
  ROADAllHEAD,
  GAT_A_AllHEAD,
  GAT_D_AllHEAD,
  GRAMVIKAS_AllHEAD,
  AunnityAllHEAD
};
