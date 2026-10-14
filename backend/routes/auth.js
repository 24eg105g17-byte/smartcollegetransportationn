// routes/auth.js - Authentication endpoints (Sign Up, Login, Me, Logout)
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  findUserByEmail,
  findUserByStudentId,
  findUserById,
  createUser
} from '../db.js';

export const authRouter = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'uni-transit-smart-college-secret-key-2026';
const JWT_EXPIRES_IN = '7d';

/**
 * Middleware: Verify JWT Bearer token and populate req.user
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied: No authentication token provided.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Access denied: Malformed token.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token payload.' });
    }

    const user = await findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User account no longer exists.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }
}

/**
 * POST /api/auth/signup
 * Register a new user account with bcrypt password hashing
 */
authRouter.post('/signup', async (req, res) => {
  try {
    const { name, email, studentId, password, confirmPassword, role } = req.body;

    // 1. Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Full name is required (at least 2 characters).' });
    }

    if (!email || typeof email !== 'string' || !email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ error: 'A valid college email address is required.' });
    }

    if (!studentId || typeof studentId !== 'string' || studentId.trim().length < 3) {
      return res.status(400).json({ error: 'Student ID or Roll Number is required (at least 3 characters).' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    // 2. Normalize inputs
    const cleanName = name.trim();
    const cleanEmail = email.toLowerCase().trim();
    const cleanStudentId = studentId.toUpperCase().trim();
    const cleanRole = (role && ['student', 'driver', 'admin'].includes(role.toLowerCase().trim()))
      ? role.toLowerCase().trim()
      : 'student';

    // 3. Check for existing accounts
    const existingByEmail = await findUserByEmail(cleanEmail);
    if (existingByEmail) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const existingById = await findUserByStudentId(cleanStudentId);
    if (existingById) {
      return res.status(409).json({ error: 'An account with this Student ID / Roll Number already exists.' });
    }

    // 4. Hash password with bcrypt (10 rounds)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 5. Store user in persistent database
    const newUser = await createUser({
      name: cleanName,
      email: cleanEmail,
      studentId: cleanStudentId,
      passwordHash,
      role: cleanRole
    });

    // 6. Generate signed JWT token
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        studentId: newUser.studentId,
        role: newUser.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        studentId: newUser.studentId,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });
  } catch (err) {
    console.error('[Auth] Signup error:', err);
    return res.status(500).json({ error: 'An unexpected error occurred during signup. Please try again.' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate with email or student ID and password
 */
authRouter.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return res.status(400).json({ error: 'Email or Student ID is required.' });
    }

    if (!password || typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    const cleanIdentifier = identifier.trim();

    // Look up by email or student ID
    let user = null;
    if (cleanIdentifier.includes('@')) {
      user = await findUserByEmail(cleanIdentifier);
    } else {
      user = await findUserByStudentId(cleanIdentifier);
    }

    // Fallback search if not found on first attempt
    if (!user) {
      user = await findUserByEmail(cleanIdentifier) || await findUserByStudentId(cleanIdentifier);
    }

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email/Student ID or password.' });
    }

    // Verify password with bcrypt
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email/Student ID or password.' });
    }

    // Generate signed JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        studentId: user.studentId,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ error: 'An unexpected error occurred during login. Please try again.' });
  }
});

/**
 * GET /api/auth/me
 * Protected endpoint returning the currently authenticated user
 */
authRouter.get('/me', requireAuth, (req, res) => {
  res.status(200).json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      studentId: req.user.studentId,
      role: req.user.role,
      createdAt: req.user.createdAt
    }
  });
});

/**
 * POST /api/auth/logout
 * Client-side logout acknowledgment
 */
authRouter.post('/logout', (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
});
