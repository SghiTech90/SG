require('dotenv').config(); // Load environment variables first
const express = require('express');
const cors = require('cors');
const http = require('http');
const axios = require('axios');

const userRoutes = require('./routes/userRoutes');
const allHeadRoutes = require('./routes/allHeadRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ------------------ DB CONNECTION ------------------
// Connection is now handled entirely within db.js and controllers use getConnectedPool
console.log("Database connection initialization initiated in db.js");

// ------------------ ROUTES ------------------

app.use('/api/user', userRoutes);
app.use('/api/allhead', allHeadRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/notifications', notificationRoutes);


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


app.get('/', (req, res) => {
  res.status(200).send("SGHITECH Backend Running - Single DB Pool Version");
});

app.use((req, res, next) => {
  res.status(404).json({ success: false, message: '404 - Route Not Found' });
});

app.use((err, req, res, next) => {
  console.error('Global Error:', err.stack);
  const errorMessage = process.env.NODE_ENV === 'production' ? 'An internal server error occurred.' : err.message;
  res.status(500).json({ success: false, message: 'Something went wrong!', error: errorMessage });
});


const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string'
    ? 'Pipe ' + PORT
    : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});
