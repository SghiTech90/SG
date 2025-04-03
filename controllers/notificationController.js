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



// Get notification for upcoming due dates (next 20 days)
const getUpcomingDueDates = async (req, res) => {
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
    
    // Query to get records with due dates in the next 20 days
    const query = `
      SELECT KamPurnDate, WorkId, KamacheName, ThekedaarName
      FROM SendSms_tbl 
      WHERE CONVERT(date, KamPurnDate, 105) 
            BETWEEN CONVERT(date, GETDATE(), 105) 
            AND CONVERT(date, DATEADD(day, 30, GETDATE()), 105)
    `;
    
    const result = await pool.request().query(query);
    
    // Return the result
    res.json({
      count: result.recordset.length,
      notifications: result.recordset,
      success: 'true'
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getUpcomingDueDates
}; 