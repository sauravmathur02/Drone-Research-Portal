const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');
const seedDatabase = require('./seedData');
const { startLiveNewsUpdates } = require('./services/newsUpdateService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Database Connection & Server Start
async function startServer() {
  try {
    let mongoUri = process.env.MONGODB_URI;

    // Use memory server if no real URI is provided
    if (!mongoUri) {
      console.log('No MONGODB_URI found. Initializing in-memory MongoDB...');
      const mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
    }

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`Connected to MongoDB Atlas / Memory Server: ${mongoUri.split('@').pop()}`);

    // Seed Data if DB is likely empty
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
