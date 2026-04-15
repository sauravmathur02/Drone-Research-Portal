const { verifyAdminToken } = require('../utils/adminAuth');

module.exports = function requireAdminAuth(req, res, next) {
  const authorizationHeader = req.headers.authorization || '';
  const token = authorizationHeader.startsWith('Bearer ')
    ? authorizationHeader.slice(7)
    : '';

  const payload = verifyAdminToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Admin authentication required.' });
  }

  req.adminUser = payload;
  next();
};
