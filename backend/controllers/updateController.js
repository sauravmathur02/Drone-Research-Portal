const Update = require('../models/Update');
const { addClient, writeEvent } = require('../utils/updateStream');

exports.getUpdates = async (req, res) => {
  try {
    const filters = {};

    if (req.query.country) {
      filters.country = req.query.country;
    }

    if (req.query.severity) {
      filters.severity = req.query.severity;
    }

    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const updates = await Update.find(filters).sort({ timestamp: -1 }).limit(limit);

    res.json(updates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.streamUpdates = async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  writeEvent(res, 'connected', {
    message: 'DroneScope AI live updates stream connected.',
    timestamp: new Date().toISOString(),
  });

  const removeClient = addClient(res);

  req.on('close', () => {
    removeClient();
    res.end();
  });
};
