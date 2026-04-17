require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const seedDatabase = require('./seedData');
const { startLiveNewsUpdates } = require('./services/newsUpdateService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174'] : '*';

app.use(cors({
  origin: allowedOrigins
}));
app.use(express.json());

// Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Database Connection & Server Start
async function startServer() {
  try {
    // Connect to MongoDB Atlas (via config/db.js)
    await connectDB();

    // Optionally seed Data if DB is likely empty
    await seedDatabase();
    await startLiveNewsUpdates();

    app.listen(PORT, () => {
      console.log(`🚀 DroneScope AI Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
