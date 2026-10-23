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

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(mongoSanitize());
app.use(morgan('dev'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', apiLimiter);

// 1. Mount Core API Routes
app.use('/api', apiRoutes);

// 2. Mount Original Repo Auth & AI Routes so zero existing features break
try {
  const authRoutes = require('./routes/authRoutes');
  app.use('/api/auth', authRoutes);
} catch (_) {}

try {
  const aiRoutes = require('./routes/aiRoutes');
  app.use('/api/ai', aiRoutes);
} catch (_) {}

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    architecture: 'Pro Multi-Controller + Automated Discovery + Academic Lab',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/drone_research_portal')
  .then(async () => {
    console.log('[DB] Connected to MongoDB');
    await ensureSeedData();

    // Initialize TF-IDF Search Index if available in utils
    try {
      const tfidfSearch = require('./utils/droneTfidfSearch');
      if (typeof tfidfSearch.rebuildIndex === 'function') {
        await tfidfSearch.rebuildIndex();
        console.log('[Search] TF-IDF Drone Search Index initialized.');
      }
    } catch (_) {}

    discoveryService.startCronJobs();

    app.listen(PORT, () => {
      console.log(`[Server] Pro Drone Research Portal running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[DB] Connection Error:', err.message);
    process.exit(1);
  });
