const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const TOKEN_SECRET = process.env.USER_TOKEN_SECRET || 'dronescope-user-secret';
const TOKEN_TTL = '7d';

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function verifyPassword(password, expectedHash) {
  if (!expectedHash) return false;
  return bcrypt.compare(password, expectedHash);
}

function generateUserToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, name: user.name },
    TOKEN_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

function verifyUserToken(token) {
  try {
    const decoded = jwt.verify(token, TOKEN_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

function extractUserToken(req) {
  const userAuthorizationHeader = req.headers['x-user-authorization'] || '';
  const authorizationHeader = userAuthorizationHeader || req.headers.authorization || '';

  return authorizationHeader.startsWith('Bearer ')
    ? authorizationHeader.slice(7)
    : '';
}

module.exports = {
  extractUserToken,
  generateUserToken,
  hashPassword,
  verifyPassword,
  verifyUserToken,
};
