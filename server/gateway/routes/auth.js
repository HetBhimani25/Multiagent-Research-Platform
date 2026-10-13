const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');
const path = require('path');
if (!process.env.JWT_SECRET) {
  require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
}

const { User, RefreshToken } = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// ── Rate Limiter for Login Attempts ──
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 15 login requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
});

// ── Zod Validation Schemas ──
const registerSchema = z.object({
  fullName: z.string({ required_error: 'Full name is required.' })
    .trim()
    .min(2, 'Full name must be at least 2 characters.')
    .max(100, 'Full name cannot exceed 100 characters.'),
  email: z.string({ required_error: 'Email address is required.' })
    .trim()
    .email('Invalid email address format.')
    .max(255)
    .transform((val) => val.toLowerCase()),
  password: z.string({ required_error: 'Password is required.' })
    .min(8, 'Password must be at least 8 characters long.')
    .max(128, 'Password cannot exceed 128 characters.'),
});

const loginSchema = z.object({
  email: z.string({ required_error: 'Email address is required.' })
    .trim()
    .email('Invalid email address format.')
    .max(255)
    .transform((val) => val.toLowerCase()),
  password: z.string({ required_error: 'Password is required.' })
    .min(1, 'Password is required.')
    .max(128),
});

const updateProfileSchema = z.object({
  fullName: z.string()
    .trim()
    .min(2, 'Full name must be between 2 and 100 characters.')
    .max(100, 'Full name must be between 2 and 100 characters.')
    .optional(),
  currentPassword: z.string().min(1, 'Current password is required to set a new password.').optional(),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters long.')
    .max(128, 'New password cannot exceed 128 characters.')
    .optional(),
}).refine((data) => {
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: 'Current password is required to change to a new password.',
  path: ['currentPassword'],
});

const refreshTokenSchema = z.object({
  refreshToken: z.string({ required_error: 'Refresh token is required.' }).min(1),
});

function getFirstZodError(error) {
  if (error && error.issues && error.issues.length > 0) {
    return error.issues[0].message;
  }
  return 'Invalid request data.';
}

// ── Helper: Issue Dual Tokens (15m Access Token + 7d Refresh Token) ──
async function issueTokenPair(user) {
  // 1. Short-lived Access Token (~15 minutes) with standard 'sub' claim
  const accessToken = jwt.sign(
    {
      sub: user.id,
      tokenVersion: user.tokenVersion || 0,
    },
    JWT_SECRET,
    {
      expiresIn: '15m',
      algorithm: 'HS256',
    }
  );

  // 2. Longer-lived Refresh Token (7 days) with cryptographic randomness
  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await RefreshToken.create({
    userId: user.id,
    tokenHash,
    expiresAt,
    revoked: false,
  });

  return {
    accessToken,
    token: accessToken, // Alias for backward compatibility
    refreshToken: rawRefreshToken,
  };
}

// ── 1. Register User ──
router.post('/register', async (req, res) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: getFirstZodError(parseResult.error) });
    }

    const { fullName, email, password } = parseResult.data;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    // Hash password with bcrypt (salt 12)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User with tokenVersion: 0
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      tokenVersion: 0,
    });

    const tokens = await issueTokenPair(user);

    return res.status(201).json({
      status: 'success',
      ...tokens,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to complete registration: ' + error.message });
  }
});

// ── 2. Login User ──
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: getFirstZodError(parseResult.error) });
    }

    const { email, password } = parseResult.data;

    // Find User (fetch necessary columns including password & tokenVersion)
    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Compare Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const tokens = await issueTokenPair(user);

    return res.json({
      status: 'success',
      ...tokens,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to login: ' + error.message });
  }
});

// ── 3. Refresh Access Token (Token Rotation + Reuse Detection) ──
router.post('/refresh', async (req, res) => {
  try {
    const parseResult = refreshTokenSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: getFirstZodError(parseResult.error) });
    }

    const { refreshToken: rawToken } = parseResult.data;
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const tokenRecord = await RefreshToken.findOne({
      where: { tokenHash },
    });

    // Reuse Detection: If token is found but already revoked, terminate all sessions for this user!
    if (tokenRecord && tokenRecord.revoked) {
      console.warn(`[Security Alert] Refresh token reuse detected for userId: ${tokenRecord.userId}. Revoking all sessions.`);
      await RefreshToken.update({ revoked: true }, { where: { userId: tokenRecord.userId } });
      await User.increment('tokenVersion', { by: 1, where: { id: tokenRecord.userId } });
      return res.status(401).json({
        error: 'Security alert: Refresh token reuse detected. All sessions terminated.',
      });
    }

    // If token record doesn't exist or is expired
    if (!tokenRecord || new Date() > tokenRecord.expiresAt) {
      return res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }

    // Fetch the user
    const user = await User.findByPk(tokenRecord.userId, {
      attributes: ['id', 'fullName', 'email', 'createdAt', 'tokenVersion'],
    });

    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists.' });
    }

    // Rotate Refresh Token: Revoke the used one and issue a new pair
    const newRawRefreshToken = crypto.randomBytes(40).toString('hex');
    const newTokenHash = crypto.createHash('sha256').update(newRawRefreshToken).digest('hex');
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Invalidate old token record and record replacedBy link
    await tokenRecord.update({
      revoked: true,
      replacedByToken: newTokenHash,
    });

    // Create new refresh token record
    await RefreshToken.create({
      userId: user.id,
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
      revoked: false,
    });

    // Generate new Access Token (15m)
    const newAccessToken = jwt.sign(
      {
        sub: user.id,
        tokenVersion: user.tokenVersion || 0,
      },
      JWT_SECRET,
      {
        expiresIn: '15m',
        algorithm: 'HS256',
      }
    );

    return res.json({
      status: 'success',
      token: newAccessToken,
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ error: 'Failed to refresh token: ' + error.message });
  }
});

// ── 4. Logout (Revoke Refresh Token & Invalidate Session) ──
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken: rawToken } = req.body;
    if (rawToken) {
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      await RefreshToken.update({ revoked: true }, { where: { tokenHash } });
    }

    // If request also includes a valid Bearer token, revoke all active sessions for that user
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
        if (decoded.sub) {
          await RefreshToken.update({ revoked: true }, { where: { userId: decoded.sub, revoked: false } });
        }
      } catch (e) {
        // Ignore token errors on logout
      }
    }

    return res.json({ status: 'success', message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Failed to logout cleanly.' });
  }
});

// ── 5. Get Current User Profile (Me) ──
router.get('/me', verifyToken, async (req, res) => {
  return res.json({
    status: 'success',
    user: req.user,
  });
});

// ── 6. Update User Profile & Password (PATCH & POST aliases) ──
const handleProfileUpdate = async (req, res) => {
  try {
    const parseResult = updateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: getFirstZodError(parseResult.error) });
    }

    const { fullName, currentPassword, newPassword } = parseResult.data;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (fullName !== undefined) {
      user.fullName = fullName;
    }

    let passwordChanged = false;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to set a new password.' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Incorrect current password.' });
      }

      // Hash new password with salt 12
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(newPassword, salt);

      // Invalidate existing sessions & old tokens (Requirement 4)
      await RefreshToken.update(
        { revoked: true },
        { where: { userId: user.id, revoked: false } }
      );
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      passwordChanged = true;
    }

    await user.save();

    // If password changed, immediately issue a fresh token pair with new tokenVersion
    if (passwordChanged) {
      const tokens = await issueTokenPair(user);
      return res.json({
        status: 'success',
        message: 'Password updated. Security session refreshed.',
        ...tokens,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    }

    // Only profile info (e.g. fullName) updated
    return res.json({
      status: 'success',
      message: 'Profile updated successfully.',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile: ' + error.message });
  }
};

// Mount both PATCH (Requirement 6) and POST (alias for backward compatibility)
router.patch('/update-profile', verifyToken, handleProfileUpdate);
router.post('/update-profile', verifyToken, handleProfileUpdate);
router.patch('/profile', verifyToken, handleProfileUpdate);

module.exports = router;
