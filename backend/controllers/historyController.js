const History = require('../models/History');

exports.getHistory = async (req, res) => {
  try {
    const history = await History.find({ user_id: req.user._id })
      .sort({ timestamp: 1 })
      .lean();
      
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve history.', details: error.message });
  }
};
