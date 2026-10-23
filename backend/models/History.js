const mongoose = require('mongoose');

const historySchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    question: { type: String },
    answer: { type: String },
    year: { type: Number, index: true },
    title: { type: String },
    era: { type: String },
    description: { type: String },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('History', historySchema);
