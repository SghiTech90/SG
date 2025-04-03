const {pool1, pool2, pool3, pool4, pool5, pool6, poolConnect1, poolConnect2, poolConnect3, poolConnect4, poolConnect5, poolConnect6 } = require('../config/db');

const getPool = async (office) => {
  if (office === 'P_W_Division_Akola') {
    await poolConnect1;
    return pool1;
  } else if (office === 'P_W_Division_Washim') {
    await poolConnect2;
    return pool2;
  } else if (office === 'P_W_Division_Buldhana') {
    await poolConnect3;
    return pool3;
  } else if (office === 'P_W_Division_Khamgaon') {
    await poolConnect4;
    return pool4;
  } else if (office === 'P_W_Division_WBAkola') {
    await poolConnect5;
    return pool5;
  }
  else if (office === 'P_W_Circle_Akola') {
    await poolConnect6;
    return pool6;
  }
  else {
    throw new Error('Invalid office selection');
  }
};

// Get count of all budget tables with titles
const getBudgetCount = async (req, res) => {
  try {
    const { office } = req.body;

    if (!office) {
      return res.status(400).json({
        success: false,
        message: "Office parameter is required",
      });
    }

    const pool = await getPool(office);
    await pool.connect();
    
    // Create queries for all tables
    const tableQueries = [
      { table: 'BudgetMasterBuilding', title: 'Building' },
      { table: 'BudgetMasterCRF', title: 'CRF' },
      { table: 'BudgetMasterAunty', title: 'Annuity' },
      { table: 'BudgetMasterNABARD', title: 'NABARD' },
      { table: 'BudgetMasterRoad', title: 'RAOD' },
      { table: 'BudgetMaster2515', title: '2515' },
      { table: 'BudgetMasterDepositFund', title: 'Deposit' },
      { table: 'BudgetMasterDPDC', title: 'DPDC' },
      { table: 'BudgetMasterGAT_A', title: 'AMC' },
      { table: 'BudgetMasterGAT_D', title: 'FDR' },
      { table: 'BudgetMasterGAT_FBC', title: 'BCR' },
      { table: 'BudgetMasterMLA', title: 'MLA' },
      { table: 'BudgetMasterMP', title: 'MP' },
      { table: 'BudgetMasterNonResidentialBuilding', title: '2059' },
      { table: 'BudgetMasterResidentialBuilding', title: '2216' },
      
    ];
    
    // Store results in array for sorting
    const resultsArray = [];
    
    for (const query of tableQueries) {
      try {
        const result = await pool.request()
          .query(`SELECT COUNT(*) as count FROM ${query.table}`);
        
        resultsArray.push({
          title: query.title,
          table: query.table,
          count: result.recordset[0].count
        });
      } catch (error) {
        console.error(`Error querying table ${query.table}:`, error.message);
        resultsArray.push({
          title: query.title,
          table: query.table,
          count: 0,
          error: `Table may not exist or cannot be accessed`
        });
      }
    }
    
    // Sort results by count in ascending order (lowest to highest)
    //resultsArray.sort((a, b) => a.count - b.count);
    
    res.json({resultsArray, success: 'true'});
  } catch (error) {
    console.error('Error getting budget counts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get counts grouped by Upvibhag from all budget tables
const getUpvibhagCounts = async (req, res) => {
  try {
    const { office } = req.body;

    if (!office) {
      return res.status(400).json({
        success: false,
        message: "office parameter is required",
      });
    }

    const pool = await getPool(office);
    await pool.connect();
    
    // Define tables to query
    const tableQueries = [
      { table: 'BudgetMasterBuilding', title: 'Building' },
      { table: 'BudgetMasterCRF', title: 'CRF' },
      { table: 'BudgetMasterAunty', title: 'Annuity' },
      { table: 'BudgetMasterNABARD', title: 'NABARD' },
      { table: 'BudgetMasterRoad', title: 'RAOD' },
      { table: 'BudgetMaster2515', title: '2515' },
      { table: 'BudgetMasterDepositFund', title: 'Deposit' },
      { table: 'BudgetMasterDPDC', title: 'DPDC' },
      { table: 'BudgetMasterGAT_A', title: 'AMC' },
      { table: 'BudgetMasterGAT_D', title: 'FDR' },
      { table: 'BudgetMasterGAT_FBC', title: 'BCR' },
      { table: 'BudgetMasterMLA', title: 'MLA' },
      { table: 'BudgetMasterMP', title: 'MP' },
      { table: 'BudgetMasterNonResidentialBuilding', title: '2059' },
      { table: 'BudgetMasterResidentialBuilding', title: '2216' },
    ];
    
    /*const tables = [
      'BudgetMasterAunty',
      'BudgetMaster2515',
      'BudgetMasterBuilding',
      'BudgetMasterCRF',
      'BudgetMasterDepositFund',
      'BudgetMasterDPDC',
      'BudgetMasterGAT_A',
      'BudgetMasterGAT_D',
      'BudgetMasterGAT_FBC',
      'BudgetMasterMLA',
      'BudgetMasterMP',
      'BudgetMasterNABARD',
      'BudgetMasterNonResidentialBuilding',
      'BudgetMasterResidentialBuilding',
      'BudgetMasterRoad'
    ];*/
    
    // Results object to store data
    const tableResults = {};
    
    // Query each table
    for (const query of tableQueries) {
      try {
        const result = await pool.request()
          .query(`SELECT COUNT(*) AS count, Upvibhag FROM ${query.table} GROUP BY Upvibhag`);
        
        // Skip tables with no results
        if (result.recordset.length === 0) {
          continue;
        }
        
        // Create array for this table's results using title as the key
        tableResults[query.title] = [];
        
        // Process results for this table
        for (const row of result.recordset) {
          tableResults[query.title].push({
            upvibhag: row.Upvibhag || 'Unknown',
            count: row.count
          });
        }
        
        // Sort each table's results by count (descending)
        tableResults[query.title].sort((a, b) => b.count - a.count);
        
      } catch (error) {
        console.log(`Table ${query.table} may not have Upvibhag column or doesn't exist: ${error.message}`);
      }
    }
    
    res.json({ tableResults, success: true });
  } catch (error) {
    console.error('Error getting Upvibhag counts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// const notification = async (req,res) => {
//   try{
//     await pool.connect();

//     if(userId)


//   }
// }

module.exports = {
  getBudgetCount,
  getUpvibhagCounts
}; 