const { pool1, pool2, sql, poolConnect1, poolConnect2, pool3, pool4, pool5, pool6, poolConnect3, poolConnect4, poolConnect5, poolConnect6 } = require('../config/db');
const axios = require('axios');
require('dotenv').config();

// WishbySMS configuration
const wishbyApiKey = process.env.WISHBY_API_KEY;
const wishbySenderId = process.env.WISHBY_SENDER_ID;

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

// Function to select database pool
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

// Login and send OTP
const login = async (req, res) => {
  const { userId, password, office } = req.body;
  
  if (!userId || !password || !office) {
    return res.status(400).json({ message: 'User ID, password, and office are required' });
  }

  try {
    const pool = await getPool(office);
    const result = await pool.request()
      .input('userId', sql.VarChar, userId)
      .query('SELECT UserId, Password, Post, MobileNo FROM SCreateAdmin WHERE UserId = @userId');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: `Invalid credentials - Please Verify your office ${office}`, success: false });
    }
    
    const user = result.recordset[0];
    if (user.Password !== password) {
      return res.status(401).json({ message: 'Invalid password', success: false });
    }

    const otp = generateOTP();
    otpStore[userId] = { otp, mobileNo: user.MobileNo, post: user.Post, expiry: Date.now() + 2 * 60 * 1000 };

    await sendSMS(user.MobileNo, `Your one time password login (OTP) is ${otp}  Please use it to verify your mobile number with -Swapsoft`);
    
    res.json({ message: 'OTP sent successfully', success: true, userId, post: user.Post, mobileNo: user.MobileNo.replace(/\d(?=\d{4})/g, '*') });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  const { userId, otp } = req.body;
  
  if (!userId || !otp) {
    return res.status(400).json({ message: 'User ID and OTP are required', success: false });
  }

  try {
    if (!otpStore[userId]) {
      return res.status(400).json({ message: 'No OTP request found. Please login again.', success: false });
    }
    
    const otpData = otpStore[userId];

    if (Date.now() > otpData.expiry) {
      delete otpStore[userId];
      return res.status(400).json({ message: 'OTP has expired. Please login again.', success: false });
    }

    if (otpData.otp !== otp) {
      return res.status(401).json({ message: 'Invalid OTP', success: false });
    }

    delete otpStore[userId];

    res.json({ message: 'Login successful', userId, post: otpData.post, success: true });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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
    const result = await pool.request()
      .input('userId', sql.VarChar, userId)
      .query('SELECT UserId, MobileNo, Post FROM SCreateAdmin WHERE UserId = @userId');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found', success: false });
    }

    const user = result.recordset[0];
    const otp = generateOTP();
    otpStore[userId] = { otp, mobileNo: user.MobileNo, post: user.Post, expiry: Date.now() + 2 * 60 * 1000 };

    await sendSMS(user.MobileNo, `Your OTP for login is ${otp} - Swapsoft`);

    res.json({ message: 'OTP resent successfully', success: true, userId });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const profile = async (req, res) => {
  const { userId, office } = req.body;
  
  console.log(`Trying to fetch user Data ${userId}`);
  
  try {
    const pool = await getPool(office);
    await pool.connect();
    
    // Query user from SCreateAdmin table using mobile number
    const result = await pool.request()
      .input('userId', sql.VarChar, userId)
      .query('select UserId,Name,Office,Post,MobileNo,Email,Image from SCreateAdmin where UserId = @userId');
    
    // Check if user exists
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'No user found with this userId', success: 'false' });
    }
    
    const user = result.recordset[0];
    console.log(user);
    
    //const userId = user.UserId;

    // Return success but don't include sensitive information
    res.json({ 
      Image: user.Image,
      Email: user.Email,
      MobileNo: user.MobileNo,
      Post: user.Post,
      Office: user.Office,
      name: user.Name,
      userId: user.UserId,
      success: 'true',
    });
    
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message, success: 'false' });
  }
};

// Get Building MPR Report
const buildingMPRreport = async (req, res) => {
    try {
        const { year, office } = req.body;
        
        if (!year) {
            return res.status(400).json({
                success: false,
                message: 'Year parameter is required'
            });
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
            WHERE b.Arthsankalpiyyear = @year`
        ;

        const pool = await getPool(office);
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

// Get CRF MPR Report
const CrfMPRreport = async (req, res) => {
    try {
        const { year, office } = req.body;
        
        if (!year) {
            return res.status(400).json({
                success: false,
                message: 'Year parameter is required'
            });
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
            where b.Arthsankalpiyyear = @year`
        ;
        const pool = await getPool(office);

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

module.exports = { login, verifyOTP, resendOTP, profile, buildingMPRreport, CrfMPRreport };
