const { answerAiQuery } = require('../services/aiService');

exports.query = async (req, res) => {
  try {
    const response = await answerAiQuery({
      query: req.body.query,
      previousQuery: req.body.previousQuery,
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: 'AI intelligence query failed.',
      details: error.message,
    });
  }
};
