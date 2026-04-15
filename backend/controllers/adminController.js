const { generateAdminToken, getAdminCredentials, verifyAdminToken } = require('../utils/adminAuth');

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const credentials = getAdminCredentials();

  if (username !== credentials.username || password !== credentials.password) {
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }

  res.json({
    token: generateAdminToken(username),
    username,
  });
};

exports.session = async (req, res) => {
  const authorizationHeader = req.headers.authorization || '';
  const token = authorizationHeader.startsWith('Bearer ')
    ? authorizationHeader.slice(7)
    : '';
  const payload = verifyAdminToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Admin session is invalid or expired.' });
  }

  res.json({
    username: payload.username,
    expires_at: payload.exp,
  });
};
