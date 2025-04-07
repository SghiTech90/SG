const express = require('express');
const cors = require('cors');
const http = require('http');
const axios = require('axios');
require('dotenv').config();
const {
  pool1, pool2, pool3, pool4, pool5, pool6,
  sql, poolConnect1, poolConnect2, poolConnect3, poolConnect4, poolConnect5, poolConnect6
} = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

// ------------------ TEST DB CONNECTION ------------------
const pools = [pool1, pool2, pool3, pool4, pool5, pool6];
pools.forEach((pool, index) => {
  pool.connect()
    .then(() => console.log(`Connected to SQL Server pool ${index + 1} successfully`))
    .catch(err => console.error(`Database connection failed for pool ${index + 1}:`, err));
});

// ------------------ OTP UTILITIES ------------------
const otpStore = {};
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendSMS = async (mobileNo, message) => {
  try {
    const phoneNumber = mobileNo.startsWith('91') ? mobileNo : '91' + mobileNo;
    const encodedMessage = encodeURIComponent(message);
    let apiUrl = `https://login.wishbysms.com/api/sendhttp.php?authkey=${process.env.WISHBY_API_KEY}&mobiles=${phoneNumber}&message=${encodedMessage}&sender=${process.env.WISHBY_SENDER_ID}&route=4&country=91`;
    if (process.env.DLT_TE_ID) apiUrl += `&DLT_TE_ID=${process.env.DLT_TE_ID}`;
    const response = await axios.get(apiUrl);
    return { success: true, response: response.data };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error: error.message };
  }
};

const getPool = async (office) => {
  if (office === 'P_W_Division_Akola') return await poolConnect1, pool1;
  if (office === 'P_W_Division_Washim') return await poolConnect2, pool2;
  if (office === 'P_W_Division_Buldhana') return await poolConnect3, pool3;
  if (office === 'P_W_Division_Khamgaon') return await poolConnect4, pool4;
  if (office === 'P_W_Division_WBAkola') return await poolConnect5, pool5;
  if (office === 'P_W_Circle_Akola') return await poolConnect6, pool6;
  throw new Error('Invalid office selection');
};

// ------------------ CONTROLLERS ------------------

const login = async (req, res) => {
  const { userId, password, office } = req.body;
  if (!userId || !password || !office)
    return res.status(400).json({ message: 'User ID, password, and office are required' });

  try {
    const pool = await getPool(office);
    const result = await pool.request()
      .input('userId', sql.VarChar, userId)
      .query('SELECT Name, UserId, Password, Post, MobileNo FROM SCreateAdmin WHERE UserId = @userId');

    if (result.recordset.length === 0)
      return res.status(404).json({ message: `Invalid credentials - Please Verify your office ${office}`, success: false });

    const user = result.recordset[0];
    if (user.Password !== password)
      return res.status(401).json({ message: 'Invalid password', success: false });

    const otp = generateOTP();
    otpStore[userId] = {
      otp,
      mobileNo: user.MobileNo,
      Name: user.Name,
      post: user.Post,
      expiry: Date.now() + 2 * 60 * 1000
    };

    await sendSMS(user.MobileNo, `Your one time password login (OTP) is ${otp} Please use it to verify your mobile number with -Swapsoft`);
    res.json({
      message: 'OTP sent successfully',
      success: true,
      Name: user.Name,
      userId,
      post: user.Post,
      mobileNo: user.MobileNo.replace(/\d(?=\d{4})/g, '*')
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const verifyOTP = async (req, res) => {
  const { userId, otp } = req.body;
  if (!userId || !otp) return res.status(400).json({ message: 'User ID and OTP are required', success: false });

  try {
    if (!otpStore[userId])
      return res.status(400).json({ message: 'No OTP request found. Please login again.', success: false });

    const otpData = otpStore[userId];
    if (Date.now() > otpData.expiry) {
      delete otpStore[userId];
      return res.status(400).json({ message: 'OTP has expired. Please login again.', success: false });
    }

    if (otpData.otp !== otp)
      return res.status(401).json({ message: 'Invalid OTP', success: false });

    delete otpStore[userId];
    res.json({ message: 'Login successful', userId, post: otpData.post, success: true });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const resendOTP = async (req, res) => {
  const { userId, office } = req.body;
  if (!userId || !office) return res.status(400).json({ message: 'User ID and office are required', success: false });

  try {
    const pool = await getPool(office);
    const result = await pool.request()
      .input('userId', sql.VarChar, userId)
      .query('SELECT UserId, MobileNo, Post FROM SCreateAdmin WHERE UserId = @userId');

    if (result.recordset.length === 0)
      return res.status(404).json({ message: 'User not found', success: false });

    const user = result.recordset[0];
    const otp = generateOTP();
    otpStore[user.UserId] = {
      otp,
      mobileNo: user.MobileNo,
      post: user.Post,
      expiry: Date.now() + 2 * 60 * 1000
    };

    await sendSMS(user.MobileNo, `Your OTP for login is ${otp} - Swapsoft`);
    res.json({ message: 'OTP resent successfully', success: true, userId: user.UserId });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const profile = async (req, res) => {
  const { userId, office } = req.body;
  try {
    const pool = await getPool(office);
    await pool.connect();
    const result = await pool.request()
      .input('userId', sql.VarChar, userId)
      .query('SELECT UserId, Name, Office, Post, MobileNo, Email, Image FROM SCreateAdmin WHERE UserId = @userId');

    if (result.recordset.length === 0)
      return res.status(404).json({ message: 'No user found with this userId', success: false });

    const user = result.recordset[0];
    res.json({
      Image: user.Image,
      Email: user.Email,
      MobileNo: user.MobileNo,
      Post: user.Post,
      Office: user.Office,
      name: user.Name,
      userId: user.UserId
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ------------------ ROUTES ------------------

app.post('/api/data', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and Email are required' });
  }
  res.status(201).json({
    message: 'Data received successfully',
    data: { name, email }
  });
});

app.post('/api/user/login', login);
app.post('/api/user/verify-otp', verifyOTP);
app.post('/api/user/resend-otp', resendOTP);
app.get('/api/user/profile', profile);

// ------------------ DEFAULT & ERROR ROUTES ------------------

app.get('/', (req, res) => {
  res.status(200).send("SGHITECH");
});

app.use((req, res, next) => {
  res.status(404).json({ success: false, message: '404 - Not Found' });
});

app.use((err, req, res, next) => {
  console.error('Global Error:', err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!', error: err.message });
});

// ------------------ SERVER ------------------

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`Server is running on :${PORT}`);
});
