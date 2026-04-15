const User = require('../models/User');
const {
  extractUserToken,
  generateUserToken,
  hashPassword,
  verifyPassword,
  verifyUserToken,
} = require('../utils/userAuth');

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    plan: user.plan,
  };
}

function normalizeEmail(email = '') {
  return email.trim().toLowerCase();
}

function validateAuthPayload({ name, email, password }, mode) {
  if (mode === 'signup' && !String(name || '').trim()) {
    return 'Name is required.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email))) {
    return 'Enter a valid email address.';
  }

  if (!password || String(password).length < 8) {
    return 'Password must be at least 8 characters.';
  }

  return '';
}

exports.signup = async (req, res) => {
  try {
    const validationError = validateAuthPayload(req.body, 'signup');

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const email = normalizeEmail(req.body.email);
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ error: 'An account already exists for this email.' });
    }

    const { hash, salt } = hashPassword(req.body.password);
    const user = await User.create({
      name: req.body.name.trim(),
      email,
      password_hash: hash,
      password_salt: salt,
      last_login_at: new Date(),
    });

    res.status(201).json({
      token: generateUserToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    res.status(500).json({ error: 'Unable to create account.', details: error.message });
  }
};

exports.signin = async (req, res) => {
  try {
    const validationError = validateAuthPayload(req.body, 'signin');

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email }).select('+password_hash +password_salt');

    if (!user || !verifyPassword(req.body.password, user.password_salt, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    user.last_login_at = new Date();
    await user.save();

    res.json({
      token: generateUserToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    res.status(500).json({ error: 'Unable to sign in.', details: error.message });
  }
};

exports.session = async (req, res) => {
  try {
    const payload = verifyUserToken(extractUserToken(req));

    if (!payload) {
      return res.status(401).json({ error: 'User session is invalid or expired.' });
    }

    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ error: 'User session is invalid or expired.' });
    }

    res.json({ user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ error: 'Unable to verify session.', details: error.message });
  }
};
