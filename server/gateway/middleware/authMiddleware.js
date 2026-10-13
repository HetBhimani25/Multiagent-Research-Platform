const jwt = require('jsonwebtoken');
const path = require('path');
if (!process.env.JWT_SECRET) {
  require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
}
const { User } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Authentication required.',
      });
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({
        error: 'Invalid authorization header.',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    });

    if (!decoded.sub) {
      return res.status(401).json({
        error: 'Invalid authorization token.',
      });
    }

    const user = await User.findByPk(decoded.sub, {
      attributes: [
        'id',
        'fullName',
        'email',
        'createdAt',
        'tokenVersion',
      ],
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid authorization token.',
      });
    }

    // Invalidate tokens minted before a password change / security reset
    if (decoded.tokenVersion !== undefined && user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({
        error: 'Session invalidated due to password change. Please re-authenticate.',
      });
    }

    req.user = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      createdAt: user.createdAt,
    };

    return next();

  } catch (error) {
    if (
      error.name === 'TokenExpiredError' ||
      error.name === 'JsonWebTokenError'
    ) {
      return res.status(401).json({
        error: 'Invalid or expired authorization token.',
      });
    }

    console.error('Authentication middleware error:', error);

    return res.status(500).json({
      error: 'Authentication service unavailable.',
    });
  }
};

module.exports = {
  verifyToken,
};
