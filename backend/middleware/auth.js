const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const result = await query(
            'SELECT id, email, username, verified_angler, fraud_score FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Check if user is banned
        const banCheck = await query(
            `SELECT * FROM bans
             WHERE user_id = $1
             AND (ban_type = 'permanent' OR (ban_type = 'temporary' AND expires_at > NOW()))`,
            [decoded.userId]
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

        // Attach user to request
        req.user = result.rows[0];
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        next(error);
    }
};

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if it's an admin token
        if (!decoded.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        // Get admin user
        const result = await query(
            'SELECT id, email, role FROM admin_users WHERE id = $1',
            [decoded.adminId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Admin user not found' });
        }

        req.admin = result.rows[0];
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        next(error);
    }
};

module.exports = {
    authenticateToken,
    authenticateAdmin
};
