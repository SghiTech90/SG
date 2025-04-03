const { pool1, pool2, pool3, pool4, pool5, pool6, poolConnect1, poolConnect2, poolConnect3, poolConnect4, poolConnect5, poolConnect6 } = require("../config/db");

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

// Get Building All Head Report
const buildingAllHEAD = async (req, res) => {
  try {
    const { year, office } = req.body;

    if (!year || !office) {
      return res.status(400).json({
          success:false,
          message: "Both parameter's are required",
      });
  }

    const query = `
            SELECT 
                ROW_NUMBER() OVER(PARTITION BY [lekhashirsh] ORDER BY[Upvibhag]asc ) as 'SrNo',
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
            FROM BudgetMasterBuilding as a 
            join BuildingProvision as b on a.WorkID=b.WorkID 
            where b.Arthsankalpiyyear=@year
        `;
        const pool = await getPool(office);
    const result = await pool.request().input("year", year).query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in buildingAllHEAD:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching building all head report",
      error: error.message,
    });
  }
};

// Get CRF All Head Report
const CrfMPRreportAllHEAD = async (req, res) => {
  try {
    const { year, office } = req.body;

    if (!year || !office) {
      return res.status(400).json({
          success:false,
          message: "Both parameter's are required",
      });
  }

    const query = `
            SELECT 
                ROW_NUMBER() OVER(PARTITION BY [lekhashirsh] ORDER BY[Upvibhag]asc ) as 'SrNo',
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
            FROM BudgetMasterCRF as a 
            join CRFProvision as b on a.WorkID=b.WorkID 
            where b.Arthsankalpiyyear=@year
        `;
        const pool = await getPool(office);
    const result = await pool.request().input("year", year).query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in CrfMPRreportAllHEAD:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching CRF all head report",
      error: error.message,
    });
  }
};

// Get Deposit Fund All Head Report
const DepositAllHead = async (req, res) => {
  try {
    const { year, office } = req.body;

    if (!year || !office) {
      return res.status(400).json({
          success:false,
          message: "Both parameter's are required",
      });
  }

    const query = `
            SELECT 
                ROW_NUMBER() OVER(PARTITION BY [lekhashirsh] ORDER BY[Upvibhag]asc ) as 'SrNo',
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
            FROM BudgetMasterDepositFund as a 
            join DepositFundProvision as b on a.WorkID=b.WorkID 
            where b.Arthsankalpiyyear=@year
        `;
        const pool = await getPool(office);
    const result = await pool.request().input("year", year).query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in DepositAllHead:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching deposit fund all head report",
      error: error.message,
    });
  }
};

// Get DPDC All Head Report
const DPDCAllHead = async (req, res) => {
  try {
    const { year, office } = req.body;

    if (!year || !office) {
      return res.status(400).json({
          success:false,
          message: "Both parameter's are required",
      });
  }

    const query = `
            SELECT 
                ROW_NUMBER() OVER(PARTITION BY [lekhashirsh] ORDER BY[Upvibhag]asc ) as 'SrNo',
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
            FROM BudgetMasterDPDC as a 
            join DPDCProvision as b on a.WorkID=b.WorkID 
            where b.Arthsankalpiyyear=@year
        `;
        const pool = await getPool(office);

    const result = await pool.request().input("year", year).query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in DPDCAllHead:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching DPDC all head report",
      error: error.message,
    });
  }
};

const MLAAllHEAD = async (req, res) => {
  try {
    const { year, office } = req.body;

    if (!year || !office) {
      return res.status(400).json({
          success:false,
          message: "Both parameter's are required",
      });
  }

    const query = `SELECT ROW_NUMBER() OVER(PARTITION BY [lekhashirsh] ORDER BY[Upvibhag]asc ) as 'SrNo',a.[SubType] ,a.[U_WIN] as 'U_WIN',a.[LekhaShirsh] as 'lekhashirsh',a.[LekhaShirshName] as 'LekhaShirshName',a.[KamacheName] as kamachenaav, convert(nvarchar(max),a.[TrantrikAmt])+' '+convert(nvarchar(max), a.[TrantrikDate]) as tantrik,b.[MarchEndingExpn] as marchexpn,b.[AkunAnudan] as akndan,b.[AikunKharch] as aknkharch,b.[Magni] as Magni,b.[UrvaritAmt] as UrvaritAmt,CAST(CASE WHEN a.[Sadyasthiti] = N'पूर्ण'  THEN 1 ELSE 0 END as decimal(18,0)) as 'C',CAST(CASE WHEN a.[Sadyasthiti] = N'प्रगतीत'  THEN 1 ELSE 0 END as decimal(18,0)) as 'P',CAST(CASE WHEN a.[Sadyasthiti] = N'सुरू न झालेली'  THEN 1 ELSE 0 END as decimal(18,0)) as 'NS' from BudgetMasterMLA as a join MLAProvision as b on a.WorkID=b.WorkID where b.Arthsankalpiyyear=@year 
`;
const pool = await getPool(office);
    const result = await pool.request().input("year", year).query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in MLAAllHEAD:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching MLA all head report",
      error: error.message,
    });
  }
};

const MPAllHEAD = async (req, res) => {
  try {
    const { year,office } = req.body;

    if (!year || !office) {
      return res.status(400).json({
          success:false,
          message: "Both parameter's are required",
      });
  }

    const query = `SELECT ROW_NUMBER() OVER(PARTITION BY [lekhashirsh] ORDER BY[Upvibhag]asc ) as 'SrNo',a.[SubType] ,a.[U_WIN] as 'U_WIN',a.[LekhaShirsh] as 'lekhashirsh',a.[LekhaShirshName] as 'LekhaShirshName',a.[KamacheName] as kamachenaav, convert(nvarchar(max),a.[TrantrikAmt])+' '+convert(nvarchar(max), a.[TrantrikDate]) as tantrik,b.[MarchEndingExpn] as marchexpn,b.[AkunAnudan] as akndan,b.[AikunKharch] as aknkharch,b.[Magni] as Magni,b.[UrvaritAmt] as UrvaritAmt,CAST(CASE WHEN a.[Sadyasthiti] = N'पूर्ण'  THEN 1 ELSE 0 END as decimal(18,0)) as 'C',CAST(CASE WHEN a.[Sadyasthiti] = N'प्रगतीत'  THEN 1 ELSE 0 END as decimal(18,0)) as 'P',CAST(CASE WHEN a.[Sadyasthiti] = N'सुरू न झालेली'  THEN 1 ELSE 0 END as decimal(18,0)) as 'NS' from BudgetMasterMP as a join MPProvision as b on a.WorkID=b.WorkID where b.Arthsankalpiyyear=@year`;
    const pool = await getPool(office);
    const result = await pool.request().input("year", year).query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in MPAllHEAD:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching MP all head report",
      error: error.message,
    });
  }
};

const NABARDAllHEAD = async (req, res) => {
  try {
    const { year, office } = req.body;

    if (!year || !office) {
      return res.status(400).json({
          success:false,
          message: "Both parameter's are required",
      });
  }

    const query = `SELECT ROW_NUMBER() OVER(PARTITION BY [lekhashirsh] ORDER BY[Upvibhag]asc ) as 'SrNo',a.[SubType] ,a.[U_WIN] as 'U_WIN',a.[LekhaShirsh] as 'lekhashirsh',a.[LekhaShirshName] as 'LekhaShirshName',a.[KamacheName] as kamachenaav, convert(nvarchar(max),a.[TrantrikAmt])+' '+convert(nvarchar(max), a.[TrantrikDate]) as tantrik,b.[MarchEndingExpn] as marchexpn,b.[AkunAnudan] as akndan,b.[AikunKharch] as aknkharch,b.[Magni] as Magni,b.[UrvaritAmt] as UrvaritAmt,CAST(CASE WHEN a.[Sadyasthiti] = N'पूर्ण'  THEN 1 ELSE 0 END as decimal(18,0)) as 'C',CAST(CASE WHEN a.[Sadyasthiti] = N'प्रगतीत'  THEN 1 ELSE 0 END as decimal(18,0)) as 'P',CAST(CASE WHEN a.[Sadyasthiti] = N'सुरू न झालेली'  THEN 1 ELSE 0 END as decimal(18,0)) as 'NS' from BudgetMasterNABARD as a join NABARDProvision as b on a.WorkID=b.WorkID where b.Arthsankalpiyyear=@year `;
    const pool = await getPool(office);
    const result = await pool.request().input("year", year).query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in NABARDAllHEAD:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching NABARDAllHEAD all head report",
      error: error.message,
    });
  }
};

const ROADAllHEAD = async (req, res) => {
    try {
      const { year, office } = req.body;
  
      if (!year || !office) {
        return res.status(400).json({
            success:false,
            message: "Both parameter's are required",
        });
    }
  
      const query = `SELECT ROW_NUMBER() OVER(PARTITION BY [lekhashirsh] ORDER BY[Upvibhag]asc ) as 'SrNo',a.[SubType] ,a.[U_WIN] as 'U_WIN',a.[LekhaShirsh] as 'lekhashirsh',a.[LekhaShirshName] as 'LekhaShirshName',a.[KamacheName] as kamachenaav, convert(nvarchar(max),a.[TrantrikAmt])+' '+convert(nvarchar(max), a.[TrantrikDate]) as tantrik,b.[MarchEndingExpn] as marchexpn,b.[AkunAnudan] as akndan,b.[AikunKharch] as aknkharch,b.[Magni] as Magni,b.[UrvaritAmt] as UrvaritAmt,CAST(CASE WHEN a.[Sadyasthiti] = N'पूर्ण'  THEN 1 ELSE 0 END as decimal(18,0)) as 'C',CAST(CASE WHEN a.[Sadyasthiti] = N'प्रगतीत'  THEN 1 ELSE 0 END as decimal(18,0)) as 'P',CAST(CASE WHEN a.[Sadyasthiti] = N'सुरू न झालेली'  THEN 1 ELSE 0 END as decimal(18,0)) as 'NS' from BudgetMasterRoad as a join RoadProvision as b on a.WorkID=b.WorkID where b.Arthsankalpiyyear=@year `;
      const pool = await getPool(office);
      const result = await pool.request().input("year", year).query(query);
  
      res.json({
        success: true,
        data: result.recordset,
      });
    } catch (error) {
      console.error("Error in ROADAllHEAD:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching building all head report",
        error: error.message,
      });
    }
  };

  const GAT_A_AllHEAD = async(req,res) => {
    try {
        const {year,office} = req.body;

        if (!year || !office) {
            return res.status(400).json({
                success:false,
                message: "Both parameter's are required",
            });
        }

        const query = `SELECT ROW_NUMBER() OVER(PARTITION BY [lekhashirsh] ORDER BY[Upvibhag]asc ) as 'SrNo',a.[SubType] ,a.[U_WIN] as 'U_WIN',a.[LekhaShirsh] as 'lekhashirsh',a.[LekhaShirshName] as 'LekhaShirshName',a.[KamacheName] as kamachenaav, convert(nvarchar(max),a.[TrantrikAmt])+' '+convert(nvarchar(max), a.[TrantrikDate]) as tantrik,b.[MarchEndingExpn] as marchexpn,b.[AkunAnudan] as akndan,b.[AikunKharch] as aknkharch,b.[Magni] as Magni,b.[UrvaritAmt] as UrvaritAmt,CAST(CASE WHEN a.[Sadyasthiti] = N'पूर्ण'  THEN 1 ELSE 0 END as decimal(18,0)) as 'C',CAST(CASE WHEN a.[Sadyasthiti] = N'प्रगतीत'  THEN 1 ELSE 0 END as decimal(18,0)) as 'P',CAST(CASE WHEN a.[Sadyasthiti] = N'सुरू न झालेली'  THEN 1 ELSE 0 END as decimal(18,0)) as 'NS' from BudgetMasterGAT_A as a join GAT_AProvision as b on a.WorkID=b.WorkID where b.Arthsankalpiyyear=@year`;
        const pool = await getPool(office);
        const result = await pool.request().input("year",year).query(query);

        res.json({
            success: true,
            data: result.recordset,
        });
    }catch (error){
        console.error("Error in 3054_GAT_A_AllHEAD", error);
        res.status(500).json({
            success:false,
            message: "Error fetching 3054_GAT_A_AllHEAD all head report",
            error: error.message,
        });
    }
  }

  const GAT_D_AllHEAD = async(req,res) => {
    try{
      const {year , office} = req.body;

      if(!office || !year) {
        return res.status(400).json({
          success: false,
          message: "Both parameter's are required",
        })
      }

      const query = `SELECT ROW_NUMBER() OVER(PARTITION BY [lekhashirsh] ORDER BY[Upvibhag]asc ) as 'SrNo',a.[SubType] ,a.[U_WIN] as 'U_WIN',a.[LekhaShirsh] as 'lekhashirsh',a.[LekhaShirshName] as 'LekhaShirshName',a.[KamacheName] as kamachenaav, convert(nvarchar(max),a.[TrantrikAmt])+' '+convert(nvarchar(max), a.[TrantrikDate]) as tantrik,b.[MarchEndingExpn] as marchexpn,b.[AkunAnudan] as akndan,b.[AikunKharch] as aknkharch,b.[Magni] as Magni,b.[UrvaritAmt] as UrvaritAmt,CAST(CASE WHEN a.[Sadyasthiti] = N'पूर्ण'  THEN 1 ELSE 0 END as decimal(18,0)) as 'C',CAST(CASE WHEN a.[Sadyasthiti] = N'प्रगतीत'  THEN 1 ELSE 0 END as decimal(18,0)) as 'P',CAST(CASE WHEN a.[Sadyasthiti] = N'सुरू न झालेली'  THEN 1 ELSE 0 END as decimal(18,0)) as 'NS' from BudgetMasterGAT_D as a join GAT_DProvision as b on a.WorkID=b.WorkID where b.Arthsankalpiyyear = @year `
      const pool = await getPool(office);
      const result = pool.request().input("year", year).query(query);

      res.json({
        success:true,
        data: (await result).recordsets
      });

    }catch (error) {
      console.log("Error in GAT_D_AllHEAD", error);
      res.status(500).json({
        success: false,
        message: "Error fetching GAT_D report",
        error: error.message,
      });
    }
  }

  const GRAMVIKAS_AllHEAD = async(req,res) => {
    try{
      const {year , office} = req.body;

      if(!office || !year) {
        return res.status(400).json({
          success: false,
          message: "Both parameter's are required",
        })
      }

      const query = `SELECT ROW_NUMBER() OVER(PARTITION BY [lekhashirsh] ORDER BY[Upvibhag]asc ) as 'SrNo',a.[SubType] ,a.[U_WIN] as 'U_WIN',a.[LekhaShirsh] as 'lekhashirsh',a.[LekhaShirshName] as 'LekhaShirshName',a.[KamacheName] as kamachenaav, convert(nvarchar(max),a.[TrantrikAmt])+' '+convert(nvarchar(max), a.[TrantrikDate]) as tantrik,b.[MarchEndingExpn] as marchexpn,b.[AkunAnudan] as akndan,b.[AikunKharch] as aknkharch,b.[Magni] as Magni,b.[UrvaritAmt] as UrvaritAmt,CAST(CASE WHEN a.[Sadyasthiti] = N'पूर्ण'  THEN 1 ELSE 0 END as decimal(18,0)) as 'C',CAST(CASE WHEN a.[Sadyasthiti] = N'प्रगतीत'  THEN 1 ELSE 0 END as decimal(18,0)) as 'P',CAST(CASE WHEN a.[Sadyasthiti] = N'सुरू न झालेली'  THEN 1 ELSE 0 END as decimal(18,0)) as 'NS' from BudgetMaster2515 as a join [2515Provision] as b on a.WorkID=b.WorkID where b.Arthsankalpiyyear= @year `
      const pool = await getPool(office);
      const result = pool.request().input("year", year).query(query);

      res.json({
        success:true,
        data: (await result).recordsets
      });

    }catch (error) {
      console.log("Error in GRAMVIKAS_AllHEAD", error);
      res.status(500).json({
        success: false,
        message: "Error fetching GRAMVIKAS_AllHEAD report",
        error: error.message,
      });
    }
  }

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
  GRAMVIKAS_AllHEAD
};
