require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const apiRoutes = require('./routes/api');
const { ensureSeedData } = require('./seedData');
const discoveryService = require('./services/newsUpdateService');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Performance Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());
app.use(morgan('dev'));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', apiLimiter);

// Routes
app.use('/api', apiRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Database Connection & Automated Discovery Startup
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/drone_research_portal')
  .then(async () => {
    console.log('[DB] Connected to MongoDB');
    await ensureSeedData();
    discoveryService.startCronJobs();

    app.listen(PORT, () => {
      console.log(`[Server] Drone Research Portal API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[DB] Connection Error:', err.message);
    process.exit(1);
  });
