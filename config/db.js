const sql = require("mssql");

// Database configuration
const config1 = {
  server: "LAPTOP-1J77NBSS",
  database: "P_W_Division_Akola",
  user: "sa",
  password: "12345678",
  options: {
    trustServerCertificate: true,
    encrypt: false
  }
};

const config2 = {
  server: "LAPTOP-1J77NBSS",
  database: "P_W_Division_Washim",
  user: "sa",
  password: "12345678",
  options: {
    trustServerCertificate: true,
    encrypt: false
  }
};

const config3 = {
  server: "LAPTOP-1J77NBSS",
  database: "P_W_Division_Buldhane",
  user: "sa",
  password: "12345678",
  options: {
    trustServerCertificate: true,
    encrypt: false
  }
};

const config4 = {
  server: "LAPTOP-1J77NBSS",
  database: "P_W_Division_Khamgaon",
  user: "sa",
  password: "12345678",
  options: {
    trustServerCertificate: true,
    encrypt: false
  }
};

const config5 = {
  server: "LAPTOP-1J77NBSS",
  database: "P_W_Division_WBAkola",
  user: "sa",
  password: "12345678",
  options: {
    trustServerCertificate: true,
    encrypt: false
  }
};

const config6 = {
  server: "LAPTOP-1J77NBSS",
  database: "P_W_Circle_Akola",
  user: "sa",
  password: "12345678",
  options: {
    trustServerCertificate: true,
    encrypt: false
  }
};


// Create connection pool
const pool1 = new sql.ConnectionPool(config1);

const pool2 = new sql.ConnectionPool(config2);

const pool3 = new sql.ConnectionPool(config3);

const pool4 = new sql.ConnectionPool(config4);

const pool5 = new sql.ConnectionPool(config5);

const pool6 = new sql.ConnectionPool(config6);

// Initialize pool connection
const poolConnect1 = pool1.connect().catch(err => {
  console.error('Database 1 connection failed:', err);
});

const poolConnect2 = pool2.connect().catch(err => {
  console.error('Database 2 connection failed:', err);
});

const poolConnect3 = pool3.connect().catch(err => {
  console.error('Database 3 connection failed:', err);
});

const poolConnect4 = pool4.connect().catch(err => {
  console.error('Database 4 connection failed:', err);
});

const poolConnect5 = pool5.connect().catch(err => {
  console.error('Database 5 connection failed:', err);
});

const poolConnect6 = pool6.connect().catch(err => {
  console.error('Database 6 connection failed:', err);
});

// Handle connection errors
pool1.on('error', err => {
  console.error('SQL Database1 Connection Error:', err);
});

pool2.on('error', err => {
  console.error('SQL Database2 Connection Error:', err);
});

pool3.on('error', err => {
  console.error('SQL Database3 Connection Error:', err);
});

pool4.on('error', err => {
  console.error('SQL Database4 Connection Error:', err);
});

pool5.on('error', err => {
  console.error('SQL Database5 Connection Error:', err);
});

pool6.on('error', err => {
  console.error('SQL Database6 Connection Error:', err);
});

// Export the sql library and pool directly (avoid circular dependencies)
module.exports = {
  sql,
  pool1,
  pool2,
  pool3,
  pool4,
  pool5,
  pool6,
  poolConnect1,
  poolConnect2,
  poolConnect3,
  poolConnect4,
  poolConnect5,
  poolConnect6
}; 
