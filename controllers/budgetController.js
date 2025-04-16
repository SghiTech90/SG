const { getPool, sql } = require("../config/db");

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
            ORDER BY m.LekhaShirshName;
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
SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'Estimated Cost',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'T.S Cost',sum(cast(b.[Tartud]as decimal(10,2))) as 'Budget Provision 2023-2024',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Expenditure 2023-2024' FROM BudgetMasterAunty a full outer join AuntyProvision  b on a.workid=b.workid where a.[Sadyasthiti]IS NOT NULL and b.Arthsankalpiyyear='2023-2024'   GROUP BY a.[Sadyasthiti] order by case a.[Sadyasthiti] when N'पूर्ण' then 1 when N'Completed' then 1 when N'Incomplete' then 2 when N'अपूर्ण' then 2 when N'प्रगतीत' then 3 when N'Inprogress' then 3 when N'Processing' then 3 when N'Current' then 3 when N'चालू' then 3  when N'Tender Stage' then 4 when N'निविदा स्तर' then 4 when N'Estimated Stage' then 5 when N'अंदाजपत्रकिय स्थर' then 5 when N'अंदाजपत्रकीय स्तर' then 5 when N'Not Started' then 6 when N'सुरु न झालेली' then 6 when N'सुरू करणे' then 7 when N'' then 8 end`;
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
          SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'Estimated Cost',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'T.S Cost',sum(cast(b.[Tartud]as decimal(10,2))) as 'Budget Provision 2023-2024',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Expenditure 2023-2024' FROM BudgetMasterBuilding a full outer join BuildingProvision  b on a.workid=b.workid where a.[Sadyasthiti]IS NOT NULL and b.Arthsankalpiyyear='2023-2024'   GROUP BY a.[Sadyasthiti] order by case a.[Sadyasthiti] when N'पूर्ण' then 1 when N'Completed' then 1 when N'Incomplete' then 2 when N'अपूर्ण' then 2 when N'प्रगतीत' then 3 when N'Inprogress' then 3 when N'Processing' then 3 when N'Current' then 3 when N'चालू' then 3  when N'Tender Stage' then 4 when N'निविदा स्तर' then 4 when N'Estimated Stage' then 5 when N'अंदाजपत्रकिय स्थर' then 5 when N'अंदाजपत्रकीय स्तर' then 5 when N'Not Started' then 6 when N'सुरु न झालेली' then 6 when N'सुरू करणे' then 7 when N'' then 8 end`;
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
          SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'Estimated Cost',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'T.S Cost',sum(cast(b.[Tartud]as decimal(10,2))) as 'Budget Provision 2023-2024',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Expenditure 2023-2024' FROM BudgetMasterCRF a full outer join CRFProvision  b on a.workid=b.workid where a.[Sadyasthiti]IS NOT NULL and b.Arthsankalpiyyear='2023-2024'   GROUP BY a.[Sadyasthiti] order by case a.[Sadyasthiti] when N'पूर्ण' then 1 when N'Completed' then 1 when N'Incomplete' then 2 when N'अपूर्ण' then 2 when N'प्रगतीत' then 3 when N'Inprogress' then 3 when N'Processing' then 3 when N'Current' then 3 when N'चालू' then 3  when N'Tender Stage' then 4 when N'निविदा स्तर' then 4 when N'Estimated Stage' then 5 when N'अंदाजपत्रकिय स्थर' then 5 when N'अंदाजपत्रकीय स्तर' then 5 when N'Not Started' then 6 when N'सुरु न झालेली' then 6 when N'सुरू करणे' then 7 when N'' then 8 end`;
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
    const query = `SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'Estimated Cost',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'T.S Cost',sum(cast(b.[Tartud]as decimal(10,2))) as 'Budget Provision 2023-2024',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Expenditure 2023-2024' FROM BudgetMasterDepositFund a full outer join DepositFundProvision  b on a.workid=b.workid where a.[Sadyasthiti]IS NOT NULL and b.Arthsankalpiyyear='2023-2024'   GROUP BY a.[Sadyasthiti] order by case a.[Sadyasthiti] when N'पूर्ण' then 1 when N'Completed' then 1 when N'Incomplete' then 2 when N'अपूर्ण' then 2 when N'प्रगतीत' then 3 when N'Inprogress' then 3 when N'Processing' then 3 when N'Current' then 3 when N'चालू' then 3  when N'Tender Stage' then 4 when N'निविदा स्तर' then 4 when N'Estimated Stage' then 5 when N'अंदाजपत्रकिय स्थर' then 5 when N'अंदाजपत्रकीय स्तर' then 5 when N'Not Started' then 6 when N'सुरु न झालेली' then 6 when N'सुरू करणे' then 7 when N'' then 8 end`;
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
          SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'Estimated Cost',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'T.S Cost',sum(cast(b.[Tartud]as decimal(10,2))) as 'Budget Provision 2023-2024',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Expenditure 2023-2024' FROM BudgetMasterDPDC a full outer join DPDCProvision  b on a.workid=b.workid where a.[Sadyasthiti]IS NOT NULL and b.Arthsankalpiyyear='2023-2024'   GROUP BY a.[Sadyasthiti] order by case a.[Sadyasthiti] when N'पूर्ण' then 1 when N'Completed' then 1 when N'Incomplete' then 2 when N'अपूर्ण' then 2 when N'प्रगतीत' then 3 when N'Inprogress' then 3 when N'Processing' then 3 when N'Current' then 3 when N'चालू' then 3  when N'Tender Stage' then 4 when N'निविदा स्तर' then 4 when N'Estimated Stage' then 5 when N'अंदाजपत्रकिय स्थर' then 5 when N'अंदाजपत्रकीय स्तर' then 5 when N'Not Started' then 6 when N'सुरु न झालेली' then 6 when N'सुरू करणे' then 7 when N'' then 8 end`;
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
    const query = `SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'Estimated Cost',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'T.S Cost',sum(cast(b.[Tartud]as decimal(10,2))) as 'Budget Provision 2023-2024',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Expenditure 2023-2024' FROM BudgetMasterGAT_A a full outer join GAT_AProvision  b on a.workid=b.workid where a.[Sadyasthiti]IS NOT NULL and b.Arthsankalpiyyear='2023-2024'   GROUP BY a.[Sadyasthiti] order by case a.[Sadyasthiti] when N'पूर्ण' then 1 when N'Completed' then 1 when N'Incomplete' then 2 when N'अपूर्ण' then 2 when N'प्रगतीत' then 3 when N'Inprogress' then 3 when N'Processing' then 3 when N'Current' then 3 when N'चालू' then 3  when N'Tender Stage' then 4 when N'निविदा स्तर' then 4 when N'Estimated Stage' then 5 when N'अंदाजपत्रकिय स्थर' then 5 when N'अंदाजपत्रकीय स्तर' then 5 when N'Not Started' then 6 when N'सुरु न झालेली' then 6 when N'सुरू करणे' then 7 when N'' then 8 end`;
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
    const query = `SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'Estimated Cost',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'T.S Cost',sum(cast(b.[Tartud]as decimal(10,2))) as 'Budget Provision 2023-2024',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Expenditure 2023-2024' FROM BudgetMasterGAT_D a full outer join GAT_DProvision  b on a.workid=b.workid where a.[Sadyasthiti]IS NOT NULL and b.Arthsankalpiyyear='2023-2024'   GROUP BY a.[Sadyasthiti] order by case a.[Sadyasthiti] when N'पूर्ण' then 1 when N'Completed' then 1 when N'Incomplete' then 2 when N'अपूर्ण' then 2 when N'प्रगतीत' then 3 when N'Inprogress' then 3 when N'Processing' then 3 when N'Current' then 3 when N'चालू' then 3  when N'Tender Stage' then 4 when N'निविदा स्तर' then 4 when N'Estimated Stage' then 5 when N'अंदाजपत्रकिय स्थर' then 5 when N'अंदाजपत्रकीय स्तर' then 5 when N'Not Started' then 6 when N'सुरु न झालेली' then 6 when N'सुरू करणे' then 7 when N'' then 8 end`;
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
    const query = `SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'Estimated Cost',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'T.S Cost',sum(cast(b.[Tartud]as decimal(10,2))) as 'Budget Provision 2023-2024',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Expenditure 2023-2024' FROM BudgetMasterGAT_FBC a full outer join GAT_FBCProvision  b on a.workid=b.workid where a.[Sadyasthiti]IS NOT NULL and b.Arthsankalpiyyear='2023-2024'   GROUP BY a.[Sadyasthiti] order by case a.[Sadyasthiti] when N'पूर्ण' then 1 when N'Completed' then 1 when N'Incomplete' then 2 when N'अपूर्ण' then 2 when N'प्रगतीत' then 3 when N'Inprogress' then 3 when N'Processing' then 3 when N'Current' then 3 when N'चालू' then 3  when N'Tender Stage' then 4 when N'निविदा स्तर' then 4 when N'Estimated Stage' then 5 when N'अंदाजपत्रकिय स्थर' then 5 when N'अंदाजपत्रकीय स्तर' then 5 when N'Not Started' then 6 when N'सुरु न झालेली' then 6 when N'सुरू करणे' then 7 when N'' then 8 end`;
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
          SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'Estimated Cost',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'T.S Cost',sum(cast(b.[Tartud]as decimal(10,2))) as 'Budget Provision 2023-2024',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Expenditure 2023-2024' FROM [BudgetMaster2515] a full outer join [2515Provision]  b on a.workid=b.workid where a.[Sadyasthiti]IS NOT NULL and b.Arthsankalpiyyear='2023-2024'   GROUP BY a.[Sadyasthiti] order by case a.[Sadyasthiti] when N'पूर्ण' then 1 when N'Completed' then 1 when N'Incomplete' then 2 when N'अपूर्ण' then 2 when N'प्रगतीत' then 3 when N'Inprogress' then 3 when N'Processing' then 3 when N'Current' then 3 when N'चालू' then 3  when N'Tender Stage' then 4 when N'निविदा स्तर' then 4 when N'Estimated Stage' then 5 when N'अंदाजपत्रकिय स्थर' then 5 when N'अंदाजपत्रकीय स्तर' then 5 when N'Not Started' then 6 when N'सुरु न झालेली' then 6 when N'सुरू करणे' then 7 when N'' then 8 end`;
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
    const query = `SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'Estimated Cost',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'T.S Cost',sum(cast(b.[Tartud]as decimal(10,2))) as 'Budget Provision 2023-2024',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Expenditure 2023-2024' FROM BudgetMasterMLA a full outer join MLAProvision  b on a.workid=b.workid where a.[Sadyasthiti]IS NOT NULL and b.Arthsankalpiyyear='2023-2024'   GROUP BY a.[Sadyasthiti] order by case a.[Sadyasthiti] when N'पूर्ण' then 1 when N'Completed' then 1 when N'Incomplete' then 2 when N'अपूर्ण' then 2 when N'प्रगतीत' then 3 when N'Inprogress' then 3 when N'Processing' then 3 when N'Current' then 3 when N'चालू' then 3  when N'Tender Stage' then 4 when N'निविदा स्तर' then 4 when N'Estimated Stage' then 5 when N'अंदाजपत्रकिय स्थर' then 5 when N'अंदाजपत्रकीय स्तर' then 5 when N'Not Started' then 6 when N'सुरु न झालेली' then 6 when N'सुरू करणे' then 7 when N'' then 8 end`;
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
    const query = `SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'Estimated Cost',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'T.S Cost',sum(cast(b.[Tartud]as decimal(10,2))) as 'Budget Provision 2023-2024',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Expenditure 2023-2024' FROM BudgetMasterMP a full outer join MPProvision  b on a.workid=b.workid where a.[Sadyasthiti]IS NOT NULL and b.Arthsankalpiyyear='2023-2024'   GROUP BY a.[Sadyasthiti] order by case a.[Sadyasthiti] when N'पूर्ण' then 1 when N'Completed' then 1 when N'Incomplete' then 2 when N'अपूर्ण' then 2 when N'प्रगतीत' then 3 when N'Inprogress' then 3 when N'Processing' then 3 when N'Current' then 3 when N'चालू' then 3  when N'Tender Stage' then 4 when N'निविदा स्तर' then 4 when N'Estimated Stage' then 5 when N'अंदाजपत्रकिय स्थर' then 5 when N'अंदाजपत्रकीय स्तर' then 5 when N'Not Started' then 6 when N'सुरु न झालेली' then 6 when N'सुरू करणे' then 7 when N'' then 8 end`;
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
      SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'Estimated Cost',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'T.S Cost',sum(cast(b.[Tartud]as decimal(10,2))) as 'Budget Provision 2023-2024',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Expenditure 2023-2024' FROM BudgetMasterNABARD a full outer join NABARDProvision  b on a.workid=b.workid where a.[Sadyasthiti]IS NOT NULL and b.Arthsankalpiyyear='2023-2024'   GROUP BY a.[Sadyasthiti] order by case a.[Sadyasthiti] when N'पूर्ण' then 1 when N'Completed' then 1 when N'Incomplete' then 2 when N'अपूर्ण' then 2 when N'प्रगतीत' then 3 when N'Inprogress' then 3 when N'Processing' then 3 when N'Current' then 3 when N'चालू' then 3  when N'Tender Stage' then 4 when N'निविदा स्तर' then 4 when N'Estimated Stage' then 5 when N'अंदाजपत्रकिय स्थर' then 5 when N'अंदाजपत्रकीय स्तर' then 5 when N'Not Started' then 6 when N'सुरु न झालेली' then 6 when N'सुरू करणे' then 7 when N'' then 8 end`;
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
      SELECT a.[Sadyasthiti]as 'Work Status', Count(a.[Sadyasthiti])as'Total Work',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'AA cost Rs in lakhs',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'Technical Sanction Cost Rs in Lakh',sum(cast(b.[Tartud]as decimal(10,2))) as 'Total Provision Rs in Lakh',sum(cast(b.[AikunKharch]as decimal(10,2))) as 'Total Expense Rs in Lakh' FROM BudgetMasterNonResidentialBuilding  a full outer join NonResidentialBuildingProvision  b on a.workid=b.workid where a.[Sadyasthiti]!='' and ThekedaarName=@name and b.Arthsankalpiyyear='2023-2024' GROUP BY a.[Sadyasthiti`;
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
  contractorGraph
};
