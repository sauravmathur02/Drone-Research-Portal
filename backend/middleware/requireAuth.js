const User = require('../models/User');
const { verifyUserToken, extractUserToken } = require('../utils/userAuth');

const requireAuth = async (req, res, next) => {
  try {
    const token = extractUserToken(req);
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Token missing.' });
    }
    
    const payload = verifyUserToken(token);
    
    if (!payload || !payload.sub) {
      return res.status(401).json({ error: 'Authentication failed. Invalid or expired token.' });
    }
    
    const user = await User.findById(payload.sub);
    
    if (!user) {
      return res.status(401).json({ error: 'User associated with this token no longer exists.' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication error.', details: error.message });
  }
};

module.exports = requireAuth;
