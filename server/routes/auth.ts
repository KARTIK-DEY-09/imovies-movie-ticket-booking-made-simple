import express from 'express';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User.ts';
import { authMiddleware, generateToken, AuthenticatedRequest } from '../middleware/auth.ts';

export const authRouter = express.Router();

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // Check email uniqueness
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}`;

    const newUser = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      phone: phone?.trim() || '',
      role: 'user', // Public signup is always standard user
      watchlist: [],
      avatar,
    });

    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Registration successful!',
      user: newUser.toSafeObject(),
      token,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ message: err.message || 'Server error during registration.' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful!',
      user: user.toSafeObject(),
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message || 'Server error during login.' });
  }
});

// GET /api/auth/me
authRouter.get('/me', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  res.json({ user: req.user.toSafeObject() });
});

// PUT /api/auth/profile
authRouter.put('/profile', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { username, phone, avatar } = req.body;
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (username) user.username = username.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user.toSafeObject(),
    });
  } catch (err: any) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: err.message || 'Error updating profile.' });
  }
});

// PUT /api/auth/change-password
authRouter.put('/change-password', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully!' });
  } catch (err: any) {
    console.error('Change password error:', err);
    res.status(500).json({ message: err.message || 'Error updating password.' });
  }
});
