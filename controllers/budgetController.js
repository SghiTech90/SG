const { getPool, sql } = require("../config/db");
const axios = require("axios");
require("dotenv").config();

const wishbyApiKey = process.env.WISHBY_API_KEY;
const wishbySenderId = process.env.WISHBY_SENDER_ID;
const DLT_TEMPLATE_ID_DAY_UPDATE = process.env.DLT_ID_DAY_UPDATE || "1707174246372891167";

// Utility to send SMS via WishbySMS gateway
const sendSMS = async (mobileNo, message) => {
  try {
    if (!mobileNo) return { success: false, error: "Invalid mobile number" };

    const phoneNumber = mobileNo.startsWith("91") ? mobileNo : "91" + mobileNo;
    const encodedMessage = encodeURIComponent(message);

    let apiUrl = `https://login.wishbysms.com/api/sendhttp.php?authkey=${wishbyApiKey}&mobiles=${phoneNumber}&message=${encodedMessage}&sender=${wishbySenderId}&route=4&country=91`;

    if (DLT_TEMPLATE_ID_DAY_UPDATE) {
      apiUrl += `&DLT_TE_ID=${DLT_TEMPLATE_ID_DAY_UPDATE}`;
    }

    const response = await axios.get(apiUrl);
    return { success: true, response: response.data };
  } catch (error) {
    console.error("Error sending SMS:", error.message);
    return { success: false, error: error.message };
  }
};

// Helper function to get budget counts from a specific table
const getTableBudgetCount = async (pool, tableName) => {
  const query = `SELECT COUNT(*) as count FROM ${tableName}`;
  const result = await pool.request().query(query);
  return result.recordset[0].count;
};

// Get total budget count across all master tables
const getBudgetCount = async (req, res) => {
  const { office } = req.body;

  if (!office) {
    return res
      .status(400)
      .json({ success: false, message: "Office parameter is required" });
  }

  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    const tableQueries = [
      { table: "BudgetMasterBuilding", title: "Building" },
      { table: "BudgetMasterCRF", title: "CRF" },
      { table: "BudgetMasterAunty", title: "Annuity" },
      { table: "BudgetMasterNABARD", title: "NABARD" },
      { table: "BudgetMasterRoad", title: "ROAD" },
      { table: "BudgetMaster2515", title: "2515" },
      { table: "BudgetMasterDepositFund", title: "Deposit" },
      { table: "BudgetMasterDPDC", title: "DPDC" },
      { table: "BudgetMasterGAT_A", title: "AMC" },
      { table: "BudgetMasterGAT_D", title: "FDR" },
      { table: "BudgetMasterGAT_FBC", title: "BCR" },
      { table: "BudgetMasterMLA", title: "MLA" },
      { table: "BudgetMasterMP", title: "MP" },
      { table: "BudgetMasterNonResidentialBuilding", title: "2059" },
      { table: "BudgetMasterResidentialBuilding", title: "2216" },
    ];
    
    const resultsArray = [];

    for (const query of tableQueries) {
      try {
        const result = await pool
          .request()
          .query(`SELECT COUNT(*) as count FROM ${query.table}`);
        resultsArray.push({
          title: query.title,
          table: query.table,
          count: result.recordset[0].count,
        });
      } catch (error) {
        console.error(`Error querying table ${query.table}:`, error.message);
        resultsArray.push({
          title: query.title,
          table: query.table,
          count: 0,
          error: "Table may not exist or cannot be accessed",
        });
      }
    }

    res.json({ success: true, data: resultsArray });
  } catch (error) {
    console.error("Error getting budget counts:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Helper function to get Upvibhag counts from a specific table
const getTableUpvibhagCounts = async (pool, tableName) => {
  const query = `SELECT Upvibhag, COUNT(*) as count FROM ${tableName} GROUP BY Upvibhag`;
  const result = await pool.request().query(query);
  return result.recordset;
};

// Get Upvibhag counts aggregated across all master tables
const getUpvibhagCounts = async (req, res) => {
  const { office } = req.body;
  if (!office) {
    return res
      .status(400)
      .json({ success: false, message: "Office parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    const tables = [
      "BudgetMasterBuilding",
      "BudgetMasterCRF",
      "BudgetMasterAunty",
      "BudgetMasterDepositFund",
      "BudgetMasterDPDC",
      "BudgetMasterGAT_A",
      "BudgetMasterGAT_D",
      "BudgetMasterGAT_FBC",
      "BudgetMasterMLA",
      "BudgetMasterMP",
      "BudgetMasterNABARD",
      "BudgetMasterRoad",
      "BudgetMasterNonResidentialBuilding",
      "BudgetMasterResidentialBuilding",
      "BudgetMaster2515",
    ];

    const aggregatedCounts = {};

    for (const table of tables) {
      const results = await getTableUpvibhagCounts(pool, table);
      results.forEach((row) => {
        if (row.Upvibhag) {
          // Ensure Upvibhag is not null or empty
          aggregatedCounts[row.Upvibhag] =
            (aggregatedCounts[row.Upvibhag] || 0) + row.count;
        }
      });
    }

    // Convert aggregatedCounts object to an array of { Upvibhag, count }
    const responseData = Object.entries(aggregatedCounts).map(
      ([Upvibhag, count]) => ({ Upvibhag, count })
    );

    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error("Error getting Upvibhag counts:", error);
    res.status(500).json({
      success: false,
      message: "Error getting Upvibhag counts",
      error: error.message,
    });
  }
};

// Get Unique Years from Provision Tables
const getUniqueYears = async (req, res) => {
  const { office } = req.body;
  if (!office) {
    return res
      .status(400)
      .json({ success: false, message: "Office parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Query one provision table, adjust if needed
    const query = `SELECT DISTINCT Arthsankalpiyyear FROM BuildingProvision ORDER BY Arthsankalpiyyear DESC`;
    const result = await pool.request().query(query);
    const years = result.recordset.map((row) => row.Arthsankalpiyyear);
    res.json({ success: true, years });
  } catch (error) {
    console.error("Error getting unique years:", error);
    res.status(500).json({
      success: false,
      message: "Error getting unique years",
      error: error.message,
    });
  }
};

// Get Unique Head Names from Master Tables
const getUniqueHeadNames = async (req, res) => {
  const { office } = req.body;
  if (!office) {
    return res
      .status(400)
      .json({ success: false, message: "Office parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Query one master table, adjust if needed
    const query = `SELECT DISTINCT LekhaShirshName FROM BudgetMasterBuilding WHERE LekhaShirshName IS NOT NULL ORDER BY LekhaShirshName`;
    const result = await pool.request().query(query);
    const headNames = result.recordset.map((row) => row.LekhaShirshName);
    res.json({ success: true, headNames });
  } catch (error) {
    console.error("Error getting unique head names:", error);
    res.status(500).json({
      success: false,
      message: "Error getting unique head names",
      error: error.message,
    });
  }
};

// Get Budget Summary by Year (Aggregated)
const getBudgetSummaryByYear = async (req, res) => {
  const { office, year } = req.body;
  if (!office || !year) {
    return res.status(400).json({
      success: false,
      message: "Office and Year parameters are required",
    });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Aggregated query on Building tables, adjust as needed
    const query = `
            SELECT 
                m.LekhaShirshName, 
                COUNT(m.WorkID) AS WorkCount,
                SUM(p.Tartud) AS TotalTartud,
                SUM(p.AkunAnudan) AS TotalAnudan,
                SUM(p.AikunKharch) AS TotalKharch
            FROM BudgetMasterBuilding m
            JOIN BuildingProvision p ON m.WorkID = p.WorkID
            WHERE p.Arthsankalpiyyear = @year
            GROUP BY m.LekhaShirshName
            ORDER BY m.LekhaShirshName
        `;
    const result = await pool
      .request()
      .input("year", sql.VarChar, year)
      .query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting budget summary by year:", error);
    res.status(500).json({
      success: false,
      message: "Error getting budget summary by year",
      error: error.message,
    });
  }
};

// Get Budget Details by Year and Head Name
const getBudgetDetailsByYearAndHead = async (req, res) => {
  const { office, year, headName } = req.body;
  if (!office || !year || !headName) {
    return res.status(400).json({
      success: false,
      message: "Office, Year, and Head Name parameters are required",
    });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
            SELECT m.*, p.*
            FROM BudgetMasterBuilding m
            JOIN BuildingProvision p ON m.WorkID = p.WorkID
            WHERE p.Arthsankalpiyyear = @year AND m.LekhaShirshName = @headName
            ORDER BY m.WorkID;
        `;
    const result = await pool
      .request()
      .input("year", sql.VarChar, year)
      .input("headName", sql.NVarChar, headName) // Use NVarChar for head name
      .query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting budget details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting budget details",
      error: error.message,
    });
  }
};

const BudgetMasterAunty = async (req, res) => {
  const { office, position } = req.body;
  if (!office || !position) {
    return res
      .status(400)
      .json({ success: false, message: "Office parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'Estimated Cost',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'T.S Cost',sum(cast(b.[Tartud]as decimal(10,2))) as 'Budget Provision 2023-2024',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Expenditure 2023-2024' FROM BudgetMasterAunty a full outer join AuntyProvision  b on a.workid=b.workid and b.Arthsankalpiyyear='2023-2024' where a.[Sadyasthiti]IS NOT NULL GROUP BY a.[Sadyasthiti] order by case a.[Sadyasthiti] when N'पूर्ण' then 1 when N'Completed' then 1 when N'Incomplete' then 2 when N'अपूर्ण' then 2 when N'प्रगतीत' then 3 when N'Inprogress' then 3 when N'Processing' then 3 when N'Current' then 3 when N'चालू' then 3  when N'Tender Stage' then 4 when N'निविदा स्तर' then 4 when N'Estimated Stage' then 5 when N'अंदाजपत्रकिय स्थर' then 5 when N'अंदाजपत्रकीय स्तर' then 5 when N'Not Started' then 6 when N'सुरु न झालेली' then 6 when N'सुरू करणे' then 7 when N'' then 8 end`;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting BudgetMasterAunty details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting BudgetMasterAunty details",
      error: error.message,
    });
  }
};

const BudgetMasterBuilding = async (req, res) => {
  const { office, position } = req.body;
  if (!office || !position) {
    return res
      .status(400)
      .json({ success: false, message: "Office parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
          SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'Estimated Cost',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'T.S Cost',sum(cast(b.[Tartud]as decimal(10,2))) as 'Budget Provision 2023-2024',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Expenditure 2023-2024' FROM BudgetMasterBuilding a full outer join BuildingProvision  b on a.workid=b.workid and b.Arthsankalpiyyear='2023-2024' where a.[Sadyasthiti]IS NOT NULL  GROUP BY a.[Sadyasthiti] order by case a.[Sadyasthiti] when N'पूर्ण' then 1 when N'Completed' then 1 when N'Incomplete' then 2 when N'अपूर्ण' then 2 when N'प्रगतीत' then 3 when N'Inprogress' then 3 when N'Processing' then 3 when N'Current' then 3 when N'चालू' then 3  when N'Tender Stage' then 4 when N'निविदा स्तर' then 4 when N'Estimated Stage' then 5 when N'अंदाजपत्रकिय स्थर' then 5 when N'अंदाजपत्रकीय स्तर' then 5 when N'Not Started' then 6 when N'सुरु न झालेली' then 6 when N'सुरू करणे' then 7 when N'' then 8 end`;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting BudgetMasterBuilding details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting BudgetMasterBuilding details",
      error: error.message,
    });
  }
};

const BudgetMasterCRF = async (req, res) => {
  const { office, position } = req.body;
  if (!office || !position) {
    return res
      .status(400)
      .json({ success: false, message: "Office parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
          SELECT 
    a.[Sadyasthiti] AS 'Work Status',
    COUNT(a.[Sadyasthiti]) AS 'Total Work',
    SUM(CAST(a.[PrashaskiyAmt] AS DECIMAL(10, 2))) AS 'Estimated Cost',
    SUM(CAST(a.[TrantrikAmt] AS DECIMAL(10, 2))) AS 'T.S Cost',
    SUM(CAST(b.[Tartud] AS DECIMAL(10, 2))) AS 'Budget Provision 2023-2024',
    SUM(CAST(b.[AikunKharch] AS DECIMAL(10, 2))) AS 'Expenditure 2023-2024'
FROM BudgetMasterAunty a
FULL OUTER JOIN AuntyProvision b ON a.workid = b.workid AND b.Arthsankalpiyyear = '2023-2024'
WHERE a.[Sadyasthiti] IS NOT NULL
GROUP BY a.[Sadyasthiti]
ORDER BY CASE a.[Sadyasthiti]
    WHEN N'पूर्ण' THEN 1
    WHEN N'Completed' THEN 1
    WHEN N'अपूर्ण' THEN 2
    WHEN N'Incomplete' THEN 2
    WHEN N'प्रगतीत' THEN 3
    WHEN N'Inprogress' THEN 3
    WHEN N'Processing' THEN 3
    WHEN N'Current' THEN 3
    WHEN N'चालू' THEN 3
    WHEN N'Tender Stage' THEN 4
    WHEN N'निविदा स्तर' THEN 4
    WHEN N'Estimated Stage' THEN 5
    WHEN N'अंदाजपत्रकिय स्थर' THEN 5
    WHEN N'अंदाजपत्रकीय स्तर' THEN 5
    WHEN N'Not Started' THEN 6
    WHEN N'सुरु न झालेली' THEN 6
    WHEN N'सुरू करणे' THEN 7
    WHEN N'' THEN 8
    ELSE 9
END`;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting BudgetMasterCRF details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting BudgetMasterCRF details",
      error: error.message,
    });
  }
};

const BudgetMasterDepositFund = async (req, res) => {
  const { office, position } = req.body;
  if (!office || !position) {
    return res
      .status(400)
      .json({ success: false, message: "Office parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'Estimated Cost',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'T.S Cost',sum(cast(b.[Tartud]as decimal(10,2))) as 'Budget Provision 2023-2024',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Expenditure 2023-2024' FROM BudgetMasterDepositFund a full outer join DepositFundProvision  b on a.workid=b.workid and b.Arthsankalpiyyear='2023-2024' where a.[Sadyasthiti]IS NOT NULL   GROUP BY a.[Sadyasthiti] order by case a.[Sadyasthiti] when N'पूर्ण' then 1 when N'Completed' then 1 when N'Incomplete' then 2 when N'अपूर्ण' then 2 when N'प्रगतीत' then 3 when N'Inprogress' then 3 when N'Processing' then 3 when N'Current' then 3 when N'चालू' then 3  when N'Tender Stage' then 4 when N'निविदा स्तर' then 4 when N'Estimated Stage' then 5 when N'अंदाजपत्रकिय स्थर' then 5 when N'अंदाजपत्रकीय स्तर' then 5 when N'Not Started' then 6 when N'सुरु न झालेली' then 6 when N'सुरू करणे' then 7 when N'' then 8 end`;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting BudgetMasterDepositFund details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting BudgetMasterDepositFund details",
      error: error.message,
    });
  }
};

const BudgetMasterDPDC = async (req, res) => {
  const { office, position } = req.body;
  if (!office || !position) {
    return res
      .status(400)
      .json({ success: false, message: "Office parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
          SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'Estimated Cost',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'T.S Cost',sum(cast(b.[Tartud]as decimal(10,2))) as 'Budget Provision 2023-2024',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Expenditure 2023-2024' FROM BudgetMasterDPDC a full outer join DPDCProvision  b on a.workid=b.workid and b.Arthsankalpiyyear='2023-2024' where a.[Sadyasthiti]IS NOT NULL   GROUP BY a.[Sadyasthiti] order by case a.[Sadyasthiti] when N'पूर्ण' then 1 when N'Completed' then 1 when N'Incomplete' then 2 when N'अपूर्ण' then 2 when N'प्रगतीत' then 3 when N'Inprogress' then 3 when N'Processing' then 3 when N'Current' then 3 when N'चालू' then 3  when N'Tender Stage' then 4 when N'निविदा स्तर' then 4 when N'Estimated Stage' then 5 when N'अंदाजपत्रकिय स्थर' then 5 when N'अंदाजपत्रकीय स्तर' then 5 when N'Not Started' then 6 when N'सुरु न झालेली' then 6 when N'सुरू करणे' then 7 when N'' then 8 end`;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting BudgetMasterDPDC details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting BudgetMasterDPDC details",
      error: error.message,
    });
  }
};

const BudgetMasterGAT_A = async (req, res) => {
  const { office, position } = req.body;
  if (!office || !position) {
    return res
      .status(400)
      .json({ success: false, message: "Office parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'Estimated Cost',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'T.S Cost',sum(cast(b.[Tartud]as decimal(10,2))) as 'Budget Provision 2023-2024',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Expenditure 2023-2024' FROM BudgetMasterGAT_A a full outer join GAT_AProvision  b on a.workid=b.workid and b.Arthsankalpiyyear='2023-2024' where a.[Sadyasthiti]IS NOT NULL    GROUP BY a.[Sadyasthiti] order by case a.[Sadyasthiti] when N'पूर्ण' then 1 when N'Completed' then 1 when N'Incomplete' then 2 when N'अपूर्ण' then 2 when N'प्रगतीत' then 3 when N'Inprogress' then 3 when N'Processing' then 3 when N'Current' then 3 when N'चालू' then 3  when N'Tender Stage' then 4 when N'निविदा स्तर' then 4 when N'Estimated Stage' then 5 when N'अंदाजपत्रकिय स्थर' then 5 when N'अंदाजपत्रकीय स्तर' then 5 when N'Not Started' then 6 when N'सुरु न झालेली' then 6 when N'सुरू करणे' then 7 when N'' then 8 end`;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting BudgetMasterGAT_A details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting BudgetMasterGAT_A details",
      error: error.message,
    });
  }
};

const BudgetMasterGAT_D = async (req, res) => {
  const { office, position } = req.body;
  if (!office || !position) {
    return res
      .status(400)
      .json({ success: false, message: "Office parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'Estimated Cost',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'T.S Cost',sum(cast(b.[Tartud]as decimal(10,2))) as 'Budget Provision 2023-2024',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Expenditure 2023-2024' FROM BudgetMasterGAT_D a full outer join GAT_DProvision  b on a.workid=b.workid and b.Arthsankalpiyyear='2023-2024' where a.[Sadyasthiti]IS NOT NULL   GROUP BY a.[Sadyasthiti] order by case a.[Sadyasthiti] when N'पूर्ण' then 1 when N'Completed' then 1 when N'Incomplete' then 2 when N'अपूर्ण' then 2 when N'प्रगतीत' then 3 when N'Inprogress' then 3 when N'Processing' then 3 when N'Current' then 3 when N'चालू' then 3  when N'Tender Stage' then 4 when N'निविदा स्तर' then 4 when N'Estimated Stage' then 5 when N'अंदाजपत्रकिय स्थर' then 5 when N'अंदाजपत्रकीय स्तर' then 5 when N'Not Started' then 6 when N'सुरु न झालेली' then 6 when N'सुरू करणे' then 7 when N'' then 8 end`;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting BudgetMasterGAT_D details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting BudgetMasterGAT_D details",
      error: error.message,
    });
  }
};

const BudgetMasterGAT_FBC = async (req, res) => {
  const { office, position } = req.body;
  if (!office || !position) {
    return res
      .status(400)
      .json({ success: false, message: "Office parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'Estimated Cost',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'T.S Cost',sum(cast(b.[Tartud]as decimal(10,2))) as 'Budget Provision 2023-2024',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Expenditure 2023-2024' FROM BudgetMasterGAT_FBC a full outer join GAT_FBCProvision  b on a.workid=b.workid and b.Arthsankalpiyyear='2023-2024' where a.[Sadyasthiti]IS NOT NULL    GROUP BY a.[Sadyasthiti] order by case a.[Sadyasthiti] when N'पूर्ण' then 1 when N'Completed' then 1 when N'Incomplete' then 2 when N'अपूर्ण' then 2 when N'प्रगतीत' then 3 when N'Inprogress' then 3 when N'Processing' then 3 when N'Current' then 3 when N'चालू' then 3  when N'Tender Stage' then 4 when N'निविदा स्तर' then 4 when N'Estimated Stage' then 5 when N'अंदाजपत्रकिय स्थर' then 5 when N'अंदाजपत्रकीय स्तर' then 5 when N'Not Started' then 6 when N'सुरु न झालेली' then 6 when N'सुरू करणे' then 7 when N'' then 8 end`;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting BudgetMasterGAT_FBC details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting BudgetMasterGAT_FBC details",
      error: error.message,
    });
  }
};

const BudgetMaster2515 = async (req, res) => {
  const { office, position } = req.body;
  if (!office || !position) {
    return res
      .status(400)
      .json({ success: false, message: "Office parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
          SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'Estimated Cost',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'T.S Cost',sum(cast(b.[Tartud]as decimal(10,2))) as 'Budget Provision 2023-2024',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Expenditure 2023-2024' FROM [BudgetMaster2515] a full outer join [2515Provision]  b on a.workid=b.workid and b.Arthsankalpiyyear='2023-2024' where a.[Sadyasthiti]IS NOT NULL   GROUP BY a.[Sadyasthiti] order by case a.[Sadyasthiti] when N'पूर्ण' then 1 when N'Completed' then 1 when N'Incomplete' then 2 when N'अपूर्ण' then 2 when N'प्रगतीत' then 3 when N'Inprogress' then 3 when N'Processing' then 3 when N'Current' then 3 when N'चालू' then 3  when N'Tender Stage' then 4 when N'निविदा स्तर' then 4 when N'Estimated Stage' then 5 when N'अंदाजपत्रकिय स्थर' then 5 when N'अंदाजपत्रकीय स्तर' then 5 when N'Not Started' then 6 when N'सुरु न झालेली' then 6 when N'सुरू करणे' then 7 when N'' then 8 end`;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting BudgetMaster2515 details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting BudgetMaster2515 details",
      error: error.message,
    });
  }
};

const BudgetMasterMLA = async (req, res) => {
  const { office, position } = req.body;
  if (!office || !position) {
    return res
      .status(400)
      .json({ success: false, message: "Office parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'Estimated Cost',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'T.S Cost',sum(cast(b.[Tartud]as decimal(10,2))) as 'Budget Provision 2023-2024',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Expenditure 2023-2024' FROM BudgetMasterMLA a full outer join MLAProvision  b on a.workid=b.workid and b.Arthsankalpiyyear='2023-2024' where a.[Sadyasthiti]IS NOT NULL   GROUP BY a.[Sadyasthiti] order by case a.[Sadyasthiti] when N'पूर्ण' then 1 when N'Completed' then 1 when N'Incomplete' then 2 when N'अपूर्ण' then 2 when N'प्रगतीत' then 3 when N'Inprogress' then 3 when N'Processing' then 3 when N'Current' then 3 when N'चालू' then 3  when N'Tender Stage' then 4 when N'निविदा स्तर' then 4 when N'Estimated Stage' then 5 when N'अंदाजपत्रकिय स्थर' then 5 when N'अंदाजपत्रकीय स्तर' then 5 when N'Not Started' then 6 when N'सुरु न झालेली' then 6 when N'सुरू करणे' then 7 when N'' then 8 end`;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting BudgetMasterMLA  details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting BudgetMasterMLA  details",
      error: error.message,
    });
  }
};

const BudgetMasterMP = async (req, res) => {
  const { office, position } = req.body;
  if (!office || !position) {
    return res
      .status(400)
      .json({ success: false, message: "Office parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'Estimated Cost',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'T.S Cost',sum(cast(b.[Tartud]as decimal(10,2))) as 'Budget Provision 2023-2024',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Expenditure 2023-2024' FROM BudgetMasterMP a full outer join MPProvision  b on a.workid=b.workid and b.Arthsankalpiyyear='2023-2024' where a.[Sadyasthiti]IS NOT NULL   GROUP BY a.[Sadyasthiti] order by case a.[Sadyasthiti] when N'पूर्ण' then 1 when N'Completed' then 1 when N'Incomplete' then 2 when N'अपूर्ण' then 2 when N'प्रगतीत' then 3 when N'Inprogress' then 3 when N'Processing' then 3 when N'Current' then 3 when N'चालू' then 3  when N'Tender Stage' then 4 when N'निविदा स्तर' then 4 when N'Estimated Stage' then 5 when N'अंदाजपत्रकिय स्थर' then 5 when N'अंदाजपत्रकीय स्तर' then 5 when N'Not Started' then 6 when N'सुरु न झालेली' then 6 when N'सुरू करणे' then 7 when N'' then 8 end`;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting BudgetMaster2515 details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting BudgetMaster2515 details",
      error: error.message,
    });
  }
};

const BudgetMasterRoad = async (req, res) => {
  const { office, position } = req.body;
  if (!office || !position) {
    return res
      .status(400)
      .json({ success: false, message: "Office and Positon parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
    SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'Estimated Cost',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'T.S Cost',sum(cast(b.[Tartud]as decimal(10,2))) as 'Budget Provision 2025-2026',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Expenditure 2025-2026' FROM BudgetMasterRoad a full outer join RoadProvision  b on a.workid=b.workid where a.[Sadyasthiti]IS NOT NULL and b.Arthsankalpiyyear='2025-2026'   GROUP BY a.[Sadyasthiti] order by case a.[Sadyasthiti] when N'पूर्ण' then 1 when N'Completed' then 1 when N'Incomplete' then 2 when N'अपूर्ण' then 2 when N'प्रगतीत' then 3 when N'Inprogress' then 3 when N'Processing' then 3 when N'Current' then 3 when N'चालू' then 3  when N'Tender Stage' then 4 when N'निविदा स्तर' then 4 when N'Estimated Stage' then 5 when N'अंदाजपत्रकिय स्थर' then 5 when N'अंदाजपत्रकीय स्तर' then 5 when N'Not Started' then 6 when N'सुरु न झालेली' then 6 when N'सुरू करणे' then 7 when N'' then 8 end`;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting BudgetMaster2515 details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting BudgetMaster2515 details",
      error: error.message,
    });
  }
};

const BudgetMasterNABARD = async (req, res) => {
  const { office, position } = req.body;
  if (!office || !position) {
    return res
      .status(400)
      .json({ success: false, message: "Office parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
      SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'Estimated Cost',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'T.S Cost',sum(cast(b.[Tartud]as decimal(10,2))) as 'Budget Provision 2023-2024',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Expenditure 2023-2024' FROM BudgetMasterNABARD a full outer join NABARDProvision  b on a.workid=b.workid and b.Arthsankalpiyyear='2023-2024' where a.[Sadyasthiti]IS NOT NULL    GROUP BY a.[Sadyasthiti] order by case a.[Sadyasthiti] when N'पूर्ण' then 1 when N'Completed' then 1 when N'Incomplete' then 2 when N'अपूर्ण' then 2 when N'प्रगतीत' then 3 when N'Inprogress' then 3 when N'Processing' then 3 when N'Current' then 3 when N'चालू' then 3  when N'Tender Stage' then 4 when N'निविदा स्तर' then 4 when N'Estimated Stage' then 5 when N'अंदाजपत्रकिय स्थर' then 5 when N'अंदाजपत्रकीय स्तर' then 5 when N'Not Started' then 6 when N'सुरु न झालेली' then 6 when N'सुरू करणे' then 7 when N'' then 8 end`;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting BudgetMasterNABARD details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting BudgetMasterNABARD details",
      error: error.message,
    });
  }
};


//contractor
const Cont2515 = async (req, res) => {
  const { office, position, post, name } = req.body;
  if (!office || !position || !post || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
      SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'AA cost Rs in lakhs',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'Technical Sanction Cost Rs in Lakh',sum(cast(b.[Tartud]as decimal(10,2))) as 'Total Provision Rs in Lakh',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Total Expense Rs in Lakh' FROM [BudgetMaster2515] a full outer join [2515Provision]  b on a.workid=b.workid where a.[Sadyasthiti]!='' and ThekedaarName=@name and b.Arthsankalpiyyear='2023-2024' GROUP BY a.[Sadyasthiti]`;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting Cont2515 details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting Cont2515 details",
      error: error.message,
    });
  }
};

const ContAnnuity = async (req, res) => {
  const { office, position, post, name } = req.body;
  if (!office || !position || !post || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
      SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'AA cost Rs in lakhs',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'Technical Sanction Cost Rs in Lakh',sum(cast(b.[Tartud]as decimal(10,2))) as 'Total Provision Rs in Lakh',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Total Expense Rs in Lakh' FROM BudgetMasterAunty a full outer join AuntyProvision  b on a.workid=b.workid where a.[Sadyasthiti]!='' and ThekedaarName=@name and b.Arthsankalpiyyear='2023-2024' GROUP BY a.[Sadyasthiti]`;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting ContAnnuity details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting ContAnnuity details",
      error: error.message,
    });
  }
};

const ContBuilding = async (req, res) => {
  const { office, position, post, name } = req.body;
  if (!office || !position || !post || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
      SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'AA cost Rs in lakhs',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'Technical Sanction Cost Rs in Lakh',sum(cast(b.[Tartud]as decimal(10,2))) as 'Total Provision Rs in Lakh',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Total Expense Rs in Lakh' FROM BudgetMasterBuilding  a full outer join BuildingProvision  b on a.workid=b.workid where a.[Sadyasthiti]!='' and ThekedaarName=@name and b.Arthsankalpiyyear='2023-2024' GROUP BY a.[Sadyasthiti]`;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting ContBuilding details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting ContBuilding details",
      error: error.message,
    });
  }
};

const ContNABARD = async (req, res) => {
  const { office, position, post, name } = req.body;
  if (!office || !position || !post || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
      SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'AA cost Rs in lakhs',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'Technical Sanction Cost Rs in Lakh',sum(cast(b.[Tartud]as decimal(10,2))) as 'Total Provision Rs in Lakh',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Total Expense Rs in Lakh' FROM BudgetMasterNABARD  a full outer join NABARDProvision  b on a.workid=b.workid where a.[Sadyasthiti]!='' and ThekedaarName=@name and b.Arthsankalpiyyear='2023-2024' GROUP BY a.[Sadyasthiti]`;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting ContNABARD details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting ContNABARD details",
      error: error.message,
    });
  }
};

const ContSHDOR = async (req, res) => {
  const { office, position, post, name } = req.body;
  if (!office || !position || !post || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
      SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'AA cost Rs in lakhs',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'Technical Sanction Cost Rs in Lakh',sum(cast(b.[Tartud]as decimal(10,2))) as 'Total Provision Rs in Lakh',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Total Expense Rs in Lakh' FROM BudgetMasterRoad  a full outer join RoadProvision  b on a.workid=b.workid where a.[Sadyasthiti]!='' and ThekedaarName=@name and b.Arthsankalpiyyear='2023-2024' GROUP BY a.[Sadyasthiti]`;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting ContSHDOR details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting ContSHDOR details",
      error: error.message,
    });
  }
};

const ContCRF = async (req, res) => {
  const { office, position, post, name } = req.body;
  if (!office || !position || !post || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
      SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'AA cost Rs in lakhs',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'Technical Sanction Cost Rs in Lakh',sum(cast(b.[Tartud]as decimal(10,2))) as 'Total Provision Rs in Lakh',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Total Expense Rs in Lakh' FROM BudgetMasterCRF  a full outer join CRFProvision  b on a.workid=b.workid where a.[Sadyasthiti]!='' and ThekedaarName=@name and b.Arthsankalpiyyear='2023-2024' GROUP BY a.[Sadyasthiti]`;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting ContCRF details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting ContCRF details",
      error: error.message,
    });
  }
};

const ContMLA = async (req, res) => {
  const { office, position, post, name } = req.body;
  if (!office || !position || !post || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
      SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'AA cost Rs in lakhs',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'Technical Sanction Cost Rs in Lakh',sum(cast(b.[Tartud]as decimal(10,2))) as 'Total Provision Rs in Lakh',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Total Expense Rs in Lakh' FROM BudgetMasterMLA   a full outer join MLAProvision  b on a.workid=b.workid where a.[Sadyasthiti]!='' and ThekedaarName=@name and b.Arthsankalpiyyear='2023-2024' GROUP BY a.[Sadyasthiti]`;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting ContMLA details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting ContMLA details",
      error: error.message,
    });
  }
};

const ContMP = async (req, res) => {
  const { office, position, post, name } = req.body;
  if (!office || !position || !post || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
      SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'AA cost Rs in lakhs',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'Technical Sanction Cost Rs in Lakh',sum(cast(b.[Tartud]as decimal(10,2))) as 'Total Provision Rs in Lakh',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Total Expense Rs in Lakh' FROM BudgetMasterMP  a full outer join MPProvision  b on a.workid=b.workid where a.[Sadyasthiti]!='' and ThekedaarName=@name and b.Arthsankalpiyyear='2023-2024' GROUP BY a.[Sadyasthiti]`;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting ContMP details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting ContMP details",
      error: error.message,
    });
  }
};

const ContDPDC = async (req, res) => {
  const { office, position, post, name } = req.body;
  if (!office || !position || !post || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
      SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'AA cost Rs in lakhs',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'Technical Sanction Cost Rs in Lakh',sum(cast(b.[Tartud]as decimal(10,2))) as 'Total Provision Rs in Lakh',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Total Expense Rs in Lakh' FROM BudgetMasterDPDC  a full outer join DPDCProvision  b on a.workid=b.workid where a.[Sadyasthiti]!='' and ThekedaarName=@name and b.Arthsankalpiyyear='2023-2024' GROUP BY a.[Sadyasthiti]`;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting ContDPDC details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting ContDPDC details",
      error: error.message,
    });
  }
};

const ContGAT_A = async (req, res) => {
  const { office, position, post, name } = req.body;
  if (!office || !position || !post || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
     SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'AA cost Rs in lakhs',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'Technical Sanction Cost Rs in Lakh',sum(cast(b.[Tartud]as decimal(10,2))) as 'Total Provision Rs in Lakh',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Total Expense Rs in Lakh' FROM BudgetMasterGAT_A  a full outer join GAT_AProvision  b on a.workid=b.workid where a.[Sadyasthiti]!='' and ThekedaarName=@name and b.Arthsankalpiyyear='2023-2024' GROUP BY a.[Sadyasthiti]`;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting ContGAT_A details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting ContGAT_A details",
      error: error.message,
    });
  }
};

const ContGAT_FBC = async (req, res) => {
  const { office, position, post, name } = req.body;
  if (!office || !position || !post || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
      SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'AA cost Rs in lakhs',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'Technical Sanction Cost Rs in Lakh',sum(cast(b.[Tartud]as decimal(10,2))) as 'Total Provision Rs in Lakh',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Total Expense Rs in Lakh' FROM BudgetMasterGAT_FBC a full outer join GAT_FBCProvision  b on a.workid=b.workid where a.[Sadyasthiti]!='' and ThekedaarName=@name and b.Arthsankalpiyyear='2023-2024' GROUP BY a.[Sadyasthiti]`;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting ContGAT_FBC details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting ContGAT_FBC details",
      error: error.message,
    });
  }
};

const ContDepositFund = async (req, res) => {
  const { office, position, post, name } = req.body;
  if (!office || !position || !post || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
      SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'AA cost Rs in lakhs',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'Technical Sanction Cost Rs in Lakh',sum(cast(b.[Tartud]as decimal(10,2))) as 'Total Provision Rs in Lakh',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Total Expense Rs in Lakh' FROM BudgetMasterDepositFund  a full outer join DepositFundProvision  b on a.workid=b.workid where a.[Sadyasthiti]!='' and ThekedaarName=@name and b.Arthsankalpiyyear='2023-2024' GROUP BY a.[Sadyasthiti]`;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting ContDepositFund details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting ContDepositFund details",
      error: error.message,
    });
  }
};

const ContGAT_D = async (req, res) => {
  const { office, position, post, name } = req.body;
  if (!office || !position || !post || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
      SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'AA cost Rs in lakhs',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'Technical Sanction Cost Rs in Lakh',sum(cast(b.[Tartud]as decimal(10,2))) as 'Total Provision Rs in Lakh',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Total Expense Rs in Lakh' FROM BudgetMasterGAT_D  a full outer join GAT_DProvision  b on a.workid=b.workid where a.[Sadyasthiti]!='' and ThekedaarName=@name and b.Arthsankalpiyyear='2023-2024' GROUP BY a.[Sadyasthiti]`;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting ContGAT_D details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting ContGAT_D details",
      error: error.message,
    });
  }
};

const ContResidentialBuilding2216 = async (req, res) => {
  const { office, position, post, name } = req.body;
  if (!office || !position || !post || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
      SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'AA cost Rs in lakhs',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'Technical Sanction Cost Rs in Lakh',sum(cast(b.[Tartud]as decimal(10,2))) as 'Total Provision Rs in Lakh',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Total Expense Rs in Lakh' FROM BudgetMasterResidentialBuilding  a full outer join ResidentialBuildingProvision  b on a.workid=b.workid where a.[Sadyasthiti]!='' and ThekedaarName=@name and b.Arthsankalpiyyear='2023-2024' GROUP BY a.[Sadyasthiti]`;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting ContResidentialBuilding2216 details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting ContResidentialBuilding2216 details",
      error: error.message,
    });
  }
};

const ContNonResidentialBuilding2909 = async (req, res) => {
  const { office, position, post, name } = req.body;
  if (!office || !position || !post || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'AA cost Rs in lakhs',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'Technical Sanction Cost Rs in Lakh',sum(cast(b.[Tartud]as decimal(10,2))) as 'Total Provision Rs in Lakh',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Total Expense Rs in Lakh' FROM BudgetMasterNonResidentialBuilding  a full outer join NonResidentialBuildingProvision  b on a.workid=b.workid where a.[Sadyasthiti]!='' and ThekedaarName=@name and b.Arthsankalpiyyear='2025-2026' GROUP BY a.[Sadyasthiti]`;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(
      "Error getting ContNonResidentialBuilding2909 details:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error getting ContNonResidentialBuilding2909 details",
      error: error.message,
    });
  }
};

const contractorGraph = async (req, res) => {
  const { office, position, name } = req.body;
  if (!office || !position || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
select  (select  count(*) from BudgetMasterBuilding where ThekedaarName=@name group by ThekedaarName )as Building ,(select  count(*) from  BudgetMasterCRF where ThekedaarName=@name group by ThekedaarName )as CRF ,(select  count(*) from BudgetMasterAunty where ThekedaarName=@name group by ThekedaarName  )as Annuity,(select  count(*) from BudgetMasterDepositFund where ThekedaarName=@name group by ThekedaarName )as Deposit, (select  count(*) from  BudgetMasterDPDC where ThekedaarName=@name group by ThekedaarName )as DPDC , (select  count(*) from  BudgetMasterGAT_A where ThekedaarName=@name group by ThekedaarName )as Gat_A , (select  count(*) from  BudgetMasterGAT_D where ThekedaarName=@name group by ThekedaarName )as Gat_D , (select  count(*) from  BudgetMasterGAT_FBC where ThekedaarName=@name group by ThekedaarName  ) as Gat_BCF, (select  count(*) from  BudgetMasterMLA where ThekedaarName=@name group by ThekedaarName  )as MLA , (select  count(*) from  BudgetMasterMP where ThekedaarName=@name group by ThekedaarName ) as MP, (select  count(*) from  BudgetMasterNABARD where ThekedaarName=@name group by ThekedaarName )as Nabard , (select  count(*) from  BudgetMasterRoad where ThekedaarName=@name group by ThekedaarName )as Road , (select  count(*) from  BudgetMasterNonResidentialBuilding where ThekedaarName=@name group by ThekedaarName )as NRB2059 , (select  count(*) from  BudgetMasterResidentialBuilding where ThekedaarName=@name group by ThekedaarName )as RB2216  , (select count(*) from [BudgetMaster2515] where ThekedaarName=@name group by ThekedaarName )as GramVikas 
      `;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(
      "Error getting contractorGraph details:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error getting contractorGraph details",
      error: error.message,
    });
  }
};

const ContractorBuildingReportApi = async (req, res) => {
  const { office, post, year, name } = req.body;
  
  if (!office || !post || !year || !name) {
    return res.status(400).json({ success: false, message: "parameter is required" });
  }
  
  try {
    const pool = await getPool(office);
    if (!pool) throw new Error(`Database pool is not available for office ${office}.`);
    
    const query = `
    SELECT 
      ROW_NUMBER() OVER(PARTITION BY a.[LekhaShirshName] ORDER BY a.[LekhaShirshName],a.[Arthsankalpiyyear],a.[upvibhag]) as 'अ क्र', 
      a.[WorkId] as 'वर्क आयडी',
      a.[U_WIN] as 'U_WIN',
      a.[Arthsankalpiyyear] as 'अर्थसंकल्पीय वर्ष',
      a.[KamacheName] as 'कामाचे नाव',
      a.[LekhaShirshName] as 'लेखाशीर्ष नाव',
      a.[SubType] as 'विभाग',
      a.[Upvibhag] as 'उपविभाग',
      a.[Taluka] as 'तालुका',
      a.[ArthsankalpiyBab] as 'अर्थसंकल्पीय बाब',
      convert(nvarchar(max),a.[ShakhaAbhyantaName])+' '+convert(nvarchar(max),a.[ShakhaAbhiyantMobile]) as 'शाखा अभियंता नाव',
      convert(nvarchar(max),a.[UpabhyantaName])+' '+convert(nvarchar(max),a.[UpAbhiyantaMobile]) as 'उपअभियंता नाव',
      a.[AmdaracheName] as 'आमदारांचे नाव',
      a.[KhasdaracheName] as 'खासदारांचे नाव',
      convert(nvarchar(max),a.[ThekedaarName])+' '+convert(nvarchar(max),a.[ThekedarMobile]) as 'ठेकेदार नाव',
      convert(nvarchar(max),a.[PrashaskiyKramank])+' '+convert(nvarchar(max),a.[PrashaskiyAmt])+' '+convert(nvarchar(max),a.[PrashaskiyDate])as 'प्रशासकीय मान्यता क्र/रक्कम/दिनांक',
      convert(nvarchar(max),a.[TrantrikKrmank])+' '+convert(nvarchar(max),a.[TrantrikAmt])+' '+convert(nvarchar(max),a.[TrantrikDate])as 'तांत्रिक मान्यता क्र/रक्कम/दिनांक',
      a.[Kamachevav] as 'कामाचा वाव',
      convert(nvarchar(max),a.[NividaKrmank])+' '+convert(nvarchar(max),a.[NividaDate])as 'कार्यारंभ आदेश',
      cast(CASE WHEN ISNUMERIC(a.[NividaAmt]) = 1 THEN CAST(a.[NividaAmt] AS DECIMAL(10, 2)) ELSE 0 END AS DECIMAL(10, 2)) as 'निविदा रक्कम % कमी / जास्त',
      a.[kamachiMudat] as 'बांधकाम कालावधी',
      a.[KamPurnDate] as 'काम पूर्ण तारीख',
      CAST(CASE WHEN b.[MudatVadhiDate] = ' ' or b.[MudatVadhiDate] = '0' THEN N'होय' ELSE N'नाही' END as nvarchar(max)) as 'मुदतवाढ बाबत',
      b.[ManjurAmt] as 'मंजूर अंदाजित किंमत',
      b.[MarchEndingExpn] as 'मार्च अखेर खर्च 2021',
      b.[UrvaritAmt] as 'उर्वरित किंमत',
      b.[Chalukharch] as 'चालु खर्च',
      b.[Magilkharch] as 'मागील खर्च',
      b.[VarshbharatilKharch] as 'सन ${year}-${Number(year) + 1} मधील माहे एप्रिल/मे अखेरचा खर्च',
      b.[AikunKharch] as 'एकुण कामावरील खर्च',
      b.[Takunone] as 'प्रथम तिमाही तरतूद',
      b.[Takuntwo] as 'द्वितीय तिमाही तरतूद',
      b.[Takunthree] as 'तृतीय तिमाही तरतूद',
      b.[Takunfour] as 'चतुर्थ तिमाही तरतूद',
      b.[Tartud]as 'अर्थसंकल्पीय तरतूद',
      b.[AkunAnudan] as 'वितरित तरतूद',
      b.[Magni] as 'मागणी',
      b.[Vidyutprama] as 'विद्युतीकरणावरील प्रमा',
      b.[Vidyutvitarit] as 'विद्युतीकरणावरील वितरित',
      b.[Itarkhrch] as 'इतर खर्च',
      b.[Dviguni] as 'दवगुनी ज्ञापने',
      a.[Pahanikramank] as 'पाहणी क्रमांक',
      a.[PahaniMudye] as 'पाहणीमुद्ये',
      b.[DeyakachiSadyasthiti] as 'देयकाची सद्यस्थिती',
      convert(nvarchar(max),a.[Sadyasthiti])+' '+convert(nvarchar(max),a.[Shera]) as 'शेरा',
      b.[Apr] as 'Apr',
      b.[May] as 'May',
      b.[Jun] as 'Jun',
      b.[Jul] as 'Jul',
      b.[Aug] as 'Aug',
      b.[Sep] as 'Sep',
      b.[Oct] as 'Oct',
      b.[Nov] as 'Nov',
      b.[Dec] as 'Dec',
      b.[Jan] as 'Jan',
      b.[Feb] as 'Feb',
      b.[Mar] as 'Mar'
    from BudgetMasterBuilding as a 
    join BuildingProvision as b on a.WorkId=b.WorkId
    where a.[ThekedaarName]=@name and b.[Arthsankalpiyyear]=@year
    
    UNION
    
    select 
      isNULL ('','')as'अ क्र', 
      'Total' as 'वर्क आयडी',
      isNULL ('','') as 'U_WIN',
      isNULL ('Total','') as 'अर्थसंकल्पीय वर्ष',
      isNULL ('','') as 'कामाचे नाव',
      isNULL (a.[LekhaShirshName],'') as 'लेखाशीर्ष नाव',
      isNULL ('','') as 'विभाग',
      isNULL ('','') as 'उपविभाग',
      isNULL ('','0') as 'तालुका',
      isNULL ('','') as 'अर्थसंकल्पीय बाब',
      isNULL ('','') as 'शाखा अभियंता नाव',
      isNULL ('','') as 'उपअभियंता नाव',
      isNULL ('','') as 'आमदारांचे नाव',
      isNULL ('','') as 'खासदारांचे नाव',
      isNULL ('','') as 'ठेकेदार नाव',
      isNULL ('','') as 'प्रशासकीय मान्यता क्र/रक्कम/दिनांक',
      isNULL ('','') as 'तांत्रिक मान्यता क्र/रक्कम/दिनांक ',
      isNULL ('','') as 'कामाचा वाव',
      isNULL ('','') as 'कार्यारंभ आदेश',
      sum(cast(CASE WHEN ISNUMERIC(a.[NividaAmt]) = 1 THEN CAST(a.[NividaAmt] AS DECIMAL(10, 2)) ELSE 0 END AS DECIMAL(10, 2)))  as 'निविदा रक्कम % कमी / जास्त',
      isNULL ('','') as 'बांधकाम कालावधी',
      isNULL ('','') as 'काम पूर्ण तारीख',
      isNULL ('','') as 'मुदतवाढ बाबत',
      sum(b.[ManjurAmt]) as 'मंजूर अंदाजित किंमत',
      sum(b.[MarchEndingExpn])as 'मार्च अखेर खर्च 2021',
      sum(b.[UrvaritAmt]) as 'उर्वरित किंमत',
      sum(b.[Chalukharch])as 'चालु खर्च',
      sum(b.[Magilkharch])as 'मागील खर्च',
      sum(b.[VarshbharatilKharch]) as 'सन ${year}-${Number(year) + 1} मधील माहे एप्रिल/मे अखेरचा खर्च',
      sum(b.[AikunKharch]) as 'एकुण कामावरील खर्च',
      sum(b.[Takunone]) as 'प्रथम तिमाही तरतूद',
      sum(b.[Takuntwo]) as 'द्वितीय तिमाही तरतूद',
      sum(b.[Takunthree]) as 'तृतीय तिमाही तरतूद',
      sum(b.[Takunfour]) as 'चतुर्थ तिमाही तरतूद',
      sum(b.[Tartud])as 'अर्थसंकल्पीय तरतूद',
      sum(b.[AkunAnudan]) as 'वितरित तरतूद',
      sum(b.[Magni]) as 'मागणी',
      sum(b.[Vidyutprama]) as 'प्रमा',
      sum(b.[Vidyutvitarit]) as 'वितरित',
      sum(b.[Itarkhrch]) as 'इतर खर्च',
      isNULL ('','') as 'दवगुनी ज्ञापने',
      isNULL ('','') as 'पाहणी क्रमांक',
      isNULL ('','') as 'पाहणीमुद्ये',
      isNULL ('','') as 'देयकाची सद्यस्थिती',
      isNULL ('','') as 'शेरा',
      sum(b.[Apr]) as [Apr],
      sum(b.[May]) as [May],
      sum(b.[Jun]) as [Jun],
      sum(b.[Jul]) as [Jul],
      sum(b.[Aug]) as [Aug],
      sum(b.[Sep]) as [Sep],
      sum(b.[Oct]) as [Oct],
      sum(b.[Nov]) as [Nov],
      sum(b.[Dec]) as [Dec],
      sum(b.[Jan]) as [Jan],
      sum(b.[Feb]) as [Feb],
      sum(b.[Mar]) as [Mar]
    from BudgetMasterBuilding as a 
    join BuildingProvision as b on a.WorkId=b.WorkId
    where a.[ThekedaarName]=@name and b.[Arthsankalpiyyear]=@year
    group by a.[LekhaShirshName] 
    order by a.[LekhaShirshName],a.[Arthsankalpiyyear],a.[upvibhag]
    `;
    
    const result = await pool
      .request()
      .input("name", name)
      .input("year", year)
      .query(query);
    
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting contractorGraph details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting contractorGraph details",
      error: error.message,
    });
  }
};

const ContractorCRFReportApi = async (req, res) => {
  const { office, post, year, name } = req.body;
  
  if (!office || !post || !year || !name) {
    return res.status(400).json({ success: false, message: "parameter is required" });
  }
  
  try {
    const pool = await getPool(office);
    if (!pool) throw new Error(`Database pool is not available for office ${office}.`);
  
    const query = `
      SELECT 
        ROW_NUMBER() OVER(PARTITION BY a.[Arthsankalpiyyear] ORDER BY a.[Arthsankalpiyyear],a.[upvibhag]desc) as 'SrNo', 
        a.[WorkId] as 'WorkId',
        a.[U_WIN] as 'U_WIN',
        a.[ArthsankalpiyBab] as 'Budget of Item',
        a.[Arthsankalpiyyear] as 'Budget of Year',
        a.[KamacheName] as 'Name of Work',
        a.[LekhaShirsh] as 'Head',
        a.[LekhaShirshName] as 'Headwise',
        a.[Type] as 'Type',
        a.[SubType] as 'SubType',
        a.[Upvibhag] as 'Sub Division',
        a.[Taluka] as 'Taluka',
        convert(nvarchar(max),a.[ShakhaAbhyantaName])+' '+convert(nvarchar(max),a.[ShakhaAbhiyantMobile]) as 'Sectional Engineer',
        convert(nvarchar(max),a.[UpabhyantaName])+' '+convert(nvarchar(max),a.[UpAbhiyantaMobile]) as 'Deputy Engineer',
        a.[AmdaracheName] as 'MLA',
        a.[KhasdaracheName] as 'MP',
        convert(nvarchar(max),a.[ThekedaarName])+' '+convert(nvarchar(max),a.[ThekedarMobile]) as 'Contractor',
        a.[PrashaskiyKramank] as 'Administrative No',
        a.[PrashaskiyDate] as 'A A Date',
        a.[PrashaskiyAmt] as 'A A Amount',
        a.[TrantrikKrmank] as 'Technical Sanction No',
        a.[TrantrikDate] as 'T S Date',
        a.[TrantrikAmt] as 'T S Amount',
        a.[Kamachavav] as 'Scope of Work',
        a.[karyarambhadesh] as 'Work Order',
        a.[NividaKrmank] as 'Tender No',
        cast(a.[NividaAmt] as decimal(10,2)) as 'Tender Amount',
        a.[NividaDate] as 'Tender Date',
        a.[kamachiMudat] as 'Work Order Date',
        a.[KamPurnDate] as 'Work Completion Date',
        b.[MudatVadhiDate] as 'Extension Month',
        a.[SanctionDate] as 'SanctionDate',
        a.[SanctionAmount] as 'SanctionAmount',
        b.[ManjurAmt] as 'Estimated Cost Approved',
        b.[MarchEndingExpn] as 'MarchEndingExpn',
        b.[UrvaritAmt] as 'Remaining Cost',
        b.[VarshbharatilKharch] as 'Annual Expense',
        b.[Magilmonth] as 'Previous Month',
        b.[Magilkharch] as 'Previous Cost',
        b.[Chalumonth] as 'Current Month',
        b.[Chalukharch] as 'Current Cost',
        b.[AikunKharch] as 'Total Expense',
        b.[DTakunone] as 'First Provision Month',
        b.[Takunone] as 'First Provision',
        b.[DTakuntwo] as 'Second Provision Month',
        b.[Takuntwo] as 'Second Provision',
        b.[DTakunthree] as 'Third Provision Month',
        b.[Takunthree] as 'Third Provision',
        b.[DTakunfour] as 'Fourth Provision Month',
        b.[Takunfour] as 'Fourth Provision',
        b.[Tartud] as 'Grand Provision',
        b.[AkunAnudan] as 'Total Grand',
        b.[Magni] as 'Demand',
        b.[OtherExpen] as 'Other Expense',
        b.[ExpenCost] as 'Electricity Cost',
        b.[ExpenExpen] as 'Electricity Expense',
        a.[JobNo] as 'JobNo',
        a.[RoadNo] as 'Road Category',
        a.[RoadLength] as 'RoadLength',
        a.[APhysicalScope] as 'W.B.M Wide Phy Scope',
        a.[ACommulative] as 'W.B.M Wide Commulative',
        a.[ATarget] as 'W.B.M Wide Target',
        a.[AAchievement] as 'W.B.M Wide Achievement',
        a.[BPhysicalScope] as 'B.T Phy Scope',
        a.[BCommulative] as 'B.T Commulative',
        a.[BTarget] as 'B.T Target',
        a.[BAchievement] as 'B.T Achievement',
        a.[CPhysicalScope] as 'C.D Phy Scope',
        a.[CCommulative] as 'C.D Commulative',
        a.[CTarget] as 'C.D Target',
        a.[CAchievement] as 'C.D Achievement',
        a.[DPhysicalScope] as 'Minor Bridges Phy Scope(Nos)',
        a.[DCommulative] as 'Minor Bridges Commulative(Nos)',
        a.[DTarget] as 'Minor Bridges Target(Nos)',
        a.[DAchievement] as 'Minor Bridges Achievement(Nos)',
        a.[EPhysicalScope] as 'Major Bridges Phy Scope(Nos)',
        a.[ECommulative] as 'Major Bridges Commulative(Nos)',
        a.[ETarget] as 'Major Bridges Target(Nos)',
        a.[EAchievement] as 'Major Bridges Achievement(Nos)',
        b.[DeyakachiSadyasthiti] as 'Bill Status',
        a.[Pahanikramank] as 'Observation No',
        a.[PahaniMudye] as 'Observation Memo',
        a.[Sadyasthiti] as 'Status',
        a.[Shera] as 'Remark',
        b.[Apr] as 'Apr',
        b.[May] as 'May',
        b.[Jun] as 'Jun',
        b.[Jul] as 'Jul',
        b.[Aug] as 'Aug',
        b.[Sep] as 'Sep',
        b.[Oct] as 'Oct',
        b.[Nov] as 'Nov',
        b.[Dec] as 'Dec',
        b.[Jan] as 'Jan',
        b.[Feb] as 'Feb',
        b.[Mar] as 'Mar' 
      from BudgetMasterCRF as a 
      join CRFProvision as b on a.WorkId=b.WorkId
      where a.[ThekedaarName]=@name and b.[Arthsankalpiyyear]=@year
      
      UNION
      
      select 
        isNULL ('','')as'SrNo', 
        'Total' as 'WorkId',
        isNULL ('','') as 'U_WIN',
        isNULL ('','') as 'Budget of Item',
        isNULL (a.[Arthsankalpiyyear],'') as 'Arthsankalpiyyear',
        isNULL ('','') as 'Name of Work',
        isNULL ('','') as 'Head',
        isNULL ('','') as 'Headwise',
        isNULL ('','') as 'Type',
        isNULL ('','') as 'SubType',
        isNULL ('','') as 'Sub Division',
        isNULL ('','') as 'Taluka',
        isNULL ('','') as 'Sectional Engineer',
        isNULL ('','') as 'Deputy Engineer',
        isNULL ('','') as 'MLA',
        isNULL ('','') as 'MP',
        isNULL ('','') as 'Contractor',
        isNULL ('','') as 'Administrative No',
        isNULL ('','') as 'A A Date',
        sum(cast(a.[PrashaskiyAmt] as decimal(10,0))) as 'A A Amount',
        isNULL ('','') as 'Technical Sanction No',
        isNULL ('','') as 'T S Date',
        sum(cast(a.[TrantrikAmt]as decimal(10,0))) as 'T S Amount',
        isNULL ('','') as 'Scope of Work',
        isNULL ('','') as 'Work Order',
        isNULL ('','') as 'Tender No',
        sum(cast(a.[NividaAmt] as decimal(10,2))) as 'Tender Amount',
        isNULL ('','') as 'Tender Date',
        isNULL ('','') as 'Work Order Date',
        isNULL ('','') as 'Work Completion Date',
        isNULL ('','') as 'Extension Month',
        isNULL ('','') as 'SanctionDate',
        sum(a.[SanctionAmount]) as 'SanctionAmount',
        sum(b.[ManjurAmt]) as 'Estimated Cost Approved',
        sum(b.[MarchEndingExpn]) as 'MarchEndingExpn',
        sum(b.[UrvaritAmt]) as 'Remaining Cost',
        sum(b.[VarshbharatilKharch]) as 'Annual Expense',
        isNULL ('','') as 'Previous Month',
        sum(b.[Magilkharch]) as 'Previous Cost',
        isNULL ('','') as 'Current Month',
        sum(b.[Chalukharch]) as 'Current Cost',
        sum(b.[AikunKharch]) as 'Total Expense', 
        isNULL ('','') as 'First Provision Month',
        sum(b.[Takunone]) as 'First Provision',
        isNULL ('','') as 'Second Provision Month',
        sum(b.[Takuntwo]) as 'Second Provision',
        isNULL ('','') as 'Third Provision Month',
        sum(b.[Takunthree]) as 'Third Provision',
        isNULL ('','') as 'Fourth Provision Month',
        sum(b.[Takunfour]) as 'Fourth Provision',
        sum(b.[Tartud]) as 'Grand Provision',
        sum(b.[AkunAnudan]) as 'Total Grand',
        sum(b.[Magni]) as 'Demand',
        sum(b.[OtherExpen]) as 'Other Expense',
        sum(b.[ExpenCost]) as 'Electricity Cost',
        sum(b.[ExpenExpen]) as 'Electricity Expense',
        isNULL ('','') as 'JobNo',
        isNULL ('','') as 'Road Category',
        isNULL ('','') as 'RoadLength',
        sum(a.[APhysicalScope]) as 'W.B.M Wide Phy Scope',
        sum(a.[ACommulative]) as 'W.B.M Wide Commulative',
        sum(a.[ATarget]) as 'W.B.M Wide Target',
        sum(a.[AAchievement]) as 'W.B.M Wide Achievement',
        sum(a.[BPhysicalScope]) as 'B.T Phy Scope',
        sum(a.[BCommulative]) as 'B.T Commulative',
        sum(a.[BTarget]) as 'B.T Target',
        sum(a.[BAchievement]) as 'B.T Achievement',
        sum(a.[CPhysicalScope]) as 'C.D Phy Scope',
        sum(a.[CCommulative]) as 'C.D Commulative',
        sum(a.[CTarget]) as 'C.D Target',
        sum(a.[CAchievement]) as 'C.D Achievement',
        sum(a.[DPhysicalScope]) as 'Minor Bridges Phy Scope(Nos)',
        sum(a.[DCommulative]) as 'Minor Bridges Commulative(Nos)',
        sum(a.[DTarget]) as 'Minor Bridges Target(Nos)',
        sum(a.[DAchievement]) as 'Minor Bridges Achievement(Nos)',
        sum(a.[EPhysicalScope]) as 'Major Bridges Phy Scope(Nos)',
        sum(a.[ECommulative]) as 'Major Bridges Commulative(Nos)',
        sum(a.[ETarget]) as 'Major Bridges Target(Nos)',
        sum(a.[EAchievement]) as 'Major Bridges Achievement(Nos)',
        isNULL ('','') as 'Bill Status',
        isNULL ('','') as 'Observation No',
        isNULL ('','') as 'Observation Memo',
        isNULL ('','') as 'Status',
        isNULL ('','') as 'Remark',
        sum(b.[Apr]) as 'Apr',
        sum(b.[May]) as 'May',
        sum(b.[Jun]) as 'Jun',
        sum(b.[Jul]) as 'Jul',
        sum(b.[Aug]) as 'Aug',
        sum(b.[Sep]) as 'Sep',
        sum(b.[Oct]) as 'Oct',
        sum(b.[Nov]) as 'Nov',
        sum(b.[Dec]) as 'Dec',
        sum(b.[Jan]) as 'Jan',
        sum(b.[Feb]) as 'Feb',
        sum(b.[Mar]) as 'Mar' 
      from BudgetMasterCRF as a 
      join CRFProvision as b on a.WorkId=b.WorkId
      where a.[ThekedaarName]=@name and b.[Arthsankalpiyyear]=@year
      group by a.[Arthsankalpiyyear] 
      order by a.[Arthsankalpiyyear],a.Upvibhag desc
    `;
    
    const result = await pool
      .request()
      .input("name", name)
      .input("year", year)
      .query(query);
    
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting CRF contractor report details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting CRF contractor report details",
      error: error.message,
    });
  }
};

const ContractorNabardReportApi = async (req, res) => {
  const { office, post, year, name } = req.body;
  
  if (!office || !post || !year || !name) {
    return res.status(400).json({ success: false, message: "parameter is required" });
  }
  
  try {
    const pool = await getPool(office);
    if (!pool) throw new Error(`Database pool is not available for office ${office}.`);
  
    const query = `
     SELECT ROW_NUMBER() OVER(PARTITION BY a.[RDF_SrNo] ORDER BY a.[Upvibhag]) as 'SrNo', a.[WorkId] as 'Work Id',a.[U_WIN] as 'U_WIN',a.[RDF_NO] as 'RIDF NO', a.[RDF_SrNo] as 'SrNo',a.[Arthsankalpiyyear] as 'Budget of Year',a.Dist as 'District',a.[Taluka] as 'Taluka',a.[ArthsankalpiyBab] as 'Budget of Item',a.[KamacheName]as 'Name of Work',a.[Kamachavav] as 'Scope of Work',a.[LekhaShirshName] as 'Headwise',a.[SubType] as 'Division',a.[Upvibhag] as 'Sub Division',convert(nvarchar(max),a.[ShakhaAbhyantaName])+' '+convert(nvarchar(max),a.[ShakhaAbhiyantMobile]) as 'Sectional Engineer',convert(nvarchar(max),a.[UpabhyantaName])+' '+convert(nvarchar(max),a.[UpAbhiyantaMobile]) as 'Deputy Engineer',a.[AmdaracheName] as 'MLA',a.[KhasdaracheName] as 'MP',convert(nvarchar(max),a.[ThekedaarName])+' '+convert(nvarchar(max),a.[ThekedarMobile]) as 'Contractor',a.[PrashaskiyKramank] as 'Administrative No',a.[PrashaskiyDate] as 'A A Date',a.[PIC_NO] as 'PIC No',cast(a.[PrashaskiyAmt] as decimal(10,2)) as 'AA cost Rs in lakhs',cast(a.[TrantrikAmt]as decimal(10,2))as 'Technical Sanction Cost Rs in Lakh',a.[TrantrikKrmank]+' '+a.[TrantrikDate] as 'Technical Sanction No and Date',a.[NividaKrmank] as 'Tender No',cast(a.[NividaAmt] as decimal(10,2)) as 'Tender Amount',a.[karyarambhadesh] as 'Work Order',a.[NividaDate] as 'Tender Date',a.[kamachiMudat] as 'Work Order Date',a.[KamPurnDate] as 'Work Completion Date',b.[MudatVadhiDate] as 'Extension Month',b.[ManjurAmt] as 'Estimated Cost Approved',b.[MarchEndingExpn] as 'Expenditure up to MAR 2021',b.[UrvaritAmt] as 'Remaining Cost',b.[Chalukharch] as 'Current Cost',b.[Magilkharch] as 'Previous Cost',b.[VarshbharatilKharch] as 'Expenditure up to 8/2020 during year 20-21 Rs in Lakhs',b.[AikunKharch] as 'Total Expense',b.[Takunone] as 'Budget Provision in @year Rs in Lakhs',b.[Takuntwo] as 'Second Provision',b.[Takunthree] as 'Third Provision',b.[Takunfour] as 'Fourth Provision',b.[Tartud] as 'Total Provision',b.[AkunAnudan] as 'Total Grand',b.[Magni] as 'Demand for 2021-22 Rs in Lakhs',a.[PahaniMudye] as 'Observation Memo',a.[Pahanikramank] as 'Probable date of completion',b.[DeyakachiSadyasthiti] as 'Bill Status',a.[Sadyasthiti] as 'Physical Progress of work',a.[Road_No] as 'Road Category',a.[LengthRoad] as 'Road Length',a.[RoadType] as 'Road Type',a.[WBMI_km] as 'WBMI Km',a.[WBMII_km] as 'WBMII Km',a.[WBMIII_km] as 'WBMIII Km',a.[BBM_km] as 'BBM Km',a.[Carpet_km] as 'Carpet Km',a.[Surface_km] as 'Surface Km',cast(a.[CD_Works_No] as decimal(10,2))  as 'CD_Works_No',a.[PCR] as 'PCR submitted or not',a.[Shera] as 'Remark',b.[Apr] as 'Apr',b.[May] as 'May',b.[Jun] as 'Jun',b.[Jul] as 'Jul',b.[Aug] as 'Aug',b.[Sep] as 'Sep',b.[Oct] as 'Oct',b.[Nov] as 'Nov',b.[Dec] as 'Dec',b.[Jan] as 'Jan',b.[Feb] as 'Feb',b.[Mar] as 'Mar' from BudgetMasterNABARD as a join NABARDProvision as b on a.WorkId=b.WorkId  where a.[ThekedaarName]=@name and b.[Arthsankalpiyyear]='2025-2026'   union select isNULL (a.[RDF_SrNo],'')as'SrNo',isNULL ('Total','') as 'Work Id',isNULL ('','') as 'U_WIN',isNULL ('','')as 'RIDF NO', cast(a.[RDF_SrNo] as int) as 'srno',isNULL ('Total','')as 'Budget of Year',isNULL ('','') as 'District',isNULL ('','') as 'Taluka',isNULL ('','') as 'Budget of Item',isNULL ('','')as 'Name of Work',isNULL ('','') as 'Scope of Work',isNULL ('','')as 'Headwise',isNULL ('','') as 'Division',isNULL ('','') as 'Sub Division',isNULL ('','') as 'Sectional Engineer',isNULL ('','') as 'Deputy Engineer',isNULL ('','') as 'MLA',isNULL ('','') as 'MP',isNULL ('','') as 'Contractor',isNULL ('','') as 'Administrative No',isNULL ('','') as 'A A Date','Total' as 'PIC No',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'AA cost Rs in lakhs',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'Technical Sanction Cost Rs in Lakh',isNULL ('','') as 'Technical Sanction No and Date',isNULL ('','') as 'Tender No',sum(cast(a.[NividaAmt] as decimal(10,2))) as 'Tender Amount',isNULL ('','') as 'Work Order',isNULL ('','') as 'Tender Date',isNULL ('','') as 'Work Order Date',isNULL ('','') as 'Work Completion Date',isNULL ('','') as 'Extension Month',sum(b.[ManjurAmt]) as 'Estimated Cost Approved',sum(b.[MarchEndingExpn]) as 'Expenditure up to MAR 2021',sum(b.[UrvaritAmt]) as 'Remaining Cost',sum(b.[Chalukharch]) as 'Current Cost',sum(b.[Magilkharch]) as 'Previous Cost',sum(b.[VarshbharatilKharch]) as 'Expenditure up to 8/2020 during year 20-21 Rs in Lakhs',sum(b.[AikunKharch]) as 'Total Expense', sum(b.[Takunone]) as 'Budget Provision in @year Rs in Lakhs',sum(b.[Takuntwo]) as 'Second Provision',sum(b.[Takunthree]) as 'Third Provision',sum(b.[Takunfour]) as 'Fourth Provision',sum(b.[Tartud]) as 'Total Provision',sum(b.[AkunAnudan]) as 'Total Grand',sum(b.[Magni]) as 'Demand for @year Rs in Lakhs',isNULL ('','') as 'Observation Memo',isNULL ('','') as 'Probable date of completion',isNULL ('','') as 'Bill Status',isNULL ('','') as 'Physical Progress of work',isNULL ('','') as 'Road Category',isNULL ('','') as 'Road Length',isNULL ('','') as 'Road Type',sum(a.[WBMI_km]) as 'WBMI Km',sum(a.[WBMII_km]) as 'WBMII Km',sum(a.[WBMIII_km]) as 'WBMIII Km',sum(a.[BBM_km]) as 'BBM Km',sum(a.[Carpet_km]) as 'Carpet Km',sum(a.[Surface_km]) as 'Surface Km',sum(cast(a.[CD_Works_No] as decimal(10,2)))  as 'CD_Works_No',isNULL ('','') as 'PCR submitted or not',isNULL ('','')as 'Remark',sum(b.[Apr]) as 'Apr',sum(b.[May]) as 'May',sum(b.[Jun]) as 'Jun',sum(b.[Jul]) as 'Jul',sum(b.[Aug]) as 'Aug',sum(b.[Sep]) as 'Sep',sum(b.[Oct]) as 'Oct',sum(b.[Nov]) as 'Nov',sum(b.[Dec]) as 'Dec',sum(b.[Jan]) as 'Jan',sum(b.[Feb]) as 'Feb',sum(b.[Mar]) as 'Mar' from BudgetMasterNABARD as a join NABARDProvision as b on a.WorkId=b.WorkId  where a.[ThekedaarName]=@name and b.[Arthsankalpiyyear]=@year   group by a.[RDF_SrNo] order by a.[RDF_SrNo],a.[Arthsankalpiyyear],a.[Upvibhag],a.taluka
    `;
    
    const result = await pool
      .request()
      .input("name", name)
      .input("year", year)
      .query(query);
    
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting CRF contractor report details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting CRF contractor report details",
      error: error.message,
    });
  }
};

const ContractorRoadReportApi = async (req, res) => {
  const { office, post, year, name } = req.body;
  
  if (!office || !post || !year || !name) {
    return res.status(400).json({ success: false, message: "parameter is required" });
  }
  
  try {
    const pool = await getPool(office);
    if (!pool) throw new Error(`Database pool is not available for office ${office}.`);
  
    const query = `
     SELECT ROW_NUMBER() OVER(PARTITION BY a.[LekhaShirshName]ORDER BY a.LekhaShirshName desc,a.[Arthsankalpiyyear],a.[Taluka],a.[upvibhag]) as 'अ.क्र', a.[WorkId] as 'वर्क आयडी',a.[U_WIN] as 'U_WIN',a.PageNo as 'पान क्र',a.ArthsankalpiyBab as 'बाब क्र',a.JulyBab as 'जुलै/ बाब क्र./पान क्र.',a.[Arthsankalpiyyear] as 'अर्थसंकल्पीय वर्ष',a.[KamacheName] as 'कामाचे नाव',a.[LekhaShirshName] as 'लेखाशीर्ष नाव',a.[SubType] as 'विभाग',a.[Upvibhag] as 'उपविभाग',a.[Taluka] as 'तालुका',convert(nvarchar(max),a.[ShakhaAbhyantaName])+' '+convert(nvarchar(max),a.[ShakhaAbhiyantMobile]) as 'शाखा अभियंता नाव',convert(nvarchar(max),a.[UpabhyantaName])+' '+convert(nvarchar(max),a.[UpAbhiyantaMobile]) as 'उपअभियंता नाव',a.[AmdaracheName] as 'आमदारांचे नाव',a.[KhasdaracheName] as 'खासदारांचे नाव',convert(nvarchar(max),a.[ThekedaarName])+' '+convert(nvarchar(max),a.[ThekedarMobile]) as 'ठेकेदार नाव',convert(nvarchar(max),a.[PrashaskiyKramank])+' '+convert(nvarchar(max),a.[PrashaskiyAmt])+' '+convert(nvarchar(max),a.[PrashaskiyDate])as 'प्रशासकीय मान्यता क्र/रक्कम/दिनांक',convert(nvarchar(max),a.[TrantrikKrmank])+' '+convert(nvarchar(max),a.[TrantrikAmt])+' '+convert(nvarchar(max),a.[TrantrikDate])as 'तांत्रिक मान्यता क्र/रक्कम/दिनांक',a.[Kamachevav] as 'कामाचा वाव',convert(nvarchar(max),a.[NividaKrmank])+' '+convert(nvarchar(max),a.[NividaDate])as 'कार्यारंभ आदेश',cast(a.[NividaAmt] as decimal(10,2)) as 'निविदा रक्कम % कमी / जास्त',a.[kamachiMudat] as 'बांधकाम कालावधी',a.[KamPurnDate] as 'काम पूर्ण तारीख',CAST(CASE WHEN b.[MudatVadhiDate] = ' ' or b.[MudatVadhiDate] = '0' THEN N'होय' ELSE N'नाही' END as nvarchar(max)) as 'मुदतवाढ बाबत',b.[ManjurAmt] as 'मंजूर अंदाजित किंमत',b.[MarchEndingExpn] as 'सुरवाती पासून मार्च 2021 अखेरचा खर्च',b.[UrvaritAmt] as 'उर्वरित किंमत',b.[VarshbharatilKharch] as 'सन @year मधील माहे एप्रिल/मे अखेरचा खर्च',b.[Magilkharch] as 'मागील खर्च',b.[AikunKharch] as 'एकुण कामावरील खर्च',b.[Takunone] as'@year मधील अर्थसंकल्पीय तरतूद मार्च 2021',b.[Takuntwo] as '@year मधील अर्थसंकल्पीय तरतूद जुलै 2021',b.[Takunthree] as'तृतीय तिमाही तरतूद',b.[Takunfour] as 'चतुर्थ तिमाही तरतूद',b.[Tartud] as 'एकूण अर्थसंकल्पीय तरतूद',b.[AkunAnudan] as '@year मधील वितरीत तरतूद',b.[Magni] as '@year साठी मागणी',b.[Vidyutprama] as 'विद्युतीकरणावरील प्रमा',b.[Vidyutvitarit] as 'विद्युतीकरणावरील वितरित',b.[Itarkhrch] as 'इतर खर्च',b.[Dviguni] as 'दवगुनी ज्ञापने',a.[PahaniMudye] as 'पाहणीमुद्ये',a.[Pahanikramank] as 'पाहणी क्रमांक',CAST(CASE WHEN a.[Sadyasthiti] = N'पूर्ण'  THEN 1 ELSE 0 END as decimal(10,0)) as 'C',CAST(CASE WHEN a.[Sadyasthiti] = N'प्रगतीत'  THEN 1 ELSE 0 END as decimal(10,0)) as 'P',CAST(CASE WHEN a.[Sadyasthiti] = N'सुरू न झालेली'  THEN 1 ELSE 0 END as decimal(10,0)) as 'NS',convert(nvarchar(max),a.[Sadyasthiti])+' '+convert(nvarchar(max),a.[Shera]) as 'शेरा',b.[Apr] as 'Apr',b.[May] as 'May',b.[Jun] as 'Jun',b.[Jul] as 'Jul',b.[Aug] as 'Aug',b.[Sep] as 'Sep',b.[Oct] as 'Oct',b.[Nov] as 'Nov',b.[Dec] as 'Dec',b.[Jan] as 'Jan',b.[Feb] as 'Feb',b.[Mar] as 'Mar' from BudgetMasterRoad as a join RoadProvision as b on a.WorkId=b.WorkId  where a.[ThekedaarName]=@name and b.[Arthsankalpiyyear]='@year'   union select isNULL ('','')as'अ.क्र', 'Total' as 'वर्क आयडी',isNULL ('','') as 'U_WIN',isNULL ('','') as 'पान क्र',isNULL ('','') as 'बाब क्र',isNULL ('','') as 'जुलै/ बाब क्र./पान क्र.',isNULL ('Total','') as 'अर्थसंकल्पीय वर्ष',isNULL ('','') as 'कामाचे नाव', a.[LekhaShirshName] as 'लेखाशीर्ष नाव',isNULL ('','') as 'विभाग',isNULL ('','') as 'उपविभाग',isNULL ('','') as 'तालुका',isNULL ('','') as 'शाखा अभियंता नाव',isNULL ('','') as 'उपअभियंता नाव',isNULL ('','') as 'आमदारांचे नाव',isNULL ('','') as 'खासदारांचे नाव',isNULL ('','') as 'ठेकेदार नाव',isNULL ('','') as 'प्रशासकीय मान्यता क्र/रक्कम/दिनांक',isNULL ('','') as 'तांत्रिक मान्यता क्र/रक्कम/दिनांक',isNULL ('','') as 'कामाचा वाव',isNULL ('','') as 'कार्यारंभ आदेश',sum(cast(a.[NividaAmt] as decimal(10,2))) as 'निविदा रक्कम % कमी / जास्त',isNULL ('','') as 'बांधकाम कालावधी',isNULL ('','') as 'काम पूर्ण तारीख',isNULL ('','') as 'मुदतवाढ बाबत',sum(b.[ManjurAmt]) as 'मंजूर अंदाजित किंमत',sum(b.[MarchEndingExpn]) as 'सुरवाती पासून मार्च 2021 अखेरचा खर्च',sum(b.[UrvaritAmt]) as 'उर्वरित किंमत',sum(b.[VarshbharatilKharch]) as 'सन @year मधील माहे एप्रिल/मे अखेरचा खर्च',sum(b.[Magilkharch]) as 'मागील खर्च',sum(b.[AikunKharch]) as 'एकुण कामावरील खर्च',sum(b.[Takunone]) as'@year मधील अर्थसंकल्पीय तरतूद मार्च 2021',sum(b.[Takuntwo]) as '@year मधील अर्थसंकल्पीय तरतूद जुलै 2021',sum(b.[Takunthree]) as'तृतीय तिमाही तरतूद',sum(b.[Takunfour]) as 'चतुर्थ तिमाही तरतूद',sum(b.[Tartud]) as 'एकूण अर्थसंकल्पीय तरतूद',sum(b.[AkunAnudan]) as '@year मधील वितरीत तरतूद',sum(b.[Magni]) as '@year साठी मागणी',sum(b.[Vidyutprama]) as 'प्रमा',sum(b.[Vidyutvitarit]) as 'वितरित',sum(b.[Itarkhrch]) as 'इतर खर्च',isNULL ('','') as 'दवगुनी ज्ञापने',isNULL ('','') as 'पाहणीमुद्ये',isNULL ('','') as 'पाहणी क्रमांक',sum(CAST(CASE WHEN a.[Sadyasthiti] = N'पूर्ण'  THEN 1 ELSE 0 END as decimal(10,0))) as 'C',sum(CAST(CASE WHEN a.[Sadyasthiti] = N'प्रगतीत'  THEN 1 ELSE 0 END as decimal(10,0))) as 'P',sum(CAST(CASE WHEN a.[Sadyasthiti] = N'सुरू न झालेली'  THEN 1 ELSE 0 END as decimal(10,0))) as 'NS',isNULL ('','') as 'शेरा',sum (b.[Apr]) as [Apr],sum (b.[May]) as [May],sum (b.[Jun]) as [Jun],sum (b.[Jul]) as [Jul],sum (b.[Aug]) as [Aug],sum (b.[Sep]) as [Sep],sum (b.[Oct]) as [Oct],sum (b.[Nov]) as [Nov],sum (b.[Dec]) as [Dec],sum (b.[Jan]) as [Jan],sum (b.[Feb]) as [Feb],sum (b.[Mar]) as [Mar] from BudgetMasterRoad as a join RoadProvision as b on a.WorkId=b.WorkId  where a.[ThekedaarName]=@name and b.[Arthsankalpiyyear]=@year  group by a.[LekhaShirshName] order by a.LekhaShirshName desc,a.[Arthsankalpiyyear],a.[Taluka],a.upvibhag
    `;
    
    const result = await pool
      .request()
      .input("name", name)
      .input("year", year)
      .query(query);
    
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting CRF contractor report details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting CRF contractor report details",
      error: error.message,
    });
  }
};

const ContractorDPDCReportApi = async (req, res) => {
  const { office, post, year, name } = req.body;
  
  if (!office || !post || !year || !name) {
    return res.status(400).json({ success: false, message: "parameter is required" });
  }
  
  try {
    const pool = await getPool(office);
    if (!pool) throw new Error(`Database pool is not available for office ${office}.`);
  
    const query = `
    SELECT ROW_NUMBER() OVER(PARTITION BY a.[Arthsankalpiyyear], a.[Upvibhag] ORDER BY a.[Arthsankalpiyyear],a.[upvibhag],a.[Taluka]desc) as 'अ क्र', a.[WorkId] as 'वर्क आयडी',a.[U_WIN] as 'U_WIN',a.[LekhaShirshName] as 'योजनेचे नाव',b.[ComputerCRC] as 'सीआरसी (संगणक) संकेतांक',b.[ObjectCode] as 'उद्यीष्ट संकेतांक(ऑब्जेक्ट कोड)',a.[Arthsankalpiyyear] as 'अर्थसंकल्पीय वर्ष',a.[KamacheName] as 'योजनेचे / कामाचे नांव',a.[SubType] as 'विभाग',a.[Upvibhag] as 'उपविभाग',a.[Taluka] as 'तालुका',a.[ArthsankalpiyBab] as 'अर्थसंकल्पीय बाब',convert(nvarchar(max),a.[ShakhaAbhyantaName])+' '+convert(nvarchar(max),a.[ShakhaAbhiyantMobile]) as 'शाखा अभियंता नाव',convert(nvarchar(max),a.[UpabhyantaName])+' '+convert(nvarchar(max),a.[UpAbhiyantaMobile]) as 'उपअभियंता नाव',a.[AmdaracheName] as 'आमदारांचे नाव',a.[KhasdaracheName] as 'खासदारांचे नाव',convert(nvarchar(max),a.[ThekedaarName])+' '+convert(nvarchar(max),a.[ThekedarMobile]) as 'ठेकेदार नाव',convert(nvarchar(max),a.[PrashaskiyKramank])+' '+convert(nvarchar(max),a.[PrashaskiyAmt])+' '+convert(nvarchar(max),a.[PrashaskiyDate])as 'प्रशासकीय मान्यता क्र/रक्कम/दिनांक',convert(nvarchar(max),a.[TrantrikKrmank])+' '+convert(nvarchar(max),a.[TrantrikAmt])+' '+convert(nvarchar(max),a.[TrantrikDate])as 'तांत्रिक मान्यता क्र/रक्कम/दिनांक',a.[Kamachevav] as 'कामाचा वाव',a.[karyarambhadesh] as 'कार्यारंभ आदेश',convert(nvarchar(max),a.[NividaKrmank])+' '+convert(nvarchar(max),a.[NividaDate])as 'निविदा क्र/दिनांक',cast(a.[NividaAmt] as decimal(10,2)) as 'निविदा रक्कम % कमी / जास्त',a.[kamachiMudat] as 'बांधकाम कालावधी',a.[KamPurnDate] as 'काम पूर्ण होण्याचा अपेक्षित दिनांक',convert(nvarchar(max),a.[NividaAmt])+' '+convert(nvarchar(max),b.[MudatVadhiDate]) as 'सुधारित अंदाजित किंमतीचा दिनांक',CAST(CASE WHEN a.[LekhaShirsh] = N'५०५४४२४६'  THEN '1' END as nvarchar(max)) as 'एकूण कामे',b.[DeyakachiSadyasthiti] as 'देयकाची सद्यस्थिती',b.[ManjurAmt] as 'एकूण अंदाजित किंमत (अलिकडील सुधारित)',b.[MarchEndingExpn] as 'मार्च अखेर खर्च 2021',b.[UrvaritAmt] as 'सन 2021-2022 मधील अपेक्षित खर्च',b.[Chalukharch] as 'चालू खर्च',b.[Magilkharch] as 'मागील खर्च',b.[VarshbharatilKharch] as 'सन 2021-2022 मधील माहे एप्रिल/मे अखेरचा खर्च',b.[AikunKharch] as 'एकुण कामावरील खर्च',b.[Takunone] as 'उर्वरित किंमत (6-(8+9))',b.[Takuntwo] as 'द्वितीय तिमाही तरतूद',b.[Takunthree] as 'तृतीय तिमाही तरतूद',b.[Takunfour] as 'चतुर्थ तिमाही तरतूद',b.[Tartud] as '2021-2022 करीता प्रस्तावित तरतूद',b.[Tartud]as 'काम निहाय तरतूद सन 2021-2022',b.[AkunAnudan] as 'वितरित तरतूद',b.[Magni] as 'मागणी 2021-2022',b.[Vidyutprama] as 'विद्युतीकरणावरील प्रमा',b.[Vidyutvitarit] as 'विद्युतीकरणावरील वितरित',b.[Jun] as 'वितरीत तरतूद सन 2021-2022',b.[Itarkhrch] as 'इतर खर्च',b.[Dviguni] as 'दवगुनी ज्ञापने',a.[PahaniMudye] as 'पाहणीमुद्ये',CAST(CASE WHEN a.[Sadyasthiti] = N'पुर्ण'  THEN 1 ELSE 0 END as decimal(10,0)) as 'पुर्ण',CAST(CASE WHEN a.[Sadyasthiti] = N'प्रगतीत'  THEN 1 ELSE 0 END as decimal(10,0)) as 'प्रगतीत',CAST(CASE WHEN a.[Sadyasthiti] = N'सुरू न झालेली'  THEN 1 ELSE 0 END as decimal(10,0)) as 'निविदा स्तर',a.[Shera] as 'शेरा',b.[Apr] as 'Apr',b.[May] as 'May',b.[Jun] as 'Jun',b.[Jul] as 'Jul',b.[Aug] as 'Aug',b.[Sep] as 'Sep',b.[Oct] as 'Oct',b.[Nov] as 'Nov',b.[Dec] as 'Dec',b.[Jan] as 'Jan',b.[Feb] as 'Feb',b.[Mar] as 'Mar' from BudgetMasterDPDC as a join DPDCProvision as b on a.WorkId=b.WorkId   where a.[ThekedaarName]=@name and b.[Arthsankalpiyyear]=@year   union select isNULL ('','')as'अ क्र',  'Total' as 'वर्क आयडी',isNULL ('','') as 'U_WIN', isNULL ('','') as 'योजनेचे नाव',isNULL ('','') as 'सीआरसी (संगणक) संकेतांक',isNULL ('','') as 'उद्यीष्ट संकेतांक(ऑब्जेक्ट कोड)',isNULL (a.[Arthsankalpiyyear],'') as 'अर्थसंकल्पीय वर्ष',isNULL ('','') as 'योजनेचे / कामाचे नांव',isNULL ('','') as 'विभाग', isNULL (a.[Upvibhag],'') as 'उपविभाग', isNULL ('','') as 'तालुका',isNULL ('','') as 'अर्थसंकल्पीय बाब',isNULL ('','') as 'शाखा अभियंता नाव',isNULL ('','') as 'उपअभियंता नाव',isNULL ('','') as 'आमदारांचे नाव',isNULL ('','') as 'खासदारांचे नाव',isNULL ('','') as 'ठेकेदार नाव', isNULL ('','')as 'प्रशासकीय मान्यता क्र/रक्कम/दिनांक', isNULL ('','') as 'तांत्रिक मान्यता क्र/रक्कम/दिनांक',isNULL ('','') as 'कामाचा वाव',isNULL ('','') as 'कार्यारंभ आदेश',isNULL ('','') as 'निविदा क्र/दिनांक',sum(cast(a.[NividaAmt] as decimal(10,2))) as 'निविदा रक्कम % कमी / जास्त',isNULL ('','') as 'बांधकाम कालावधी', isNULL ('','') as 'काम पूर्ण होण्याचा अपेक्षित दिनांक', isNULL ('','') as 'सुधारित अंदाजित किंमतीचा दिनांक',isNULL ('','') as 'एकूण कामे',isNULL ('','') as 'देयकाची सद्यस्थिती',sum(b.[ManjurAmt]) as 'एकूण अंदाजित किंमत (अलिकडील सुधारित)',sum(b.[MarchEndingExpn]) as 'मार्च अखेर खर्च 2021', sum(b.[UrvaritAmt]) as 'सन 2021-2022 मधील अपेक्षित खर्च',sum(b.[Chalukharch])as 'चालू खर्च', sum(b.[Magilkharch]) as 'मागील खर्च',sum(b.[VarshbharatilKharch]) as 'सन 2021-2022 मधील माहे एप्रिल/मे अखेरचा खर्च',sum(b.[AikunKharch]) as 'एकुण कामावरील खर्च',sum(b.[Takunone]) as 'उर्वरित किंमत (6-(8+9))',sum(b.[Takuntwo]) as 'द्वितीय तिमाही तरतूद',sum(b.[Takunthree]) as 'तृतीय तिमाही तरतूद',sum(b.[Takunfour]) as 'चतुर्थ तिमाही तरतूद', sum(b.[Tartud]) as '2021-2022 करीता प्रस्तावित तरतूद', sum(b.[Tartud]) as 'काम निहाय तरतूद सन 2021-2022',sum(b.[AkunAnudan]) as 'वितरित तरतूद', sum(b.[Magni]) as 'मागणी 2021-2022',sum(b.[Vidyutprama]) as 'प्रमा',sum(b.[Vidyutvitarit]) as 'वितरित',sum(b.[Jun]) as 'वितरीत तरतूद सन 2021-2022',sum(b.[Itarkhrch]) as 'इतर खर्च',isNULL ('','') as 'दवगुनी ज्ञापने',isNULL ('','') as 'पाहणीमुद्ये', sum(CAST(CASE WHEN a.[Sadyasthiti] = N'पूर्ण'  THEN 1 ELSE 0 END as decimal(10,0))) as 'पूर्ण', sum( CAST(CASE WHEN a.[Sadyasthiti] = N'प्रगतीत'  THEN 1 ELSE 0 END as decimal(10,0))) as 'प्रगतीत', sum(CAST(CASE WHEN a.[Sadyasthiti] = N'सुरू न झालेली'  THEN 1 ELSE 0 END as decimal(10,0))) as 'निविदा स्तर', isNULL ('','') as 'शेरा',sum (b.[Apr]) as [Apr],sum (b.[May]) as [May],sum (b.[Jun]) as [Jun],sum (b.[Jul]) as [Jul],sum (b.[Aug]) as [Aug],sum (b.[Sep]) as [Sep],sum (b.[Oct]) as [Oct],sum (b.[Nov]) as [Nov],sum (b.[Dec]) as [Dec],sum (b.[Jan]) as [Jan],sum (b.[Feb]) as [Feb],sum (b.[Mar]) as [Mar] from BudgetMasterDPDC as a join DPDCProvision as b on a.WorkId=b.WorkId   where a.[ThekedaarName]=@name and b.[Arthsankalpiyyear]=@year   group by a.[Arthsankalpiyyear], a.[Upvibhag]  ORDER BY a.[Arthsankalpiyyear],a.[upvibhag],a.[Taluka] desc
    `;
    
    const result = await pool
      .request()
      .input("name", name)
      .input("year", year)
      .query(query);
    
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting CRF contractor report details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting CRF contractor report details",
      error: error.message,
    });
  }
};

const ContractorAnnuityReportApi = async (req, res) => {
  const { office, post, year, name } = req.body;
  
  if (!office || !post || !year || !name) {
    return res.status(400).json({ success: false, message: "parameter is required" });
  }
  
  try {
    const pool = await getPool(office);
    if (!pool) throw new Error(`Database pool is not available for office ${office}.`);
  
    const query = `
    SELECT ROW_NUMBER() OVER(PARTITION BY a.[Arthsankalpiyyear], a.[Upvibhag] ORDER BY a.[Arthsankalpiyyear],a.[upvibhag],a.[Taluka]desc) as 'अ क्र', a.[WorkId] as 'वर्क आयडी',a.[U_WIN] as 'U_WIN',a.[LekhaShirshName] as 'योजनेचे नाव',b.[ComputerCRC] as 'सीआरसी (संगणक) संकेतांक',b.[ObjectCode] as 'उद्यीष्ट संकेतांक(ऑब्जेक्ट कोड)',a.[Arthsankalpiyyear] as 'अर्थसंकल्पीय वर्ष',a.[KamacheName] as 'योजनेचे / कामाचे नांव',a.[SubType] as 'विभाग',a.[Upvibhag] as 'उपविभाग',a.[Taluka] as 'तालुका',a.[ArthsankalpiyBab] as 'अर्थसंकल्पीय बाब',convert(nvarchar(max),a.[ShakhaAbhyantaName])+' '+convert(nvarchar(max),a.[ShakhaAbhiyantMobile]) as 'शाखा अभियंता नाव',convert(nvarchar(max),a.[UpabhyantaName])+' '+convert(nvarchar(max),a.[UpAbhiyantaMobile]) as 'उपअभियंता नाव',a.[AmdaracheName] as 'आमदारांचे नाव',a.[KhasdaracheName] as 'खासदारांचे नाव',convert(nvarchar(max),a.[ThekedaarName])+' '+convert(nvarchar(max),a.[ThekedarMobile]) as 'ठेकेदार नाव',convert(nvarchar(max),a.[PrashaskiyKramank])+' '+convert(nvarchar(max),a.[PrashaskiyAmt])+' '+convert(nvarchar(max),a.[PrashaskiyDate])as 'प्रशासकीय मान्यता क्र/रक्कम/दिनांक',convert(nvarchar(max),a.[TrantrikKrmank])+' '+convert(nvarchar(max),a.[TrantrikAmt])+' '+convert(nvarchar(max),a.[TrantrikDate])as 'तांत्रिक मान्यता क्र/रक्कम/दिनांक',a.[Kamachevav] as 'कामाचा वाव',a.[karyarambhadesh] as 'कार्यारंभ आदेश',convert(nvarchar(max),a.[NividaKrmank])+' '+convert(nvarchar(max),a.[NividaDate])as 'निविदा क्र/दिनांक',cast(a.[NividaAmt] as decimal(10,2)) as 'निविदा रक्कम % कमी / जास्त',a.[kamachiMudat] as 'बांधकाम कालावधी',a.[KamPurnDate] as 'काम पूर्ण होण्याचा अपेक्षित दिनांक',convert(nvarchar(max),a.[NividaAmt])+' '+convert(nvarchar(max),b.[MudatVadhiDate]) as 'सुधारित अंदाजित किंमतीचा दिनांक',CAST(CASE WHEN a.[LekhaShirsh] = N'५०५४४२४६'  THEN '1' END as nvarchar(max)) as 'एकूण कामे',b.[DeyakachiSadyasthiti] as 'देयकाची सद्यस्थिती',b.[ManjurAmt] as 'एकूण अंदाजित किंमत (अलिकडील सुधारित)',b.[MarchEndingExpn] as 'मार्च अखेर खर्च 2021',b.[UrvaritAmt] as 'सन 2021-2022 मधील अपेक्षित खर्च',b.[Chalukharch] as 'चालू खर्च',b.[Magilkharch] as 'मागील खर्च',b.[VarshbharatilKharch] as 'सन 2021-2022 मधील माहे एप्रिल/मे अखेरचा खर्च',b.[AikunKharch] as 'एकुण कामावरील खर्च',b.[Takunone] as 'उर्वरित किंमत (6-(8+9))',b.[Takuntwo] as 'द्वितीय तिमाही तरतूद',b.[Takunthree] as 'तृतीय तिमाही तरतूद',b.[Takunfour] as 'चतुर्थ तिमाही तरतूद',b.[Tartud] as '2021-2022 करीता प्रस्तावित तरतूद',b.[Tartud]as 'काम निहाय तरतूद सन 2021-2022',b.[AkunAnudan] as 'वितरित तरतूद',b.[Magni] as 'मागणी 2021-2022',b.[Vidyutprama] as 'विद्युतीकरणावरील प्रमा',b.[Vidyutvitarit] as 'विद्युतीकरणावरील वितरित',b.[Jun] as 'वितरीत तरतूद सन 2021-2022',b.[Itarkhrch] as 'इतर खर्च',b.[Dviguni] as 'दवगुनी ज्ञापने',a.[PahaniMudye] as 'पाहणीमुद्ये',CAST(CASE WHEN a.[Sadyasthiti] = N'पुर्ण'  THEN 1 ELSE 0 END as decimal(10,0)) as 'पुर्ण',CAST(CASE WHEN a.[Sadyasthiti] = N'प्रगतीत'  THEN 1 ELSE 0 END as decimal(10,0)) as 'प्रगतीत',CAST(CASE WHEN a.[Sadyasthiti] = N'सुरू न झालेली'  THEN 1 ELSE 0 END as decimal(10,0)) as 'निविदा स्तर',a.[Shera] as 'शेरा',b.[Apr] as 'Apr',b.[May] as 'May',b.[Jun] as 'Jun',b.[Jul] as 'Jul',b.[Aug] as 'Aug',b.[Sep] as 'Sep',b.[Oct] as 'Oct',b.[Nov] as 'Nov',b.[Dec] as 'Dec',b.[Jan] as 'Jan',b.[Feb] as 'Feb',b.[Mar] as 'Mar' from BudgetMasterDPDC as a join DPDCProvision as b on a.WorkId=b.WorkId   where a.[ThekedaarName]=@name and b.[Arthsankalpiyyear]=@year   union select isNULL ('','')as'अ क्र',  'Total' as 'वर्क आयडी',isNULL ('','') as 'U_WIN', isNULL ('','') as 'योजनेचे नाव',isNULL ('','') as 'सीआरसी (संगणक) संकेतांक',isNULL ('','') as 'उद्यीष्ट संकेतांक(ऑब्जेक्ट कोड)',isNULL (a.[Arthsankalpiyyear],'') as 'अर्थसंकल्पीय वर्ष',isNULL ('','') as 'योजनेचे / कामाचे नांव',isNULL ('','') as 'विभाग', isNULL (a.[Upvibhag],'') as 'उपविभाग', isNULL ('','') as 'तालुका',isNULL ('','') as 'अर्थसंकल्पीय बाब',isNULL ('','') as 'शाखा अभियंता नाव',isNULL ('','') as 'उपअभियंता नाव',isNULL ('','') as 'आमदारांचे नाव',isNULL ('','') as 'खासदारांचे नाव',isNULL ('','') as 'ठेकेदार नाव', isNULL ('','')as 'प्रशासकीय मान्यता क्र/रक्कम/दिनांक', isNULL ('','') as 'तांत्रिक मान्यता क्र/रक्कम/दिनांक',isNULL ('','') as 'कामाचा वाव',isNULL ('','') as 'कार्यारंभ आदेश',isNULL ('','') as 'निविदा क्र/दिनांक',sum(cast(a.[NividaAmt] as decimal(10,2))) as 'निविदा रक्कम % कमी / जास्त',isNULL ('','') as 'बांधकाम कालावधी', isNULL ('','') as 'काम पूर्ण होण्याचा अपेक्षित दिनांक', isNULL ('','') as 'सुधारित अंदाजित किंमतीचा दिनांक',isNULL ('','') as 'एकूण कामे',isNULL ('','') as 'देयकाची सद्यस्थिती',sum(b.[ManjurAmt]) as 'एकूण अंदाजित किंमत (अलिकडील सुधारित)',sum(b.[MarchEndingExpn]) as 'मार्च अखेर खर्च 2021', sum(b.[UrvaritAmt]) as 'सन 2021-2022 मधील अपेक्षित खर्च',sum(b.[Chalukharch])as 'चालू खर्च', sum(b.[Magilkharch]) as 'मागील खर्च',sum(b.[VarshbharatilKharch]) as 'सन 2021-2022 मधील माहे एप्रिल/मे अखेरचा खर्च',sum(b.[AikunKharch]) as 'एकुण कामावरील खर्च',sum(b.[Takunone]) as 'उर्वरित किंमत (6-(8+9))',sum(b.[Takuntwo]) as 'द्वितीय तिमाही तरतूद',sum(b.[Takunthree]) as 'तृतीय तिमाही तरतूद',sum(b.[Takunfour]) as 'चतुर्थ तिमाही तरतूद', sum(b.[Tartud]) as '2021-2022 करीता प्रस्तावित तरतूद', sum(b.[Tartud]) as 'काम निहाय तरतूद सन 2021-2022',sum(b.[AkunAnudan]) as 'वितरित तरतूद', sum(b.[Magni]) as 'मागणी 2021-2022',sum(b.[Vidyutprama]) as 'प्रमा',sum(b.[Vidyutvitarit]) as 'वितरित',sum(b.[Jun]) as 'वितरीत तरतूद सन 2021-2022',sum(b.[Itarkhrch]) as 'इतर खर्च',isNULL ('','') as 'दवगुनी ज्ञापने',isNULL ('','') as 'पाहणीमुद्ये', sum(CAST(CASE WHEN a.[Sadyasthiti] = N'पूर्ण'  THEN 1 ELSE 0 END as decimal(10,0))) as 'पूर्ण', sum( CAST(CASE WHEN a.[Sadyasthiti] = N'प्रगतीत'  THEN 1 ELSE 0 END as decimal(10,0))) as 'प्रगतीत', sum(CAST(CASE WHEN a.[Sadyasthiti] = N'सुरू न झालेली'  THEN 1 ELSE 0 END as decimal(10,0))) as 'निविदा स्तर', isNULL ('','') as 'शेरा',sum (b.[Apr]) as [Apr],sum (b.[May]) as [May],sum (b.[Jun]) as [Jun],sum (b.[Jul]) as [Jul],sum (b.[Aug]) as [Aug],sum (b.[Sep]) as [Sep],sum (b.[Oct]) as [Oct],sum (b.[Nov]) as [Nov],sum (b.[Dec]) as [Dec],sum (b.[Jan]) as [Jan],sum (b.[Feb]) as [Feb],sum (b.[Mar]) as [Mar] from BudgetMasterDPDC as a join DPDCProvision as b on a.WorkId=b.WorkId   where a.[ThekedaarName]=@name and b.[Arthsankalpiyyear]=@year   group by a.[Arthsankalpiyyear], a.[Upvibhag]  ORDER BY a.[Arthsankalpiyyear],a.[upvibhag],a.[Taluka] desc
    `;
    
    const result = await pool
      .request()
      .input("name", name)
      .input("year", year)
      .query(query);
    
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting CRF contractor report details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting CRF contractor report details",
      error: error.message,
    });
  }
};

const ContractorBuildingUpdatePanelApi = async (req, res) => {
  const { office, name } = req.body;
  if (!office || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
    SELECT  [WorkId] as 'वर्क आयडी',[Arthsankalpiyyear] as 'अर्थसंकल्पीय वर्ष',[KamacheName] as 'कामाचे नाव',[Shera] as 'शेरा'  from BudgetMasterBuilding  where ThekedaarName=@name 
      `;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(
      "Error getting contractorGraph details:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error getting contractorGraph details",
      error: error.message,
    });
  }
};

const ContractorCRFUpdatePanelApi = async (req, res) => {
  const { office, name } = req.body;
  if (!office || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
    SELECT [WorkId] as 'WorkId', [Arthsankalpiyyear] as 'Budget of Year', [KamacheName] as 'Name of Work', [Shera] as 'Remark' from BudgetMasterCRF where ThekedaarName=@name
      `;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(
      "Error getting contractorGraph details:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error getting contractorGraph details",
      error: error.message,
    });
  }
};

const ContractorNABARDUpdatePanelApi = async (req, res) => {
  const { office, name } = req.body;
  if (!office || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
SELECT [WorkId] as 'Work Id' , [Arthsankalpiyyear] as 'Budget of Year', [KamacheName]as 'Name of Work', [Shera] as 'Remark' from BudgetMasterNABARD  where ThekedaarName=@name
      `;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(
      "Error getting contractorGraph details:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error getting contractorGraph details",
      error: error.message,
    });
  }
};

const ContractorRoadUpdatePanelApi = async (req, res) => {
  const { office, name } = req.body;
  if (!office || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
    SELECT  [WorkId] as 'वर्क आयडी',[Arthsankalpiyyear] as 'अर्थसंकल्पीय वर्ष',[KamacheName] as 'कामाचे नाव',[Shera] as 'शेरा'  from BudgetMasterRoad  where ThekedaarName=@name
      `;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(
      "Error getting contractorGraph details:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error getting contractorGraph details",
      error: error.message,
    });
  }
};

const ContractorAuntyUpdatePanelApi = async (req, res) => {
  const { office, name } = req.body;
  if (!office || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
    SELECT  [WorkId] as 'वर्क आयडी',[Arthsankalpiyyear] as 'अर्थसंकल्पीय वर्ष',[KamacheName] as 'कामाचे नाव',[Shera] as 'शेरा'  from BudgetMasterAunty  where ThekedaarName=@name  
      `;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(
      "Error getting contractorGraph details:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error getting contractorGraph details",
      error: error.message,
    });
  }
};

const DEBuildingUpdatePanelApi = async (req, res) => {
  const { office, name } = req.body;
  if (!office || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
    SELECT  [WorkId] as 'वर्क आयडी',[Arthsankalpiyyear] as 'अर्थसंकल्पीय वर्ष',[KamacheName] as 'कामाचे नाव',[Shera] as 'शेरा'  from BudgetMasterBuilding  where UpabhyantaName=@name 
      `;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(
      "Error getting contractorGraph details:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error getting contractorGraph details",
      error: error.message,
    });
  }
};
const DECRFUpdatePanelApi = async (req, res) => {
  const { office, name } = req.body;
  if (!office || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
    SELECT  [WorkId] as 'वर्क आयडी',[Arthsankalpiyyear] as 'अर्थसंकल्पीय वर्ष',[KamacheName] as 'कामाचे नाव',[Shera] as 'शेरा'  from BudgetMasterBuilding  where UpabhyantaName=@name 
      `;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(
      "Error getting contractorGraph details:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error getting contractorGraph details",
      error: error.message,
    });
  }
};
const DENABARDUpdatePanelApi = async (req, res) => {
  const { office, name } = req.body;
  if (!office || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
    SELECT  [WorkId] as 'वर्क आयडी',[Arthsankalpiyyear] as 'अर्थसंकल्पीय वर्ष',[KamacheName] as 'कामाचे नाव',[Shera] as 'शेरा'  from BudgetMasterBuilding  where UpabhyantaName=@name 
      `;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(
      "Error getting contractorGraph details:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error getting contractorGraph details",
      error: error.message,
    });
  }
};
const DERoadUpdatePanelApi = async (req, res) => {
  const { office, name } = req.body;
  if (!office || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
    SELECT  [WorkId] as 'वर्क आयडी',[Arthsankalpiyyear] as 'अर्थसंकल्पीय वर्ष',[KamacheName] as 'कामाचे नाव',[Shera] as 'शेरा'  from BudgetMasterRoad  where UpabhyantaName=@name 
      `;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(
      "Error getting contractorGraph details:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error getting contractorGraph details",
      error: error.message,
    });
  }
};
const DEAuntyUpdatePanelApi = async (req, res) => {
  const { office, name } = req.body;
  if (!office || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
    SELECT  [WorkId] as 'वर्क आयडी',[Arthsankalpiyyear] as 'अर्थसंकल्पीय वर्ष',[KamacheName] as 'कामाचे नाव',[Shera] as 'शेरा'  from BudgetMasterBuilding  where UpabhyantaName=@name 
      `;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(
      "Error getting contractorGraph details:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error getting contractorGraph details",
      error: error.message,
    });
  }
};

const ContUpdPanelBuilding = async (req, res) => {
  const { office, name } = req.body;
  if (!office || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
SELECT  [WorkId] as 'वर्क आयडी',[Arthsankalpiyyear] as 'अर्थसंकल्पीय वर्ष',[KamacheName] as 'कामाचे नाव',[Shera] as 'शेरा'  from BudgetMasterBuilding   where ShakhaAbhyantaName=@name or [UpabhyantaName]=@name or ThekedaarName=@name       `;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(
      "Error getting contractorGraph details:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error getting contractorGraph details",
      error: error.message,
    });
  }
};

const ContUpdPanelCrf = async (req, res) => {
  const { office, name } = req.body;
  if (!office || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `SELECT  [WorkId] as 'वर्क आयडी',[Arthsankalpiyyear] as 'अर्थसंकल्पीय वर्ष',[KamacheName] as 'कामाचे नाव',[Shera] as 'शेरा'  from BudgetMasterCRF   where ShakhaAbhyantaName=@name  or [UpabhyantaName]=@name  or ThekedaarName=@name `;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(
      "Error getting contractorGraph details:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error getting contractorGraph details",
      error: error.message,
    });
  }
};

const ContUpdPanelNABARD = async (req, res) => {
  const { office, name } = req.body;
  if (!office || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `SELECT  [WorkId] as 'वर्क आयडी',[Arthsankalpiyyear] as 'अर्थसंकल्पीय वर्ष',[KamacheName] as 'कामाचे नाव',[Shera] as 'शेरा'  from BudgetMasterNabard   where ShakhaAbhyantaName=@name  or [UpabhyantaName]=@name  or ThekedaarName=@name  `;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(
      "Error getting contractorGraph details:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error getting contractorGraph details",
      error: error.message,
    });
  }
};

const ContUpdPanelROAD = async (req, res) => {
  const { office, name } = req.body;
  if (!office || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `SELECT  [WorkId] as 'वर्क आयडी',[Arthsankalpiyyear] as 'अर्थसंकल्पीय वर्ष',[KamacheName] as 'कामाचे नाव',[Shera] as 'शेरा'  from BudgetMasterRoad   where ShakhaAbhyantaName=@name  or [UpabhyantaName]=@name  or ThekedaarName=@name    `;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(
      "Error getting contractorGraph details:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error getting contractorGraph details",
      error: error.message,
    });
  }
};

const ContUpdPanelAunty = async (req, res) => {
  const { office, name } = req.body;
  if (!office || !name) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `SELECT  [WorkId] as 'वर्क आयडी',[Arthsankalpiyyear] as 'अर्थसंकल्पीय वर्ष',[KamacheName] as 'कामाचे नाव',[Shera] as 'शेरा'  from BudgetMasterAunty   where ShakhaAbhyantaName=@name  or [UpabhyantaName]=@name  or ThekedaarName=@name   `;
    const result = await pool.request().input("name", name).query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(
      "Error getting contractorGraph details:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error getting contractorGraph details",
      error: error.message,
    });
  }
};
const ContUpdPhotoBuilding = async (req, res) => {
  const { office } = req.body;
  if (!office) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `Select [ImageId], [WorkId],[Image],[Description] from ImageGallary where WorkId='220348400046.00' and Type='Building' order by ImageId desc `;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(
      "Error getting contractorGraph details:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error getting contractorGraph details",
      error: error.message,
    });
  }
};
const ContUpdPhotoCrf = async (req, res) => {
  const { office } = req.body;
  if (!office) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `Select [ImageId], [WorkId],[Image],[Description] from ImageGallary where WorkId='2212000400047' and Type='CRF' order by ImageId desc
 `;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(
      "Error getting contractorGraph details:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error getting contractorGraph details",
      error: error.message,
    });
  }
};
const ContUpdPhotoNabard = async (req, res) => {
  const { office } = req.body;
  if (!office) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `Select [ImageId], [WorkId],[Image],[Description] from ImageGallary where WorkId='2212000400047' and Type='Nabard' order by ImageId desc  `;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(
      "Error getting contractorGraph details:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error getting contractorGraph details",
      error: error.message,
    });
  }
};
const ContUpdPhotoRoad = async (req, res) => {
  const { office } = req.body;
  if (!office) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `Select [ImageId], [WorkId],[Image],[Description] from ImageGallary where WorkId='2212000400047' and Type='Road' order by ImageId desc   `;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(
      "Error getting contractorGraph details:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error getting contractorGraph details",
      error: error.message,
    });
  }
};

const ContUpdPhotoAunty = async (req, res) => {
  const { office } = req.body;

  if (!office) {
    return res.status(400).json({
      success: false,
      message: "Parameter 'office' is required",
    });
  }

  try {
    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const query = `
      SELECT [ImageId], [WorkId], [Image], [Description]
      FROM ImageGallary
      WHERE WorkId = '2212000400047' AND Type = 'Aunty'
      ORDER BY ImageId DESC
    `;

    const result = await pool.request().query(query);

    return res.status(200).json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error fetching image data:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching image data",
      error: error.message,
    });
  }
};

const ShowImage = async (req, res) => {
  const { office, name } = req.body;

  if (!office) {
    return res.status(400).json({
      success: false,
      message: "Parameter 'office' is required",
    });
  }

  try {
    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const query = `
      SELECT ig.WorkId, ig.Image
FROM ImageGallary ig
JOIN (
    SELECT WorkId FROM BudgetMasterBuilding
    WHERE ShakhaAbhyantaName = @NAME
       OR UpAbhyantaName = @NAME
       OR ThekedaarName = @NAME
    
    UNION
    
    SELECT WorkId FROM BudgetMasterRoad
    WHERE ShakhaAbhyantaName = @NAME
       OR UpAbhyantaName = @NAME
       OR ThekedaarName = @NAME
    
    UNION

	SELECT WorkId FROM BudgetMasterNABARD
    WHERE ShakhaAbhyantaName = @NAME
       OR UpAbhyantaName = @NAME
       OR ThekedaarName = @NAME
    
    UNION

	SELECT WorkId FROM BudgetMasterCRF
    WHERE ShakhaAbhyantaName = @NAME
       OR UpAbhyantaName = @NAME
       OR ThekedaarName = @NAME
    
    UNION
    
    SELECT WorkId FROM BudgetMasterAunty
    WHERE ShakhaAbhyantaName = @NAME
       OR UpAbhyantaName = @NAME
       OR ThekedaarName = @NAME
) AS matchedWorks
ON ig.WorkId = matchedWorks.WorkId;
    `;

    const result = await pool.request().input("NAME", name).query(query);

    const dataWithBase64 = result.recordset.map((row) => ({
      WorkId: row.WorkId,
      Image: row.Image ? row.Image.toString("base64") : null,
    }));

    return res.status(200).json({
      success: true,
      data: dataWithBase64,
    });
  } catch (error) {
    console.error("Error fetching image data:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching image data",
      error: error.message,
    });
  }
};

const uploadImage = async (req, res) => {
  const { office, Data, filename, Content, Longitude, Latitude, WorkId, Type, Description } = req.body;

  if (!office || !Data || !filename || !Content || Longitude == null || Latitude == null) {
    return res.status(400).json({
      success: false,
      message: "Parameters 'office', 'Data', 'Latitude','Longitude', 'filename', and 'Content' are required",
    });
  }

  try {
    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const query = `
      INSERT INTO [ImageGallary]
      ([WorkId], [Type], [Image], [ContentType], [Filepath], [Description], [Longitude], [Latitude])
      VALUES (@WorkId, @Type, @Data, @Content, @Filename, @Description, @Longitude, @Latitude)
    `;

    await pool
      .request()
      .input("WorkId", sql.NVarChar, WorkId)
      .input("Type", sql.NVarChar, Type)
      .input("Data", sql.VarBinary(sql.MAX), Buffer.from(Data, 'base64'))      
      .input("Content", sql.NVarChar, Content)
      .input("Filename", sql.NVarChar, filename)
      .input("Description", sql.NVarChar, Description)
      .input("Longitude", sql.Float, Longitude)
      .input("Latitude", sql.Float, Latitude)
      .query(query);

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return res.status(500).json({
      success: false,
      message: "Error uploading image",
      error: error.message,
    });
  }
};


const allImage = async (req, res) => {
  const { office } = req.body;

  if (!office) {
    return res.status(400).json({
      success: false,
      message: "office is required",
    });
  }

  try {
    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const query = `
      SELECT Image, KamacheName, Longitude, Latitude, ContentType
      FROM [ImageGallary]
    `;

    const result = await pool.request().query(query);

    const images = result.recordset.map((row) => {
      const base64Image = Buffer.from(row.Image).toString("base64");
      const imageSrc = `data:${row.ContentType};base64,${base64Image}`;
      return {
        image: imageSrc,
        KamacheName: row.KamacheName,
        Longitude: row.Longitude,
        Latitude: row.Latitude,
      };
    });

    return res.status(200).json({
      success: true,
      data: images,
    });
  } catch (error) {
    console.error("Error fetching images:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching images",
      error: error.message,
    });
  }
};


const EEUpdPanelBuilding = async (req, res) => {
  const { office } = req.body;
  if (!office) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
SELECT 
    B.[WorkId] AS 'वर्क आयडी',
    B.[Arthsankalpiyyear] AS 'अर्थसंकल्पीय वर्ष',
    B.[KamacheName] AS 'कामाचे नाव',
    B.[Shera] AS 'शेरा',
    I.[Image] AS 'प्रतिमा'
FROM 
    BudgetMasterBuilding B
LEFT JOIN 
    ImageGallary I ON B.WorkId = I.WorkId `;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(
      "Error getting contractorGraph details:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error getting contractorGraph details",
      error: error.message,
    });
  }
};

const EEUpdPanelCrf = async (req, res) => {
  const { office } = req.body;
  if (!office) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    const query = `
      SELECT 
        B.[WorkId] AS WorkId,
        B.[Arthsankalpiyyear] AS Arthsankalpiyyear,
        B.[KamacheName] AS KamacheName,
        B.[Shera] AS Shera,
        I.[Image] AS Image,
        I.[ContentType] AS ContentType
      FROM 
        BudgetMasterCRF B
      LEFT JOIN 
        ImageGallary I ON B.WorkId = I.WorkId`;

    const result = await pool.request().query(query);

    // const images = result.recordset.map((row) => {
    //   const base64Image = row.Image
    //     ? `data:${row.ContentType};base64,${Buffer.from(row.Image).toString("base64")}`
    //     : null;

    //   return {
    //     image: base64Image,
    //     WorkId: row.WorkId,
    //     Arthsankalpiyyear: row.Arthsankalpiyyear,
    //     KamacheName: row.KamacheName,
    //     Shera: row.Shera,
    //   };
    // });

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting contractorGraph details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting contractorGraph details",
      error: error.message,
    });
  }
};


const EEUpdPanelROAD = async (req, res) => {
  const { office} = req.body;
  if (!office) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    //const query = `SELECT  [WorkId] as 'वर्क आयडी',[Arthsankalpiyyear] as 'अर्थसंकल्पीय वर्ष',[KamacheName] as 'कामाचे नाव',[Shera] as 'शेरा'  from BudgetMasterRoad  `;
const query = `SELECT 
    B.[WorkId] AS 'वर्क आयडी',
    B.[Arthsankalpiyyear] AS 'अर्थसंकल्पीय वर्ष',
    B.[KamacheName] AS 'कामाचे नाव',
    B.[Shera] AS 'शेरा',
    I.[Image] AS 'प्रतिमा'
FROM 
    BudgetMasterRoad B
LEFT JOIN 
    ImageGallary I ON B.WorkId = I.WorkId`
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(
      "Error getting contractorGraph details:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error getting contractorGraph details",
      error: error.message,
    });
  }
};

const EEUpdPanelAunty = async (req, res) => {
  const { office} = req.body;
  if (!office) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    //const query = `SELECT  [WorkId] as 'वर्क आयडी',[Arthsankalpiyyear] as 'अर्थसंकल्पीय वर्ष',[KamacheName] as 'कामाचे नाव',[Shera] as 'शेरा'  from BudgetMasterAunty  `;
const query = `SELECT 
    B.[WorkId] AS 'वर्क आयडी',
    B.[Arthsankalpiyyear] AS 'अर्थसंकल्पीय वर्ष',
    B.[KamacheName] AS 'कामाचे नाव',
    B.[Shera] AS 'शेरा',
    I.[Image] AS 'प्रतिमा'
FROM 
    BudgetMasterAunty B
LEFT JOIN 
    ImageGallary I ON B.WorkId = I.WorkId`;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(
      "Error getting contractorGraph details:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error getting contractorGraph details",
      error: error.message,
    });
  }
};

const EEUpdPanelNABARD = async (req, res) => {
  const { office} = req.body;
  if (!office) {
    return res
      .status(400)
      .json({ success: false, message: "parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    //const query = `SELECT  [WorkId] as 'वर्क आयडी',[Arthsankalpiyyear] as 'अर्थसंकल्पीय वर्ष',[KamacheName] as 'कामाचे नाव',[Shera] as 'शेरा'  from BudgetMasterNABARD  `;
const query = `SELECT 
    B.[WorkId] AS 'वर्क आयडी',
    B.[Arthsankalpiyyear] AS 'अर्थसंकल्पीय वर्ष',
    B.[KamacheName] AS 'कामाचे नाव',
    B.[Shera] AS 'शेरा',
    I.[Image] AS 'प्रतिमा'
FROM 
    BudgetMasterNABARD B
LEFT JOIN 
    ImageGallary I ON B.WorkId = I.WorkId`;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(
      "Error getting contractorGraph details:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error getting contractorGraph details",
      error: error.message,
    });
  }
};

const UpdateStatusBuilding = async (req, res) => {
  const { office, workID, status } = req.body;

  if (!office || !workID || status === undefined) {
    return res.status(400).json({
      success: false,
      message: "Parameters 'office', 'workID', and 'status' are required",
    });
  }

  try {
    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    // const query = `
    //   UPDATE [ImageGallary]
    //   SET [Description] = @Status
    //   WHERE [WorkId] = @WorkId AND [Type] = 'Building'
    // `;
    const query = `update BudgetMasterBuilding 
	  SET Shera = @Status
    WHERE [WorkId] = @WorkId`;

    const result = await pool
      .request()
      .input("WorkId", sql.NVarChar, workID)
      .input("Status", sql.NVarChar, status)
      .query(query);

    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
    });
  } catch (error) {
    console.error("Error updating status:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating status",
      error: error.message,
    });
  }
};

const UpdateStatusAunty = async (req, res) => {
  const { office, workID, status } = req.body;

  if (!office || !workID || status === undefined) {
    return res.status(400).json({
      success: false,
      message: "Parameters 'office', 'workID', and 'status' are required",
    });
  }

  try {
    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const query = `
    update BudgetMasterAunty 
	  SET Shera = @Status
    WHERE [WorkId] = @WorkId
    `;

    const result = await pool
      .request()
      .input("WorkId", sql.NVarChar, workID)
      .input("Status", sql.NVarChar, status)
      .query(query);

    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
    });
  } catch (error) {
    console.error("Error updating status:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating status",
      error: error.message,
    });
  }
};

const UpdateStatusCrf = async (req, res) => {
  const { office, workID, status } = req.body;

  if (!office || !workID || status === undefined) {
    return res.status(400).json({
      success: false,
      message: "Parameters 'office', 'workID', and 'status' are required",
    });
  }

  try {
    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const query = `
      update BudgetMasterCRF 
	  SET Shera = @Status
    WHERE [WorkId] = @WorkId
    `;

    const result = await pool
      .request()
      .input("WorkId", sql.NVarChar, workID)
      .input("Status", sql.NVarChar, status)
      .query(query);

    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
    });
  } catch (error) {
    console.error("Error updating status:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating status",
      error: error.message,
    });
  }
};

const UpdateStatusRoad = async (req, res) => {
  const { office, workID, status } = req.body;

  if (!office || !workID || status === undefined) {
    return res.status(400).json({
      success: false,
      message: "Parameters 'office', 'workID', and 'status' are required",
    });
  }

  try {
    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const query = `
      update BudgetMasterRoad
	  SET Shera = @Status
    WHERE [WorkId] = @WorkId
    `;

    const result = await pool
      .request()
      .input("WorkId", sql.NVarChar, workID)
      .input("Status", sql.NVarChar, status)
      .query(query);

    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
    });
  } catch (error) {
    console.error("Error updating status:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating status",
      error: error.message,
    });
  }
};

const UpdateStatusNabard = async (req, res) => {
  const { office, workID, status } = req.body;

  if (!office || !workID || status === undefined) {
    return res.status(400).json({
      success: false,
      message: "Parameters 'office', 'workID', and 'status' are required",
    });
  }

  try {
    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const query = `
      update BudgetMasterNABARD
	  SET Shera = @Status
    WHERE [WorkId] = @WorkId
    `;

    const result = await pool
      .request()
      .input("WorkId", sql.NVarChar, workID)
      .input("Status", sql.NVarChar, status)
      .query(query);

    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
    });
  } catch (error) {
    console.error("Error updating status:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating status",
      error: error.message,
    });
  }
};


//CIRCLE

const CircleChartCount = async (req, res) => {
  const { office } = req.body;
  if (!office) {
    return res
      .status(400)
      .json({ success: false, message: "Office parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Query one provision table, adjust if needed
    const query = `
    select (select  count(type) from BudgetMasterBuilding )as Building,(select  count(type)from  BudgetMasterCRF ) as CRF,(select  count(type) from BudgetMasterAunty )as Annuity,(select  count(type) from BudgetMasterDepositFund )as Deposit, (select  count(type)from  BudgetMasterDPDC ) as DPDC,(select  count(type)from  BudgetMasterGAT_A ) as Gat_A,(select  count(type)from  BudgetMasterGAT_D ) as Gat_D,(select  count(type)from  BudgetMasterGAT_FBC ) as Gat_BCF,(select  count(type)from  BudgetMasterMLA ) as MLA,(select  count(type)from  BudgetMasterMP ) as MP,(select  count(type)from  BudgetMasterNABARD ) as Nabard,(select  count(type)from  BudgetMasterRoad where[type]='Road') as Road,(select  count(type)from  BudgetMasterNonResidentialBuilding ) as '2059',(select  count(type)from  BudgetMasterResidentialBuilding ) as '2216' ,(select count(type)from [BudgetMaster2515]) as '2515'
`;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting budgetcount from circle", error);
    res.status(500).json({
      success: false,
      message: "Error getting budget count from circle",
      error: error.message,
    });
  }
};

const CirclePieChartCount = async (req, res) => {
  const { office } = req.body;
  if (!office) {
    return res
      .status(400)
      .json({ success: false, message: "Office parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Query one provision table, adjust if needed
    const query = `
    SELECT 'Building' AS Head, COUNT(*)as'Count' FROM BudgetMasterBuilding UNION SELECT 'CRF' AS Head, COUNT(*)as'Count' FROM BudgetMasterCRF UNION SELECT 'Annuity' AS Head, COUNT(*)as'Count' FROM BudgetMasterAunty UNION SELECT 'Deposit' AS Head, COUNT(*)as'Count' FROM BudgetMasterDepositFund UNION SELECT 'DPDC' AS Head, COUNT(*)as'Count' FROM BudgetMasterDPDC UNION SELECT 'Gat_A' AS Head, COUNT(*)as'Count' FROM BudgetMasterGAT_A UNION SELECT 'Gat_D' AS Head, COUNT(*)as'Count' FROM BudgetMasterGAT_D UNION SELECT 'Gat_BCF' AS Head, COUNT(*)as'Count' FROM BudgetMasterGAT_FBC  UNION SELECT 'MLA' AS Head, COUNT(*)as'Count' FROM BudgetMasterMLA  UNION SELECT 'MP' AS Head, COUNT(*)as'Count' FROM BudgetMasterMP UNION SELECT 'Nabard' AS Head, COUNT(*)as'Count' FROM BudgetMasterNABARD UNION SELECT 'NRB' AS Head, COUNT(*)as'Count' FROM BudgetMasterNonResidentialBuilding UNION SELECT 'RB' AS Head, COUNT(*)as'Count' FROM BudgetMasterResidentialBuilding UNION SELECT '2515' AS Head, COUNT(*)as'Count' FROM [BudgetMaster2515] 
UNION SELECT 'Road' AS Head, COUNT(*)as'Count' FROM BudgetMasterRoad where[type]='Road'
`;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting budgetcount from circle", error);
    res.status(500).json({
      success: false,
      message: "Error getting budget count from circle",
      error: error.message,
    });
  }
};

const CircleNotificationToday = async (req, res) => {
  const { office } = req.body;
  if (!office) {
    return res
      .status(400)
      .json({ success: false, message: "Office parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Query one provision table, adjust if needed
    const query = `
    select  Count (*) as nCount from SendSms_tbl where convert(date,KamPurnDate,105) between CONVERT(date,GETDATE(),105) and convert(date,dateadd(day,00,GETDATE()),105)
`;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting budgetcount from circle", error);
    res.status(500).json({
      success: false,
      message: "Error getting budget count from circle",
      error: error.message,
    });
  }
};

const CircleNotificationWeek = async (req, res) => {
  const { office } = req.body;
  if (!office) {
    return res
      .status(400)
      .json({ success: false, message: "Office parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Query one provision table, adjust if needed
    const query = `
select  Count (*) as nCount from SendSms_tbl where convert(date,KamPurnDate,105) between CONVERT(date,GETDATE(),105) and convert(date,dateadd(day,07,GETDATE()),105)
`;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting budgetcount from circle", error);
    res.status(500).json({
      success: false,
      message: "Error getting budget count from circle",
      error: error.message,
    });
  }
};

const CircleNotificationHalfMonth = async (req, res) => {
  const { office } = req.body;
  if (!office) {
    return res
      .status(400)
      .json({ success: false, message: "Office parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Query one provision table, adjust if needed
    const query = `
select  Count (*) as nCount from SendSms_tbl where convert(date,KamPurnDate,105) between CONVERT(date,GETDATE(),105) and convert(date,dateadd(day,15,GETDATE()),105)
`;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting budgetcount from circle", error);
    res.status(500).json({
      success: false,
      message: "Error getting budget count from circle",
      error: error.message,
    });
  }
};

const CircleNotificationMonth = async (req, res) => {
  const { office } = req.body;
  if (!office) {
    return res
      .status(400)
      .json({ success: false, message: "Office parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Query one provision table, adjust if needed
    const query = `
select  Count (*) as nCount from SendSms_tbl where convert(date,KamPurnDate,105) between CONVERT(date,GETDATE(),105) and convert(date,dateadd(day,30,GETDATE()),105)
`;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting budgetcount from circle", error);
    res.status(500).json({
      success: false,
      message: "Error getting budget count from circle",
      error: error.message,
    });
  }
};


//helper function to get database pool
async function fetchNotifications(pool, dayRange) {
  const query = `
    SELECT 
      ShakhaAbhyantaName,
      ShakhaAbhiyantMobile,
      UpabhyantaName,
      UpAbhiyantaMobile,
      ThekedaarName,
      ThekedarMobile,
      kampurndate,
      workid,
      kamachename,
      subdivision 
    FROM sendsms_tbl 
    WHERE CONVERT(date, KamPurnDate, 105) 
      BETWEEN CONVERT(date, GETDATE(), 105) 
      AND CONVERT(date, DATEADD(day, ${dayRange}, GETDATE()), 105)`;

  const result = await pool.request().query(query);
  const currentDate = new Date();
  const notifications = [];

  function toDate(str) {
  const [day, month, year] = str.split(/[.\-\/]/);
  return new Date(`${year}-${month}-${day}`);
}

  for (const record of result.recordset) {
    const completionDate = toDate(record.kampurndate);
    const remainingDays = completionDate
      ? Math.ceil((completionDate - currentDate) / (1000 * 60 * 60 * 24))
      : null;

    const messageText = `Dear Contractor, Reminder for your ongoing work. Work ID (${record.workid}), Completion Date (${completionDate ? completionDate.toLocaleDateString("en-GB") : record.kampurndate}). Remaining Days: ${remainingDays ?? "NA"}. Ensure timely completion. SBA, PWCA, GOM-Swapsoft`;

    const mobileNumbers = [
      record.ShakhaAbhiyantMobile,
      record.UpAbhiyantaMobile,
      record.ThekedarMobile,
    ].filter(Boolean);

    // Send SMS concurrently, ignore individual failures
    await Promise.allSettled(
      mobileNumbers.map((num) => sendSMS(num.toString(), messageText))
    );

    notifications.push({
      contractor: record.ThekedaarName,
      shakhaAbhyanta: record.ShakhaAbhyantaName,
      upabhyanta: record.UpabhyantaName,
      mobiles: mobileNumbers,
      message: messageText,
      remainingDays,
      workId: record.workid,
      completionDate: record.kampurndate,
      kamachename: record.kamachename,
      subdivision: record.subdivision,
    });
  }

  return notifications;
}


const CircleNotificationBtnToday = async (req, res) => {
  const { office } = req.body;

  if (!office) {
    return res.status(400).json({ success: false, message: "Office parameter is required" });
  }

  try {
    const pool = await getPool(office);
    if (!pool) throw new Error(`Database pool is not available for office ${office}.`);

    const messages = await fetchNotifications(pool, 0); // Same-day reminders
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error("Error sending today's notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error sending today's notifications",
      error: error.message,
    });
  }
};


const CircleNotificationBtnWeek = async (req, res) => {
  const { office } = req.body;

  if (!office) {
    return res.status(400).json({ success: false, message: "Office parameter is required" });
  }

  try {
    const pool = await getPool(office);
    if (!pool) throw new Error(`Database pool is not available for office ${office}.`);

    const messages = await fetchNotifications(pool, 7); // Next 7 days
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error("Error sending weekly notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error sending weekly notifications",
      error: error.message,
    });
  }
};


const CircleNotificationBtnHalfMonth = async (req, res) => {
  const { office } = req.body;

  if (!office) {
    return res.status(400).json({
      success: false,
      message: "Office parameter is required"
    });
  }

  try {
    const pool = await getPool(office);
    if (!pool) throw new Error(`Database pool is not available for office ${office}.`);

    const messages = await fetchNotifications(pool, 15); // 15 days ahead

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error("Error getting notifications (Half Month)", error);
    res.status(500).json({
      success: false,
      message: "Error getting half-month notification data",
      error: error.message,
    });
  }
};

const CircleNotificationBtnMonth = async (req, res) => {
  const { office } = req.body;

  if (!office) {
    return res.status(400).json({
      success: false,
      message: "Office parameter is required"
    });
  }

  try {
    const pool = await getPool(office);
    if (!pool) throw new Error(`Database pool is not available for office ${office}.`);

    const messages = await fetchNotifications(pool, 30); // 30 days ahead

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error("Error getting notifications (Month)", error);
    res.status(500).json({
      success: false,
      message: "Error getting monthly notification data",
      error: error.message,
    });
  }
};


const getCircleNotificationTotal = async (req, res) => {
  const { office } = req.body;
  if (!office) {
    return res.status(400).json({
      success: false,
      message: "Office parameter is required",
    });
  }

  try {
    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const urls = [
      "https://Sghitech.up.railway.app/api/budget/CircleNotificationToday",
      "https://Sghitech.up.railway.app/api/budget/CircleNotificationWeek",
      "https://Sghitech.up.railway.app/api/budget/CircleNotificationHalfMonth",
      "https://Sghitech.up.railway.app/api/budget/CircleNotificationMonth",
    ];

    const responses = await Promise.all(urls.map(url =>
      axios.post(url, { office }) // use POST with office in body
    ));

    const totalCount = responses.reduce((sum, response) => {
      if (response.data.success && Array.isArray(response.data.data)) {
        return sum + (response.data.data[0]?.nCount || 0);
      }
      return sum;
    }, 0);

    return res.json({ success: true, totalCount });
  } catch (error) {
    console.error("Error calculating total CircleNotification count:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error calculating total CircleNotification count",
      error: error.message,
    });
  }
};



const getBudgetData = (tableName) => {
  return async (req, res) => {
    const { office } = req.body;
    if (!office) {
      return res.status(400).json({
        success: false,
        message: "Office parameter is required",
      });
    }

    try {
      const pool = await getPool(office);
      if (!pool)
        throw new Error(`Database pool is not available for office ${office}.`);

      const query = `SELECT WorkId, KamacheName FROM ${tableName}`;
      const result = await pool.request().query(query);

      res.json({ success: true, data: result.recordset });
    } catch (error) {
      console.error(`Error fetching data from ${tableName}:`, error);
      res.status(500).json({
        success: false,
        message: `Error fetching data from ${tableName}`,
        error: error.message,
      });
    }
  };
};

const getBuilding = getBudgetData("BudgetMasterBuilding");
const getResidentialBuilding = getBudgetData("BudgetMasterResidentialBuilding");
const getNonResidentialBuilding = getBudgetData("BudgetMasterNonResidentialBuilding");
const getCRF = getBudgetData("BudgetMasterCRF");
const getDepositFund = getBudgetData("BudgetMasterDepositFund");
const getDPDC = getBudgetData("BudgetMasterDPDC");
const getAunty = getBudgetData("BudgetMasterAunty");
const getRoad = getBudgetData("BudgetMasterRoad");
const getNABARD = getBudgetData("BudgetMasterNABARD");
const getGATA = getBudgetData("BudgetMasterGAT_A");
const getGATFBC = getBudgetData("BudgetMasterGAT_FBC");
const getGATD = getBudgetData("BudgetMasterGAT_D");
const getMLA = getBudgetData("BudgetMasterMLA");
const get2515 = getBudgetData("BudgetMaster2515");


module.exports = {
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
  ContUpdPanelAunty,
  ContUpdPhotoAunty,
  ContUpdPhotoRoad,
  ContUpdPhotoCrf,
  ContUpdPhotoNabard,
  ContUpdPhotoBuilding,
  ShowImage,
  uploadImage,
  UpdateStatusBuilding,
  UpdateStatusAunty,
  UpdateStatusRoad,
  UpdateStatusNabard,
  UpdateStatusCrf,
  allImage,
  EEUpdPanelAunty,
  EEUpdPanelROAD,
  EEUpdPanelCrf,
  EEUpdPanelNABARD,
  EEUpdPanelBuilding,

  CircleChartCount,
  CirclePieChartCount,
   CircleNotificationToday,
  CircleNotificationWeek,
  CircleNotificationHalfMonth,
  CircleNotificationMonth,
  CircleNotificationBtnToday,
  CircleNotificationBtnWeek,
  CircleNotificationBtnHalfMonth,
  CircleNotificationBtnMonth,
  getCircleNotificationTotal,
    getBuilding,
  getResidentialBuilding,
  getNonResidentialBuilding,
  getCRF,
  getDepositFund,
  getDPDC,
  getAunty,
  getRoad,
  getNABARD,
  getGATA,
  getGATFBC,
  getGATD,
  getMLA,
  get2515,
};
