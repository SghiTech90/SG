const { getPool, sql } = require("../config/db");
const axios = require("axios");
require("dotenv").config();

// WishbySMS configuration
const wishbyApiKey = process.env.WISHBY_API_KEY;
const wishbySenderId = process.env.WISHBY_SENDER_ID;
//const DLT_TE_ID_TEXT= "1707174246348497746";

// Store OTPs temporarily (in production, use Redis or another cache system)
const otpStore = {};

// Generate a random 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Function to send SMS using WishbySMS
const sendSMS = async (mobileNo, message) => {
  try {
    let phoneNumber = mobileNo.startsWith('91') ? mobileNo : '91' + mobileNo;
    console.log(phoneNumber);
    console.log(wishbyApiKey);
    console.log(wishbySenderId);
    
    const encodedMessage = encodeURIComponent(message);
    console.log(encodedMessage);
    let apiUrl = `https://login.wishbysms.com/api/sendhttp.php?authkey=${wishbyApiKey}&mobiles=${phoneNumber}&message=${encodedMessage}&sender=${wishbySenderId}&route=4&country=91`;
    
    if (process.env.DLT_TE_ID) apiUrl += `&DLT_TE_ID=${process.env.DLT_TE_ID}`;
    
    const response = await axios.get(apiUrl);
    return { success: true, response: response.data };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error: error.message };
  }
};

// const sendTEXT = async (mobileNo, message) => {
//   try {
//     let phoneNumber = mobileNo.startsWith('91') ? mobileNo : '91' + mobileNo;
//     console.log(phoneNumber);
//     console.log(wishbyApiKey);
//     console.log(wishbySenderId);
    
//     const encodedMessage = encodeURIComponent(message);
//     console.log(encodedMessage);
//     let apiUrl = `https://login.wishbysms.com/api/sendhttp.php?authkey=${wishbyApiKey}&mobiles=${phoneNumber}&message=${encodedMessage}&sender=${wishbySenderId}&route=4&country=91`;
    
//     if (DLT_TE_ID_TEXT) apiUrl += `&DLT_TE_ID_TEXT=${DLT_TE_ID_TEXT}`;
    
//     const response = await axios.get(apiUrl);
//     return { success: true, response: response.data };
//   } catch (error) {
//     console.error('Error sending SMS:', error);
//     return { success: false, error: error.message };
//   }
// };

// Login and send OTP
const login = async (req, res) => {
  const { userId, password, office } = req.body;
  
  if (!userId || !password || !office) {
    return res.status(400).json({ message: 'User ID, password, and office are required' });
  }

  console.log(`Login attempt: UserID=${userId}, Office=${office}`);
  
  try {
    console.log("Attempting to get database pool for office:", office);
    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }
    console.log("Database pool acquired.");

    const query = `SELECT UserId, Password, Post, MobileNo FROM [dbo].[SCreateAdmin] WHERE UserId = @userId`;
    console.log("Executing login query...");
    const result = await pool.request()
      .input('userId', sql.VarChar, userId)
      .query(query);
    console.log("Login query executed.");

    if (result.recordset.length === 0) {
      console.log(`User not found: ${userId}`);
      return res.status(404).json({ message: `Invalid credentials - User not found`, success: false });
    }
    
    const user = result.recordset[0];
    console.log("User found, checking password...");

    if (user.Password !== password) {
      console.log(`Invalid password for user: ${userId}`);
      return res.status(401).json({ message: 'Invalid password', success: false });
    }
    console.log("Password verified. Generating OTP...");

    const otp = generateOTP();
    console.log(`Generated OTP: ${otp} for user: ${userId}`);

    otpStore[userId] = { otp, mobileNo: user.MobileNo, Name: user.Name, post: user.Post, office: office, expiry: Date.now() + 2 * 60 * 1000 };
    console.log("OTP stored. Sending SMS...");

    await sendSMS(user.MobileNo, `Your one time password login (OTP) is ${otp}  Please use it to verify your mobile number with -Swapsoft`);
    console.log("SMS presumably sent.");

    res.json({ message: 'OTP sent successfully', success: true, Name: user.Name, userId, post: user.Post, mobileNo: user.MobileNo.replace(/\d(?=\d{4})/g, '*') });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An internal server error occurred during login.', success: false, error: error.message });
  }
};

// Verify OTP
// Verify OTP - FIXED VERSION
const verifyOTP = async (req, res) => {
  const { userId, otp } = req.body;
  
  if (!userId || !otp) {
    return res.status(400).json({ message: 'User ID and OTP are required', success: false });
  }
  
  try {
    if (!otpStore[userId]) {
      return res.status(400).json({ message: 'No OTP request found or it has expired. Please login again.', success: false });
    }
    
    const otpData = otpStore[userId];
    
    if (Date.now() > otpData.expiry) {
      delete otpStore[userId];
      return res.status(400).json({ message: 'OTP has expired. Please login again.', success: false });
    }
    
    if (otpData.otp !== otp) {
      return res.status(401).json({ message: 'Invalid OTP', success: false });
    }
    
    console.log(`OTP verified successfully for user: ${userId}`);
    const verifiedOffice = otpData.office;
    delete otpStore[userId];
        
    // Respond with success, include office if needed later
    res.json({ message: 'Login successful', userId, post: otpData.post, office: verifiedOffice, success: true });
    
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'An internal server error occurred during OTP verification.', success: false });
  }
};

// Resend OTP
const resendOTP = async (req, res) => {
  const { userId, office } = req.body;
  
  if (!userId || !office) {
    return res.status(400).json({ message: 'User ID and office are required', success: false });
  }
  
  try {
    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const result = await pool.request()
      .input('userId', sql.VarChar, userId)
      .query('SELECT UserId, MobileNo, Post FROM [dbo].[SCreateAdmin] WHERE UserId = @userId');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found', success: false });
    }
    
    const user = result.recordset[0];
    const currentUserId = user.UserId; 
    
    const otp = generateOTP();
    otpStore[currentUserId] = { otp, mobileNo: user.MobileNo, post: user.Post, office: office, expiry: Date.now() + 2 * 60 * 1000 };
    
    await sendSMS(user.MobileNo, `Your new OTP for login is ${otp} - Swapsoft`);
    
    res.json({ message: 'OTP resent successfully', success: true, userId: currentUserId });
    
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'An internal server error occurred while resending OTP.', success: false, error: error.message });
  }
};

// Profile - Now a POST request to accept userId
const profile = async (req, res) => {
  const { userId, office } = req.body;
  
  if (!userId || !office) {
      return res.status(400).json({ message: 'User ID and office are required', success: false });
  }
  
  console.log(`Trying to fetch profile data for User ID: ${userId} in office: ${office}`);
  
  try {
    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }
    
    const result = await pool.request()
      .input('userId', sql.VarChar, userId)
      .query('SELECT UserId, Name, Office, Post, MobileNo, Email, Image FROM [dbo].[SCreateAdmin] WHERE UserId = @userId');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'No user found with this User ID', success: false });
    }
    
    const user = result.recordset[0];
    console.log("User profile data retrieved:", user);
    
    res.json({ 
      Image: user.Image,
      Email: user.Email,
      MobileNo: user.MobileNo,
      Post: user.Post,
      Office: user.Office,
      name: user.Name,
      userId: user.UserId,
      success: true
    });
    
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'An internal server error occurred while fetching profile.', success: false, error: error.message });
  }
};

// Building MPR Report - Now a POST request with year and office
const buildingMPRreport = async (req, res) => {
    try {
        const { year, office } = req.body;
        
        if (!year || !office) {
            return res.status(400).json({
                success: false,
                message: 'Year and office parameters are required'
            });
        }

        const pool = await getPool(office);
        if (!pool) {
          throw new Error(`Database pool is not available for office ${office}.`);
        }

        const query = `
            SELECT 
                ROW_NUMBER() OVER (PARTITION BY [lekhashirsh] ORDER BY [Upvibhag] ASC) AS 'SrNo',
                a.[SubType],
                a.[LekhaShirsh] AS 'lekhashirsh',
                a.[LekhaShirshName] AS 'LekhaShirshName',
                a.[U_WIN] AS U_WIN,
                a.[KamacheName] AS kamachenaav,
                convert(NVARCHAR(max), a.[PrashaskiyAmt]) + ' ' + convert(NVARCHAR(max), a.[PrashaskiyDate]) AS prashaskiy,
                convert(NVARCHAR(max), a.[TrantrikAmt]) + ' ' + convert(NVARCHAR(max), a.[TrantrikDate]) AS tantrik,
                a.[ThekedaarName] AS thename,
                convert(NVARCHAR(max), a.[NividaKrmank]) + ' ' + convert(NVARCHAR(max), a.[NividaDate]) AS karyarambhadesh,
                a.[NividaAmt] AS nivamt,
                a.[kamachiMudat] + ' month' AS kammudat,
                b.[MarchEndingExpn] AS marchexpn,
                b.[Tartud] AS tartud,
                b.[AkunAnudan] AS akndan,
                b.[Magilkharch] AS magch,
                b.[Chalukharch] AS chalch,
                b.[AikunKharch] AS aknkharch,
                CAST(CASE 
                    WHEN MudatVadhiDate = ' ' OR MudatVadhiDate = '0'
                    THEN N'होय'
                    ELSE N'नाही'
                END AS NVARCHAR(max)) AS mudatvadh,
                [Vidyutprama] AS vidprama,
                b.[Vidyutvitarit] AS vidtarit,
                b.[Dviguni] AS dvini,
                a.[Pahanikramank] AS pankr,
                convert(NVARCHAR(max), a.[Sadyasthiti]) + ' ' + convert(NVARCHAR(max), a.[Shera]) AS shera,
                N'उपविभागीय अभियंता' + ' ' + convert(NVARCHAR(max), a.[UpabhyantaName]) + ' ' + 
                convert(NVARCHAR(max), a.[UpAbhiyantaMobile]) + N' शा.अ.- ' + convert(NVARCHAR(max), a.[ShakhaAbhyantaName]) + 
                ' ' + convert(NVARCHAR(max), a.[ShakhaAbhiyantMobile]) AS abhiyanta
            FROM BudgetMasterBuilding AS a
            JOIN BuildingProvision AS b ON a.WorkID = b.WorkID
            WHERE b.Arthsankalpiyyear = @year
        `;

        const result = await pool.request()
            .input('year', year)
            .query(query);
        
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error in buildingMPRreport:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching building MPR report',
            error: error.message
        });
    }
};

// Get contractor project counts - POST request
const getContractorProjects = async (req, res) => {
  try {
      const { contractorName, office } = req.body;
      
      if (!contractorName || !office) {
          return res.status(400).json({
              success: false,
              message: 'Contractor name and office are required'
          });
      }

      const pool = await getPool(office);
      if (!pool) {
        throw new Error(`Database pool is not available for office ${office}.`);
      }

      const query = `
        SELECT 
            (SELECT count(*) FROM [dbo].[BudgetMasterBuilding] WHERE ThekedaarName = @contractorName) AS Building,
            (SELECT count(*) FROM [dbo].[BudgetMasterCRF] WHERE ThekedaarName = @contractorName) AS CRF,
            (SELECT count(*) FROM [dbo].[BudgetMasterAunty] WHERE ThekedaarName = @contractorName) AS Annuity,
            (SELECT count(*) FROM [dbo].[BudgetMasterDepositFund] WHERE ThekedaarName = @contractorName) AS Deposit,
            (SELECT count(*) FROM [dbo].[BudgetMasterDPDC] WHERE ThekedaarName = @contractorName) AS DPDC,
            (SELECT count(*) FROM [dbo].[BudgetMasterGAT_A] WHERE ThekedaarName = @contractorName) AS Gat_A,
            (SELECT count(*) FROM [dbo].[BudgetMasterGAT_D] WHERE ThekedaarName = @contractorName) AS Gat_D,
            (SELECT count(*) FROM [dbo].[BudgetMasterGAT_FBC] WHERE ThekedaarName = @contractorName) AS Gat_BCF,
            (SELECT count(*) FROM [dbo].[BudgetMasterMLA] WHERE ThekedaarName = @contractorName) AS MLA,
            (SELECT count(*) FROM [dbo].[BudgetMasterMP] WHERE ThekedaarName = @contractorName) AS MP,
            (SELECT count(*) FROM [dbo].[BudgetMasterNABARD] WHERE ThekedaarName = @contractorName) AS Nabard,
            (SELECT count(*) FROM [dbo].[BudgetMasterRoad] WHERE ThekedaarName = @contractorName) AS Road,
            (SELECT count(*) FROM [dbo].[BudgetMasterNonResidentialBuilding] WHERE ThekedaarName = @contractorName) AS NRB2059,
            (SELECT count(*) FROM [dbo].[BudgetMasterResidentialBuilding] WHERE ThekedaarName = @contractorName) AS RB2216,
            (SELECT count(*) FROM [dbo].[BudgetMaster2515] WHERE ThekedaarName = @contractorName) AS GramVikas
      `;

      const result = await pool.request()
          .input('contractorName', sql.NVarChar, contractorName)
          .query(query);
      
      const data = result.recordset[0] || {};
      const counts = {
        Building: data.Building || 0,
        CRF: data.CRF || 0,
        Annuity: data.Annuity || 0,
        Deposit: data.Deposit || 0,
        DPDC: data.DPDC || 0,
        Gat_A: data.Gat_A || 0,
        Gat_D: data.Gat_D || 0,
        Gat_BCF: data.Gat_BCF || 0,
        MLA: data.MLA || 0,
        MP: data.MP || 0,
        Nabard: data.Nabard || 0,
        Road: data.Road || 0,
        NRB2059: data.NRB2059 || 0,
        RB2216: data.RB2216 || 0,
        GramVikas: data.GramVikas || 0
      };

      res.json({
          success: true,
          data: counts
      });
  } catch (error) {
      console.error('Error in getContractorProjects:', error);
      res.status(500).json({
          success: false,
          message: 'Error fetching contractor project counts',
          error: error.message
      });
  }
};

// CRF MPR Report - Now POST with year and office
const CrfMPRreport = async (req, res) => {
    try {
        const { year, office } = req.body;
        
        if (!year || !office) {
            return res.status(400).json({
                success: false,
                message: 'Year and office parameters are required'
            });
        }

        const pool = await getPool(office);
        if (!pool) {
          throw new Error(`Database pool is not available for office ${office}.`);
        }

        const query = `
            SELECT 
                a.WorkID,
                row_number() over(order by a.WorkID) as 'WorkIDl',
                a.[U_WIN] as 'U_WIN',
                a.[Dist] as 'Dist',
                a.[ArthsankalpiyBab] as 'SrNo',
                a.[KamacheName] as 'Name of work',
                convert(nvarchar(max),a.[JobNo])+' - '+convert(nvarchar(max),a.[SanctionDate]) as 'Job No',
                a.[SanctionAmount] as 'SanctionAmt',
                a.[RoadLength] as 'RoadLength',
                b.[Tartud] as 'OBP',
                b.[Chalukharch] as 'Eduringmon',
                b.[MarchEndingExpn] as 'CExpndrmonth',
                b.[Magni] as 'Demand',
                a.[NividaDate] as 'Dateofstarting',
                a.[KamPurnDate] as 'Dateofcompletion',
                a.[ThekedaarName] as 'NameofAgency',
                a.[karyarambhadesh] as 'Awardbelow',
                a.[NividaAmt] as 'Tenderedamount',
                convert(nvarchar(max),b.[Tartud])+' | '+convert(nvarchar(max),b.[Chalukharch]) as 'submissiontoMORTH',
                convert(nvarchar(max),a.[NividaAmt])+' | '+convert(nvarchar(max),a.[KamPurnDate]) as 'CompletionMORTH',
                a.[PahaniMudye] as 'Reasons',
                a.[Shera] as 'Remarks'
            FROM BudgetMasterCRF as a 
            join CRFProvision as b on a.WorkID=b.WorkID 
            where b.Arthsankalpiyyear = @year
        `;

        const result = await pool.request()
            .input('year', year)
            .query(query);
        
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error in CrfMPRreport:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching CRF MPR report',
            error: error.message
        });
    }
};

module.exports = { login, verifyOTP, resendOTP, profile, buildingMPRreport, CrfMPRreport, getContractorProjects };
