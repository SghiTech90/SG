const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const allHeadRoutes = require('./routes/allHeadRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { pool1, pool2, pool3, pool4, pool5, pool6 } = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection
pool1.connect()
    .then(() => {
        console.log('Connected to SQL Server successfully');
    })
    .catch(err => {
        console.error('Database connection failed:', err);
    });

pool2.connect()
    .then(() => {
        console.log('Connected to SQL Server successfully');
    })
    .catch(err => {
        console.error('Database connection failed:', err);
    });

pool3.connect()
    .then(() => {
        console.log('Connected to SQL Server successfully');
    })
    .catch(err => {
        console.error('Database connection failed:', err);
    });

pool4.connect()
    .then(() => {
        console.log('Connected to SQL Server successfully');
    })
    .catch(err => {
        console.error('Database connection failed:', err);
    });

pool5.connect()
    .then(() => {
        console.log('Connected to SQL Server successfully');
    })
    .catch(err => {
        console.error('Database connection failed:', err);
    });

pool6.connect()
    .then(() => {
        console.log('Connected to SQL Server successfully');
    })
    .catch(err => {
        console.error('Database connection failed:', err);
    });

// Routes
app.use('/api/user', userRoutes);
app.use('/api/allhead', allHeadRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req,res)=>{
    res.status(200).send("Welcome to SGHITECH -Swapnil")
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false,
        message: 'Something went wrong!', 
        error: err.message 
    });
});


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 