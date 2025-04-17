require("dotenv").config(); 
const express = require("express");
const cors = require("cors");
const http = require("http");
const axios = require("axios");

const userRoutes = require("./routes/userRoutes");
const allHeadRoutes = require("./routes/allHeadRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const master = require("./routes/masterHeadWise");

const app = express();


app.use(cors());
app.use(express.json());



console.log("Database connection initialization initiated in db.js");



app.use("/api/user", userRoutes);
app.use("/api/allhead", allHeadRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/master", master);

app.post("/api/data", (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and Email are required" });
  }
  res.status(201).json({
    message: "Data received successfully",
    data: { name, email },
  });
});

app.get("/", (req, res) => {
  res.status(200).send("SGHITECH Backend Running - Single DB Pool Version");
});

const apiEndpoints = [
  'http://localhost:3001/api/budget/BudgetMasterNABARD',
  'http://localhost:3001/api/budget/BudgetMaster2515',
  'http://localhost:3001/api/budget/BudgetMasterMP',
  'http://localhost:3001/api/budget/BudgetMasterMLA',
  'http://localhost:3001/api/budget/BudgetMasterGAT_FBC',
  'http://localhost:3001/api/budget/BudgetMasterGAT_D',
  'http://localhost:3001/api/budget/BudgetMasterGAT_A',
  'http://localhost:3001/api/budget/BudgetMasterDPDC',
  'http://localhost:3001/api/budget/BudgetMasterDepositFund',
  'http://localhost:3001/api/budget/BudgetMasterCRF',
  'http://localhost:3001/api/budget/BudgetMasterBuilding',
  'http://localhost:3001/api/budget/BudgetMasterAunty'
];

app.post('/aggregate', async (req, res) => {
  try {
    const { office, position } = req.body;
    
    
    if (!office || !position) {
      return res
        .status(400)
        .json({ success: false, message: "Office and position parameters are required" });
    }
    
    
    const requests = apiEndpoints.map(endpoint => 
      axios.post(endpoint, { office, position })
    );
    
    const responses = await Promise.all(requests);
    
    
    const aggregatedResult = {
      "Work Status": "Active", 
      "Total Work": 0,
      "Estimated Cost": 0,
      "T.S Cost": 0,
      "Budget Provision 2023-2024": 0,
      "Expenditure 2023-2024": 0
    };
    
    
    responses.forEach(response => {
      
      if (response.data && response.data.success && response.data.data && response.data.data.length > 0) {
        const result = response.data.data[0]; 
        
        
        aggregatedResult["Total Work"] += Number(result["Total Work"] || 0);
        aggregatedResult["Estimated Cost"] += Number(result["Estimated Cost"] || 0);
        aggregatedResult["T.S Cost"] += Number(result["T.S Cost"] || 0);
        aggregatedResult["Budget Provision 2023-2024"] += Number(result["Budget Provision 2023-2024"] || 0);
        aggregatedResult["Expenditure 2023-2024"] += Number(result["Expenditure 2023-2024"] || 0);
      }
    });
    
    
    aggregatedResult["Estimated Cost"] = parseFloat(aggregatedResult["Estimated Cost"].toFixed(2));
    aggregatedResult["T.S Cost"] = parseFloat(aggregatedResult["T.S Cost"].toFixed(2));
    aggregatedResult["Budget Provision 2023-2024"] = parseFloat(aggregatedResult["Budget Provision 2023-2024"].toFixed(2));
    aggregatedResult["Expenditure 2023-2024"] = parseFloat(aggregatedResult["Expenditure 2023-2024"].toFixed(2));
    
    
    res.json({
      success: true,
      data: [aggregatedResult]
    });
  } catch (error) {
    console.error('Error aggregating API data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to aggregate API data',
      error: error.message
    });
  }
});

app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "404 - Route Not Found" });
});

app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  const errorMessage =
    process.env.NODE_ENV === "production"
      ? "An internal server error occurred."
      : err.message;
  res
    .status(500)
    .json({
      success: false,
      message: "Something went wrong!",
      error: errorMessage,
    });
});

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

server.on("error", (error) => {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof PORT === "string" ? "Pipe " + PORT : "Port " + PORT;

  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
});
