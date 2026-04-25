const { answerAiQuery } = require('../services/aiService');
const History = require('../models/History');
const { verifyUserToken, extractUserToken } = require('../utils/userAuth');

exports.query = async (req, res) => {
  try {
    const response = await answerAiQuery({
      query: req.body.query,
      previousQuery: req.body.previousQuery,
    });

    const token = extractUserToken(req);
    if (token) {
      try {
        const payload = verifyUserToken(token);
        if (payload && payload.sub) {
          await History.create({
            user_id: payload.sub,
            question: req.body.query,
            answer: response.analysis || response.answer, // Unified field
          });
        }
      } catch (historyErr) {
        console.warn('History persistence skipped:', historyErr.message);
      }
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: 'AI intelligence query failed.',
      details: error.message,
    });
  }
};
