const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  password: { type: String, required: true, select: false },
  plan: {
    type: String,
    enum: ['Analyst'],
    default: 'Analyst',
  },
  created_at: { type: Date, default: Date.now },
  last_login_at: { type: Date, default: null },
});

module.exports = mongoose.model('User', userSchema);
