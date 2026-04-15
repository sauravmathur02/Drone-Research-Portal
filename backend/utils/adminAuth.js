const crypto = require('crypto');

const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'dronescope-admin-secret';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 8;

function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  };
}

function createSignature(payload) {
  return crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
}

function generateAdminToken(username) {
  const data = JSON.stringify({
    username,
    exp: Date.now() + TOKEN_TTL_MS,
  });
  const encodedPayload = Buffer.from(data).toString('base64url');
  const signature = createSignature(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function verifyAdminToken(token) {
  if (!token || !token.includes('.')) {
    return null;
  }

  const [encodedPayload, signature] = token.split('.');
  const expectedSignature = createSignature(encodedPayload);

  if (!signature || signature.length !== expectedSignature.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));

  if (!payload.exp || payload.exp < Date.now()) {
    return null;
  }

  return payload;
}

module.exports = {
  generateAdminToken,
  getAdminCredentials,
  verifyAdminToken,
};
