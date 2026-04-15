const crypto = require('crypto');

const TOKEN_SECRET = process.env.USER_TOKEN_SECRET || 'dronescope-user-secret';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const HASH_ITERATIONS = 120000;
const HASH_LENGTH = 64;
const HASH_DIGEST = 'sha512';

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto
    .pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_LENGTH, HASH_DIGEST)
    .toString('hex');

  return { hash, salt };
}

function verifyPassword(password, salt, expectedHash) {
  const { hash } = hashPassword(password, salt);

  if (!expectedHash || hash.length !== expectedHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
}

function createSignature(payload) {
  return crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
}

function generateUserToken(user) {
  const data = JSON.stringify({
    sub: user._id.toString(),
    email: user.email,
    name: user.name,
    exp: Date.now() + TOKEN_TTL_MS,
  });
  const encodedPayload = Buffer.from(data).toString('base64url');
  const signature = createSignature(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function verifyUserToken(token) {
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

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));

    if (!payload.exp || payload.exp < Date.now() || !payload.sub) {
      return null;
    }

    return payload;
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
