const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) { throw new Error('JWT_SECRET must be configured'); }

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, });

// Register User
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Please provide full name, email, and password.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    const user = await User.create({ fullName: fullName.trim(), email: email.toLowerCase().trim(), password: hashedPassword, });

    // Generate JWT token
    const token = jwt.sign( { id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' } );

    return res.status(201).json({ status: 'success', token, user: {
        id: user.id, fullName: user.fullName, email: user.email, createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Unable to complete registration.' });
  }
});

// Login User
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password.' });
    }

    // Find User
    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Compare Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT token
    const token = jwt.sign( { id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' } );

    return res.json({ status: 'success', token, user: {
        id: user.id, fullName: user.fullName, email: user.email, createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to login: ' + error.message });
  }
});

// Get Current User Profile
router.get('/me', verifyToken, async (req, res) => {
  return res.json({
    status: 'success',
    user: req.user,
  });
});

// Update User Profile / Password
router.post('/update-profile', verifyToken, async (req, res) => {
  try {
    const { fullName, currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (fullName !== undefined) {
      const normalizedName = fullName.trim();
      if (normalizedName.length < 2 || normalizedName.length > 100) {
        return res.status(400).json({ error: 'Full name must be between 2 and 100 characters.' });
      }
      user.fullName = normalizedName;
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to set a new password.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Incorrect current password.' });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    return res.json({ status: 'success', user: {
        id: user.id, fullName: user.fullName, email: user.email, createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update profile: ' + error.message });
  }
});

module.exports = router;
