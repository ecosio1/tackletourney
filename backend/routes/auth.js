const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Sign up
router.post('/signup', async (req, res, next) => {
    try {
        const { email, password, username, region, favorite_species } = req.body;

        // Validation
        if (!email || !password || !username) {
            return res.status(400).json({ error: 'Email, password, and username are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Check if email or username already exists
        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email.toLowerCase(), username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'Email or username already exists' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Create user
        const result = await query(
            `INSERT INTO users (email, password_hash, username, region, favorite_species)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, email, username, region, verified_angler, created_at`,
            [email.toLowerCase(), password_hash, username, region, favorite_species || []]
        );

        const user = result.rows[0];

        // Create wallet for user
        await query('INSERT INTO wallets (user_id, balance) VALUES ($1, 0.00)', [user.id]);

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                region: user.region,
                verified_angler: user.verified_angler
            },
            token
        });
    } catch (error) {
        next(error);
    }
});

// Sign in
router.post('/signin', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Get user
        const result = await query(
            'SELECT id, email, password_hash, username, region, verified_angler, fraud_score FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];

        // Check password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check if user is banned
        const banCheck = await query(
            `SELECT * FROM bans
             WHERE user_id = $1
             AND (ban_type = 'permanent' OR (ban_type = 'temporary' AND expires_at > NOW()))`,
            [user.id]
        );

        if (banCheck.rows.length > 0) {
            const ban = banCheck.rows[0];
            return res.status(403).json({
                error: 'Account banned',
                reason: ban.reason,
                ban_type: ban.ban_type,
                expires_at: ban.expires_at
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        res.json({
            message: 'Sign in successful',
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                region: user.region,
                verified_angler: user.verified_angler,
                fraud_score: user.fraud_score
            },
            token
        });
    } catch (error) {
        next(error);
    }
});

// Admin sign in
router.post('/admin/signin', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Get admin user
        const result = await query(
            'SELECT id, email, password_hash, role FROM admin_users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const admin = result.rows[0];

        // Check password
        const validPassword = await bcrypt.compare(password, admin.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { adminId: admin.id, email: admin.email, role: admin.role, isAdmin: true },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        res.json({
            message: 'Admin sign in successful',
            admin: {
                id: admin.id,
                email: admin.email,
                role: admin.role
            },
            token
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
